import "server-only";
import { createHash } from "node:crypto";
import type { Rupiah } from "@/domain/money/money";
import { rupiah } from "@/domain/money/money";
import { db } from "@/lib/db/client";
import {
  INSTALLMENT_PAYMENT_MIME,
  INSTALLMENT_PAYMENT_STATUSES,
  MAX_PAYMENT_PROOF_BYTES,
} from "@/lib/db/schema/payments";
import { inTransaction } from "@/lib/db/tx";
import { newId } from "@/lib/id";
import { getCurrentUser } from "@/lib/session";
import { appendAudit, prepareAudit } from "./audit";
import { requireRole } from "./dal";
import { sniffDocumentMime } from "./documents";
import { rolesOf } from "./roles";

export type PaymentStatus = (typeof INSTALLMENT_PAYMENT_STATUSES)[number];

export type InstallmentPaymentSummary = {
  readonly id: string;
  readonly installmentId: string;
  readonly periodNo: number;
  readonly amount: Rupiah;
  readonly senderName: string;
  readonly status: PaymentStatus;
  readonly submittedAt: string;
  readonly verifiedAt: string | null;
  readonly rejectionReason: string | null;
};

export type PaymentQueueItem = {
  readonly id: string;
  readonly facilityPublicRef: string;
  readonly studentName: string;
  readonly periodNo: number;
  readonly tenorMonths: number;
  readonly amount: Rupiah;
  readonly senderName: string;
  readonly note: string | null;
  readonly proofMime: string;
  readonly proofSize: number;
  readonly submittedAt: string;
};

export type PaymentWriteResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly code: string };

export type SubmitPaymentResult =
  | { readonly ok: true; readonly paymentId: string }
  | { readonly ok: false; readonly code: SubmitPaymentError };

export type SubmitPaymentError =
  | "installment_not_found"
  | "installment_settled"
  | "amount_mismatch"
  | "invalid_proof"
  | "payment_pending_exists";

type InstallmentContextRow = {
  id: string;
  period_no: number;
  total_amount: number;
  status: string;
  schedule_id: string;
  schedule_status: string;
  facility_id: string;
  student_id: string;
};

type MyPaymentRow = {
  id: string;
  installment_id: string;
  period_no: number;
  amount: number;
  sender_name: string;
  status: string;
  submitted_at: string;
  verified_at: string | null;
  rejection_reason: string | null;
};

type QueueRow = {
  id: string;
  facility_public_ref: string;
  student_name: string;
  period_no: number;
  tenor_months: number;
  amount: number;
  sender_name: string;
  note: string | null;
  proof_mime: string;
  proof_size: number;
  submitted_at: string;
};

type PaymentRow = {
  id: string;
  installment_id: string;
  schedule_id: string;
  facility_id: string;
  status: string;
};

const SELECT_INSTALLMENT_CONTEXT = `SELECT ins.id, ins.period_no,
  ins.total_amount, ins.status, ins.schedule_id,
  rs.status AS schedule_status, ins.facility_id, f.student_id
FROM installments ins
JOIN repayment_schedules rs ON rs.id = ins.schedule_id
JOIN financing_facilities f ON f.id = ins.facility_id
JOIN students s ON s.id = f.student_id
WHERE ins.id = ? AND s.user_id = ?`;

const INSERT_PAYMENT = `INSERT INTO installment_payments (
  id, installment_id, facility_id, student_id, amount, sender_name, note,
  proof_mime, proof_size, proof_sha256, proof_data, status, submitted_at,
  verified_by, verified_at, rejection_reason, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, NULL, NULL, NULL, ?, ?)`;

const SELECT_MY_PAYMENTS = `SELECT p.id, p.installment_id, ins.period_no,
  p.amount, p.sender_name, p.status, p.submitted_at, p.verified_at,
  p.rejection_reason
FROM installment_payments p
JOIN installments ins ON ins.id = p.installment_id
JOIN financing_facilities f ON f.id = p.facility_id
JOIN students s ON s.id = f.student_id
WHERE s.user_id = ?
ORDER BY p.submitted_at DESC, p.id DESC`;

const SELECT_PAYMENT_QUEUE = `SELECT p.id, p.amount, p.sender_name, p.note,
  p.proof_mime, p.proof_size, p.submitted_at,
  f.public_ref AS facility_public_ref, rs.tenor_months,
  ins.period_no, s.full_name AS student_name
FROM installment_payments p
JOIN installments ins ON ins.id = p.installment_id
JOIN repayment_schedules rs ON rs.id = ins.schedule_id
JOIN financing_facilities f ON f.id = p.facility_id
JOIN students s ON s.id = p.student_id
WHERE p.status = 'submitted'
ORDER BY p.submitted_at, p.id`;

const SELECT_PAYMENT_FOR_REVIEW = `SELECT p.id, p.installment_id,
  p.facility_id, ins.schedule_id, p.status
FROM installment_payments p
JOIN installments ins ON ins.id = p.installment_id
WHERE p.id = ?`;

const SELECT_PAYMENT_PROOF = `SELECT p.id, p.proof_mime, p.proof_data,
  s.user_id AS owner_user_id
FROM installment_payments p
JOIN students s ON s.id = p.student_id
WHERE p.id = ?`;

const VERIFY_PAYMENT = `UPDATE installment_payments
SET status = 'verified', verified_by = ?, verified_at = ?
WHERE id = ? AND status = 'submitted'`;

const REJECT_PAYMENT = `UPDATE installment_payments
SET status = 'rejected', verified_by = ?, verified_at = ?, rejection_reason = ?
WHERE id = ? AND status = 'submitted'`;

const SETTLE_INSTALLMENT = `UPDATE installments
SET status = 'paid', paid_at = ?
WHERE id = ? AND status IN ('due', 'partially_paid')`;

const COUNT_OPEN_INSTALLMENTS = `SELECT COUNT(*) AS open_count FROM installments
WHERE schedule_id = ? AND status IN ('due', 'partially_paid')`;

const COMPLETE_SCHEDULE = `UPDATE repayment_schedules
SET status = 'completed', updated_at = ?
WHERE id = ? AND status = 'active'`;

const CLOSE_FACILITY = `UPDATE financing_facilities
SET status = 'paid_off', closed_at = ?
WHERE id = ? AND status = 'active'`;

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return (INSTALLMENT_PAYMENT_STATUSES as readonly string[]).includes(value);
}

function toSummary(row: MyPaymentRow): InstallmentPaymentSummary | null {
  if (!isPaymentStatus(row.status)) return null;
  return {
    id: row.id,
    installmentId: row.installment_id,
    periodNo: row.period_no,
    amount: rupiah(row.amount),
    senderName: row.sender_name,
    status: row.status,
    submittedAt: row.submitted_at,
    verifiedAt: row.verified_at,
    rejectionReason: row.rejection_reason,
  };
}

function paymentWriteError(error: unknown): SubmitPaymentError | null {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("installment_payments.installment_id") ||
    message.includes("uq_installment_payments_open")
  ) {
    return "payment_pending_exists";
  }
  return null;
}

export function latestOf(
  payments: readonly InstallmentPaymentSummary[],
): ReadonlyMap<string, InstallmentPaymentSummary> {
  const map = new Map<string, InstallmentPaymentSummary>();
  for (const payment of payments) {
    if (!map.has(payment.installmentId)) {
      map.set(payment.installmentId, payment);
    }
  }
  return map;
}

export async function listMyPayments(): Promise<
  readonly InstallmentPaymentSummary[]
> {
  const user = await getCurrentUser();
  if (user === null) return [];
  const rows = (await db.prepare(SELECT_MY_PAYMENTS).all(user.id)) as
    | MyPaymentRow[]
    | undefined;
  return (rows ?? [])
    .map(toSummary)
    .filter((item): item is InstallmentPaymentSummary => item !== null);
}

export async function submitMyPayment(input: {
  readonly installmentId: string;
  readonly amount: number;
  readonly senderName: string;
  readonly note?: string | undefined;
  readonly bytes: Uint8Array;
}): Promise<SubmitPaymentResult> {
  const user = await getCurrentUser();
  if (user === null) return { ok: false, code: "installment_not_found" };
  const database = db;
  const context = (await database
    .prepare(SELECT_INSTALLMENT_CONTEXT)
    .get(input.installmentId, user.id)) as InstallmentContextRow | undefined;
  if (context === undefined) {
    return { ok: false, code: "installment_not_found" };
  }
  if (context.status !== "due" && context.status !== "partially_paid") {
    return { ok: false, code: "installment_settled" };
  }
  if (input.amount !== context.total_amount) {
    return { ok: false, code: "amount_mismatch" };
  }
  const bytes = input.bytes;
  const mime = sniffDocumentMime(bytes);
  if (
    bytes.length === 0 ||
    bytes.length > MAX_PAYMENT_PROOF_BYTES ||
    mime === null ||
    !(INSTALLMENT_PAYMENT_MIME as readonly string[]).includes(mime)
  ) {
    return { ok: false, code: "invalid_proof" };
  }
  const occurredAt = new Date();
  const stamp = occurredAt.toISOString();
  const paymentId = newId(occurredAt.getTime());
  const prepared = await prepareAudit({
    actorType: "user",
    actorId: user.id,
    action: "installment.payment_submitted",
    entityType: "installment_payment",
    entityId: paymentId,
    after: {
      installmentId: context.id,
      periodNo: context.period_no,
      amount: context.total_amount,
      proofMime: mime,
      proofSha256: sha256Hex(bytes),
    },
  });
  try {
    await inTransaction(database, async () => {
      await database
        .prepare(INSERT_PAYMENT)
        .run(
          paymentId,
          context.id,
          context.facility_id,
          context.student_id,
          context.total_amount,
          input.senderName,
          input.note ?? null,
          mime,
          bytes.length,
          sha256Hex(bytes),
          bytes,
          stamp,
          stamp,
          stamp,
        );
      await appendAudit(database, prepared);
    });
  } catch (error) {
    const mapped = paymentWriteError(error);
    if (mapped !== null) return { ok: false, code: mapped };
    throw error;
  }
  return { ok: true, paymentId };
}

export async function listPaymentQueue(): Promise<readonly PaymentQueueItem[]> {
  await requireRole("operator");
  const rows = (await db.prepare(SELECT_PAYMENT_QUEUE).all()) as
    | QueueRow[]
    | undefined;
  return (rows ?? []).map((row) => ({
    id: row.id,
    facilityPublicRef: row.facility_public_ref,
    studentName: row.student_name,
    periodNo: row.period_no,
    tenorMonths: row.tenor_months,
    amount: rupiah(row.amount),
    senderName: row.sender_name,
    note: row.note,
    proofMime: row.proof_mime,
    proofSize: row.proof_size,
    submittedAt: row.submitted_at,
  }));
}

export async function reviewPayment(input: {
  readonly paymentId: string;
  readonly decision: "verify" | "reject";
  readonly reason?: string | undefined;
}): Promise<PaymentWriteResult> {
  const actor = await requireRole("operator");
  const database = db;
  const payment = (await database
    .prepare(SELECT_PAYMENT_FOR_REVIEW)
    .get(input.paymentId)) as PaymentRow | undefined;
  if (payment === undefined) return { ok: false, code: "payment_not_found" };
  if (payment.status !== "submitted") {
    return { ok: false, code: "payment_already_reviewed" };
  }
  const occurredAt = new Date();
  const stamp = occurredAt.toISOString();
  if (input.decision === "reject") {
    const reason = (input.reason ?? "").trim();
    if (reason.length < 3) return { ok: false, code: "reason_required" };
    const prepared = await prepareAudit({
      actorType: "user",
      actorId: actor.id,
      action: "installment.payment_rejected",
      entityType: "installment_payment",
      entityId: payment.id,
      before: { status: "submitted" },
      after: { status: "rejected", reason },
    });
    try {
      await inTransaction(database, async () => {
        const result = await database
          .prepare(REJECT_PAYMENT)
          .run(actor.id, stamp, reason, payment.id);
        if (result.changes === 0) throw new Error("payment_already_reviewed");
        await appendAudit(database, prepared);
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "payment_already_reviewed"
      ) {
        return { ok: false, code: "payment_already_reviewed" };
      }
      throw error;
    }
    return { ok: true };
  }
  const prepared = await prepareAudit({
    actorType: "user",
    actorId: actor.id,
    action: "installment.payment_verified",
    entityType: "installment_payment",
    entityId: payment.id,
    before: { status: "submitted" },
    after: { status: "verified", installmentId: payment.installment_id },
  });
  try {
    await inTransaction(database, async () => {
      const verified = await database
        .prepare(VERIFY_PAYMENT)
        .run(actor.id, stamp, payment.id);
      if (verified.changes === 0) throw new Error("payment_already_reviewed");
      const settled = await database
        .prepare(SETTLE_INSTALLMENT)
        .run(stamp, payment.installment_id);
      if (settled.changes === 0) throw new Error("installment_already_settled");
      await appendAudit(database, prepared);
      const open = (await database
        .prepare(COUNT_OPEN_INSTALLMENTS)
        .get(payment.schedule_id)) as { open_count: number } | undefined;
      if ((open?.open_count ?? 0) === 0) {
        await database
          .prepare(COMPLETE_SCHEDULE)
          .run(stamp, payment.schedule_id);
        const closed = await database
          .prepare(CLOSE_FACILITY)
          .run(stamp, payment.facility_id);
        if (closed.changes === 0) throw new Error("facility_close_failed");
        const closePrepared = await prepareAudit({
          actorType: "user",
          actorId: actor.id,
          action: "financing.status_changed",
          entityType: "financing_facility",
          entityId: payment.facility_id,
          before: { status: "active" },
          after: { status: "paid_off" },
        });
        await appendAudit(database, closePrepared);
      }
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "payment_already_reviewed" ||
        error.message === "installment_already_settled")
    ) {
      return { ok: false, code: error.message };
    }
    throw error;
  }
  return { ok: true };
}

export async function readPaymentProofForViewer(input: {
  readonly paymentId: string;
}): Promise<{
  readonly mime: string;
  readonly bytes: Uint8Array;
} | null> {
  const user = await getCurrentUser();
  if (user === null) return null;
  const row = (await db.prepare(SELECT_PAYMENT_PROOF).get(input.paymentId)) as
    | {
        id: string;
        proof_mime: string;
        proof_data: Uint8Array;
        owner_user_id: string;
      }
    | undefined;
  if (row === undefined) return null;
  const isOwner = row.owner_user_id === user.id;
  const isOperator = isOwner ? false : (await rolesOf(user.id)).has("operator");
  if (!isOwner && !isOperator) return null;
  return { mime: row.proof_mime, bytes: row.proof_data };
}
