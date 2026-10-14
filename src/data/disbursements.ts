import "server-only";
import type { DatabaseSync } from "node:sqlite";
import { requireRole } from "@/data/dal";
import { isTwoFactorEnabled } from "@/data/two-factor";
import { jakartaPlainDateOf } from "@/domain/account/age";
import {
  type DisbursementRequestStatus,
  type PencairanPermissions,
  pencairanPermissions,
} from "@/domain/financing/disbursement";
import type { FinancingStatus } from "@/domain/financing/state-machine";
import { checkTransition } from "@/domain/financing/state-machine";
import { type Rupiah, rupiah } from "@/domain/money/money";
import { openAuthDatabase } from "@/lib/db/sqlite";
import { inTransaction } from "@/lib/db/tx";
import { newId } from "@/lib/id";
import { appendAudit, prepareAudit } from "./audit";
import { appendLedgerEntry } from "./ledger";
import { getPilotLenderTerms } from "./lenders";
import type { OperatorWriteResult } from "./operator";
import {
  createActiveSchedule,
  firstDueDateAfter,
  todayInJakarta,
} from "./repayments";

export type DisbursementDecision = "approved" | "rejected";

export type PencairanQueueItem = {
  readonly facilityId: string;
  readonly publicRef: string;
  readonly facilityStatus: FinancingStatus;
  readonly requestedAmount: Rupiah | null;
  readonly approvedAmount: Rupiah | null;
  readonly institutionName: string | null;
  readonly requestStatus: DisbursementRequestStatus | null;
  readonly requestInitiatedByMe: boolean;
  readonly requestInitiatedByName: string | null;
};

export type PencairanQueue = {
  readonly active: readonly PencairanQueueItem[];
  readonly recent: readonly PencairanQueueItem[];
};

export type DisbursementRequestView = {
  readonly id: string;
  readonly status: DisbursementRequestStatus;
  readonly amount: Rupiah;
  readonly destinationName: string;
  readonly initiatedByName: string;
  readonly initiatedByMe: boolean;
  readonly initiatedAt: string;
  readonly decidedByName: string | null;
  readonly decidedAt: string | null;
  readonly decisionReason: string | null;
  readonly executedAt: string | null;
  readonly transferReference: string | null;
};

export type PencairanDetail = {
  readonly facilityId: string;
  readonly publicRef: string;
  readonly facilityStatus: FinancingStatus;
  readonly requestedAmount: Rupiah | null;
  readonly approvedAmount: Rupiah | null;
  readonly tenorMonths: number | null;
  readonly marginRateBp: number | null;
  readonly serviceFeeRateBp: number | null;
  readonly institutionName: string | null;
  readonly studentName: string;
  readonly signedAt: string | null;
  readonly disbursedAt: string | null;
  readonly latestRequest: DisbursementRequestView | null;
  readonly previousRequests: readonly DisbursementRequestView[];
  readonly permissions: PencairanPermissions;
};

type PencairanRow = {
  id: string;
  public_ref: string;
  status: string;
  requested_amount: number | null;
  approved_amount: number | null;
  tenor_months: number | null;
  annual_margin_rate_bp: number | null;
  service_fee_rate_bp: number | null;
  institution_id: string | null;
  institution_name: string | null;
  signed_at: string | null;
  disbursed_at: string | null;
  student_name: string;
};

type QueueRow = {
  id: string;
  public_ref: string;
  status: string;
  requested_amount: number | null;
  approved_amount: number | null;
  institution_name: string | null;
  request_status: string | null;
  request_initiated_by: string | null;
  request_initiated_by_name: string | null;
};

type RequestRow = {
  id: string;
  status: string;
  amount: number;
  destination_name: string;
  initiated_by: string;
  initiated_at: string;
  initiated_by_name: string;
  decided_by_name: string | null;
  decided_at: string | null;
  decision_reason: string | null;
  executed_at: string | null;
  transfer_reference: string | null;
};

type OpenRequestRow = {
  id: string;
  status: string;
  amount: number;
  destination_name: string;
  initiated_by: string;
};

const SELECT_PENCAIRAN_FACILITY = `SELECT f.id, f.public_ref, f.status,
  f.requested_amount, f.approved_amount, f.tenor_months,
  f.annual_margin_rate_bp, f.service_fee_rate_bp, f.institution_id,
  i.name AS institution_name, f.signed_at, f.disbursed_at,
  s.full_name AS student_name
FROM financing_facilities f
JOIN students s ON s.id = f.student_id
LEFT JOIN institutions i ON i.id = f.institution_id
WHERE f.id = ?`;

const SELECT_REQUESTS = `SELECT r.id, r.status, r.amount, r.destination_name,
  r.initiated_by, r.initiated_at, r.decided_at, r.decision_reason,
  r.executed_at, r.transfer_reference,
  i.name AS initiated_by_name, d.name AS decided_by_name
FROM disbursement_requests r
JOIN user i ON i.id = r.initiated_by
LEFT JOIN user d ON d.id = r.decided_by
WHERE r.facility_id = ?
ORDER BY r.created_at DESC, r.id DESC
LIMIT 6`;

const SELECT_OPEN_REQUEST = `SELECT r.id, r.status, r.amount, r.destination_name,
  r.initiated_by
FROM disbursement_requests r
WHERE r.facility_id = ? AND r.status IN ('requested', 'approved')
ORDER BY r.created_at DESC, r.id DESC
LIMIT 1`;

const QUEUE_COLUMNS = `f.id, f.public_ref, f.status, f.requested_amount,
  f.approved_amount, i.name AS institution_name,
  r.status AS request_status, r.initiated_by AS request_initiated_by,
  ri.name AS request_initiated_by_name`;

const SELECT_QUEUE_ACTIVE = `SELECT ${QUEUE_COLUMNS}
FROM financing_facilities f
LEFT JOIN institutions i ON i.id = f.institution_id
LEFT JOIN disbursement_requests r ON r.id = (
  SELECT r2.id FROM disbursement_requests r2
  WHERE r2.facility_id = f.id AND r2.status IN ('requested', 'approved')
  ORDER BY r2.created_at DESC, r2.id DESC LIMIT 1
)
LEFT JOIN user ri ON ri.id = r.initiated_by
WHERE f.status IN ('forwarded_to_lender', 'approved', 'signed')
ORDER BY f.updated_at, f.id`;

const SELECT_QUEUE_RECENT = `SELECT ${QUEUE_COLUMNS}
FROM disbursement_requests r
JOIN financing_facilities f ON f.id = r.facility_id
LEFT JOIN institutions i ON i.id = f.institution_id
JOIN user ri ON ri.id = r.initiated_by
WHERE r.status = 'executed'
ORDER BY r.executed_at DESC, r.id DESC
LIMIT 5`;

const RECORD_LENDER_APPROVAL = `UPDATE financing_facilities
SET status = 'approved', approved_at = ?, approved_amount = ?,
  annual_margin_rate_bp = ?, service_fee_rate_bp = ?
WHERE id = ? AND status = 'forwarded_to_lender'`;

const RECORD_LENDER_REJECTION = `UPDATE financing_facilities
SET status = 'rejected', closed_at = ?
WHERE id = ? AND status = 'forwarded_to_lender'`;

const RECORD_AGREEMENT = `UPDATE financing_facilities
SET status = 'signed', signed_at = ?
WHERE id = ? AND status = 'approved'`;

const INSERT_DISBURSEMENT_REQUEST = `INSERT INTO disbursement_requests (
  id, facility_id, amount, destination_institution_id, destination_name, status,
  initiated_by, initiated_at, decided_by, decided_at, decision_reason,
  executed_by, executed_at, transfer_reference, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, 'requested', ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?)`;

const DECIDE_DISBURSEMENT = `UPDATE disbursement_requests
SET status = ?, decided_by = ?, decided_at = ?, decision_reason = ?
WHERE id = ? AND status = 'requested'`;

const WITHDRAW_DISBURSEMENT = `UPDATE disbursement_requests
SET status = 'withdrawn', decided_by = ?, decided_at = ?, decision_reason = ?
WHERE id = ? AND status = 'requested'`;

const EXECUTE_DISBURSEMENT = `UPDATE disbursement_requests
SET status = 'executed', executed_by = ?, executed_at = ?, transfer_reference = ?
WHERE id = ? AND status = 'approved'`;

const DISBURSE_FACILITY = `UPDATE financing_facilities
SET status = 'disbursed', disbursed_at = ?, payroll_deduction_rate = ?
WHERE id = ? AND status = 'signed'`;

const ACTIVATE_FACILITY = `UPDATE financing_facilities
SET status = 'active'
WHERE id = ? AND status = 'disbursed'`;

const DEDUCTION_RATES: readonly number[] = [20, 40, 60];

function toQueueItem(row: QueueRow, actorId: string): PencairanQueueItem {
  return {
    facilityId: row.id,
    publicRef: row.public_ref,
    facilityStatus: row.status as FinancingStatus,
    requestedAmount:
      row.requested_amount === null ? null : rupiah(row.requested_amount),
    approvedAmount:
      row.approved_amount === null ? null : rupiah(row.approved_amount),
    institutionName: row.institution_name,
    requestStatus:
      row.request_status === null
        ? null
        : (row.request_status as DisbursementRequestStatus),
    requestInitiatedByMe: row.request_initiated_by === actorId,
    requestInitiatedByName: row.request_initiated_by_name,
  };
}

function toRequestView(
  row: RequestRow,
  actorId: string,
): DisbursementRequestView {
  return {
    id: row.id,
    status: row.status as DisbursementRequestStatus,
    amount: rupiah(row.amount),
    destinationName: row.destination_name,
    initiatedByName: row.initiated_by_name,
    initiatedByMe: row.initiated_by === actorId,
    initiatedAt: row.initiated_at,
    decidedByName: row.decided_by_name,
    decidedAt: row.decided_at,
    decisionReason: row.decision_reason,
    executedAt: row.executed_at,
    transferReference: row.transfer_reference,
  };
}

function pencairanWriteError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("disbursement_requests.facility_id")) {
    return "open_request_exists";
  }
  if (message.includes("ledger_entries.idempotency_key")) {
    return "already_recorded";
  }
  if (message.includes("ck_disbursement_requests_four_eyes")) {
    return "four_eyes_violation";
  }
  if (message.includes("ck_disbursement_requests_executor_owner")) {
    return "not_initiator";
  }
  if (message.includes("repayment_schedules.facility_id")) {
    return "schedule_exists";
  }
  if (message.includes("FOREIGN KEY constraint failed")) {
    return "facility_not_found";
  }
  if (message === "invalid_transition") return "invalid_transition";
  return "internal_error";
}

function selectPencairanRow(
  database: DatabaseSync,
  facilityId: string,
): PencairanRow | null {
  const row = database.prepare(SELECT_PENCAIRAN_FACILITY).get(facilityId) as
    | PencairanRow
    | undefined;
  return row ?? null;
}

function selectRequestRows(
  database: DatabaseSync,
  facilityId: string,
): RequestRow[] {
  return database.prepare(SELECT_REQUESTS).all(facilityId) as RequestRow[];
}

function selectOpenRequest(
  database: DatabaseSync,
  facilityId: string,
): OpenRequestRow | null {
  const row = database.prepare(SELECT_OPEN_REQUEST).get(facilityId) as
    | OpenRequestRow
    | undefined;
  return row ?? null;
}

export async function listPencairanQueue(): Promise<PencairanQueue> {
  const actor = await requireRole("operator");
  const database = openAuthDatabase();
  const active = database.prepare(SELECT_QUEUE_ACTIVE).all() as QueueRow[];
  const recent = database.prepare(SELECT_QUEUE_RECENT).all() as QueueRow[];
  return {
    active: active.map((row) => toQueueItem(row, actor.id)),
    recent: recent.map((row) => toQueueItem(row, actor.id)),
  };
}

export async function getPencairanDetail(
  facilityId: string,
): Promise<PencairanDetail | null> {
  const actor = await requireRole("operator");
  const database = openAuthDatabase();
  const row = selectPencairanRow(database, facilityId);
  if (row === null) return null;
  const requests = selectRequestRows(database, facilityId);
  const views = requests.map((request) => toRequestView(request, actor.id));
  const latestRequest = views[0] ?? null;
  return {
    facilityId: row.id,
    publicRef: row.public_ref,
    facilityStatus: row.status as FinancingStatus,
    requestedAmount:
      row.requested_amount === null ? null : rupiah(row.requested_amount),
    approvedAmount:
      row.approved_amount === null ? null : rupiah(row.approved_amount),
    tenorMonths: row.tenor_months,
    marginRateBp: row.annual_margin_rate_bp,
    serviceFeeRateBp: row.service_fee_rate_bp,
    institutionName: row.institution_name,
    studentName: row.student_name,
    signedAt: row.signed_at,
    disbursedAt: row.disbursed_at,
    latestRequest,
    previousRequests: views.slice(1),
    permissions: pencairanPermissions(
      row.status as FinancingStatus,
      latestRequest === null
        ? null
        : {
            status: latestRequest.status,
            initiatedByMe: latestRequest.initiatedByMe,
          },
    ),
  };
}

export async function recordLenderDecision(input: {
  readonly facilityId: string;
  readonly decision: DisbursementDecision;
  readonly reason?: string | undefined;
}): Promise<OperatorWriteResult> {
  const actor = await requireRole("operator");
  if (!isTwoFactorEnabled(actor.id)) return { ok: false, code: "mfa_required" };
  const database = openAuthDatabase();
  const row = selectPencairanRow(database, input.facilityId);
  if (row === null) return { ok: false, code: "facility_not_found" };
  const transition = checkTransition(
    row.status as FinancingStatus,
    input.decision,
    "operator",
  );
  if (!transition.ok) return { ok: false, code: "invalid_transition" };
  const reason = input.reason?.trim() ?? "";
  const occurredAt = new Date();
  if (input.decision === "rejected") {
    if (reason === "") return { ok: false, code: "reason_required" };
    const prepared = await prepareAudit({
      actorType: "operator",
      actorId: actor.id,
      action: "financing.status_changed",
      entityType: "financing_facility",
      entityId: input.facilityId,
      before: { status: row.status },
      after: { status: "rejected" },
      reason,
    });
    try {
      inTransaction(database, () => {
        const result = database
          .prepare(RECORD_LENDER_REJECTION)
          .run(occurredAt.toISOString(), input.facilityId);
        if (Number(result.changes) === 0) throw new Error("invalid_transition");
        appendAudit(database, prepared);
      });
    } catch (error) {
      return { ok: false, code: pencairanWriteError(error) };
    }
    return { ok: true };
  }
  const terms = getPilotLenderTerms();
  if (terms === null) return { ok: false, code: "lender_unavailable" };
  if (row.requested_amount === null || row.tenor_months === null) {
    return { ok: false, code: "facility_incomplete" };
  }
  const prepared = await prepareAudit({
    actorType: "operator",
    actorId: actor.id,
    action: "financing.status_changed",
    entityType: "financing_facility",
    entityId: input.facilityId,
    before: { status: row.status },
    after: {
      status: "approved",
      approved_amount: row.requested_amount,
      annual_margin_rate_bp: terms.marginRateBp,
      service_fee_rate_bp: terms.serviceFeeRateBp,
    },
    reason: reason === "" ? "Keputusan mitra pilot dicatat: disetujui" : reason,
  });
  try {
    inTransaction(database, () => {
      const result = database
        .prepare(RECORD_LENDER_APPROVAL)
        .run(
          occurredAt.toISOString(),
          row.requested_amount,
          terms.marginRateBp,
          terms.serviceFeeRateBp,
          input.facilityId,
        );
      if (Number(result.changes) === 0) throw new Error("invalid_transition");
      appendAudit(database, prepared);
    });
  } catch (error) {
    return { ok: false, code: pencairanWriteError(error) };
  }
  return { ok: true };
}

export async function recordAgreementSignature(input: {
  readonly facilityId: string;
  readonly note: string;
}): Promise<OperatorWriteResult> {
  const actor = await requireRole("operator");
  if (!isTwoFactorEnabled(actor.id)) return { ok: false, code: "mfa_required" };
  const note = input.note.trim();
  if (note.length < 10) return { ok: false, code: "note_required" };
  const database = openAuthDatabase();
  const row = selectPencairanRow(database, input.facilityId);
  if (row === null) return { ok: false, code: "facility_not_found" };
  const transition = checkTransition(
    row.status as FinancingStatus,
    "signed",
    "operator",
  );
  if (!transition.ok) return { ok: false, code: "invalid_transition" };
  const occurredAt = new Date();
  const prepared = await prepareAudit({
    actorType: "operator",
    actorId: actor.id,
    action: "financing.status_changed",
    entityType: "financing_facility",
    entityId: input.facilityId,
    before: { status: row.status },
    after: { status: "signed" },
    reason: note,
  });
  try {
    inTransaction(database, () => {
      const result = database
        .prepare(RECORD_AGREEMENT)
        .run(occurredAt.toISOString(), input.facilityId);
      if (Number(result.changes) === 0) throw new Error("invalid_transition");
      appendAudit(database, prepared);
    });
  } catch (error) {
    return { ok: false, code: pencairanWriteError(error) };
  }
  return { ok: true };
}

export async function initiateDisbursement(
  facilityId: string,
): Promise<OperatorWriteResult> {
  const actor = await requireRole("operator");
  if (!isTwoFactorEnabled(actor.id)) return { ok: false, code: "mfa_required" };
  const database = openAuthDatabase();
  const row = selectPencairanRow(database, facilityId);
  if (row === null) return { ok: false, code: "facility_not_found" };
  if (row.status !== "signed") return { ok: false, code: "invalid_transition" };
  if (selectOpenRequest(database, facilityId) !== null) {
    return { ok: false, code: "open_request_exists" };
  }
  if (row.approved_amount === null || row.institution_id === null) {
    return { ok: false, code: "facility_incomplete" };
  }
  const occurredAt = new Date();
  const requestId = newId(occurredAt.getTime());
  const prepared = await prepareAudit({
    actorType: "operator",
    actorId: actor.id,
    action: "financing.disbursement_initiated",
    entityType: "disbursement_request",
    entityId: requestId,
    after: {
      facility_id: facilityId,
      amount: row.approved_amount,
      destination_name: row.institution_name,
    },
    reason: "Pengajuan pencairan dibuat",
  });
  try {
    inTransaction(database, () => {
      database
        .prepare(INSERT_DISBURSEMENT_REQUEST)
        .run(
          requestId,
          facilityId,
          row.approved_amount,
          row.institution_id,
          row.institution_name,
          actor.id,
          occurredAt.toISOString(),
          occurredAt.toISOString(),
          occurredAt.toISOString(),
        );
      appendAudit(database, prepared);
    });
  } catch (error) {
    return { ok: false, code: pencairanWriteError(error) };
  }
  return { ok: true };
}

export async function decideDisbursement(input: {
  readonly facilityId: string;
  readonly decision: DisbursementDecision;
  readonly reason?: string | undefined;
  readonly confirmDestination: boolean;
}): Promise<OperatorWriteResult> {
  const actor = await requireRole("operator");
  if (!isTwoFactorEnabled(actor.id)) return { ok: false, code: "mfa_required" };
  if (input.decision === "approved" && !input.confirmDestination) {
    return { ok: false, code: "confirmation_required" };
  }
  const database = openAuthDatabase();
  const request = selectOpenRequest(database, input.facilityId);
  if (request === null || request.status !== "requested") {
    return { ok: false, code: "no_open_request" };
  }
  if (request.initiated_by === actor.id) {
    return { ok: false, code: "four_eyes_violation" };
  }
  const reason = input.reason?.trim() ?? "";
  if (input.decision === "rejected" && reason === "") {
    return { ok: false, code: "reason_required" };
  }
  const occurredAt = new Date();
  const prepared = await prepareAudit({
    actorType: "operator",
    actorId: actor.id,
    action:
      input.decision === "approved"
        ? "financing.disbursement_approved"
        : "financing.disbursement_rejected",
    entityType: "disbursement_request",
    entityId: request.id,
    after: {
      facility_id: input.facilityId,
      amount: request.amount,
      destination_name: request.destination_name,
      confirmed_destination: input.confirmDestination,
    },
    reason:
      reason === ""
        ? "Tujuan dan nominal terverifikasi; pencairan disetujui"
        : reason,
  });
  try {
    inTransaction(database, () => {
      const result = database
        .prepare(DECIDE_DISBURSEMENT)
        .run(
          input.decision,
          actor.id,
          occurredAt.toISOString(),
          reason === "" ? null : reason,
          request.id,
        );
      if (Number(result.changes) === 0) throw new Error("invalid_transition");
      appendAudit(database, prepared);
    });
  } catch (error) {
    return { ok: false, code: pencairanWriteError(error) };
  }
  return { ok: true };
}

export async function withdrawDisbursement(
  facilityId: string,
): Promise<OperatorWriteResult> {
  const actor = await requireRole("operator");
  if (!isTwoFactorEnabled(actor.id)) return { ok: false, code: "mfa_required" };
  const database = openAuthDatabase();
  const request = selectOpenRequest(database, facilityId);
  if (request === null || request.status !== "requested") {
    return { ok: false, code: "no_open_request" };
  }
  if (request.initiated_by !== actor.id) {
    return { ok: false, code: "not_initiator" };
  }
  const occurredAt = new Date();
  const prepared = await prepareAudit({
    actorType: "operator",
    actorId: actor.id,
    action: "financing.disbursement_withdrawn",
    entityType: "disbursement_request",
    entityId: request.id,
    after: { facility_id: facilityId, status: "withdrawn" },
    reason: "Dibatalkan oleh pengaju",
  });
  try {
    inTransaction(database, () => {
      const result = database
        .prepare(WITHDRAW_DISBURSEMENT)
        .run(
          actor.id,
          occurredAt.toISOString(),
          "Dibatalkan oleh pengaju",
          request.id,
        );
      if (Number(result.changes) === 0) throw new Error("invalid_transition");
      appendAudit(database, prepared);
    });
  } catch (error) {
    return { ok: false, code: pencairanWriteError(error) };
  }
  return { ok: true };
}

export async function executeDisbursement(input: {
  readonly facilityId: string;
  readonly transferReference: string;
  readonly deductionRate: number;
}): Promise<OperatorWriteResult> {
  const actor = await requireRole("operator");
  if (!isTwoFactorEnabled(actor.id)) return { ok: false, code: "mfa_required" };
  if (!DEDUCTION_RATES.includes(input.deductionRate)) {
    return { ok: false, code: "invalid_input" };
  }
  const reference = input.transferReference.trim();
  if (reference.length < 4) return { ok: false, code: "reference_required" };
  const database = openAuthDatabase();
  const row = selectPencairanRow(database, input.facilityId);
  if (row === null) return { ok: false, code: "facility_not_found" };
  if (row.status !== "signed") return { ok: false, code: "invalid_transition" };
  if (
    row.tenor_months === null ||
    row.annual_margin_rate_bp === null ||
    row.service_fee_rate_bp === null
  ) {
    return { ok: false, code: "facility_incomplete" };
  }
  const request = selectOpenRequest(database, input.facilityId);
  if (request === null || request.status !== "approved") {
    return { ok: false, code: "no_open_request" };
  }
  if (request.initiated_by !== actor.id) {
    return { ok: false, code: "not_initiator" };
  }
  const today = todayInJakarta();
  const firstDueDate = today === null ? null : firstDueDateAfter(today);
  if (firstDueDate === null) return { ok: false, code: "internal_error" };
  const tenorMonths = row.tenor_months;
  const marginRateBp = row.annual_margin_rate_bp;
  const feeRateBp = row.service_fee_rate_bp;
  const occurredAt = new Date();
  const statusChanged = await prepareAudit({
    actorType: "operator",
    actorId: actor.id,
    action: "financing.status_changed",
    entityType: "financing_facility",
    entityId: input.facilityId,
    before: { status: "signed" },
    after: { status: "disbursed", transfer_reference: reference },
    reason: `Bukti transfer dicatat: ${reference}`,
  });
  const executed = await prepareAudit({
    actorType: "operator",
    actorId: actor.id,
    action: "financing.disbursement_executed",
    entityType: "disbursement_request",
    entityId: request.id,
    after: {
      facility_id: input.facilityId,
      amount: request.amount,
      transfer_reference: reference,
      destination_name: request.destination_name,
    },
    reason: `Bukti transfer dicatat: ${reference}`,
  });
  const activated = await prepareAudit({
    actorType: "system",
    actorId: "system",
    action: "financing.status_changed",
    entityType: "financing_facility",
    entityId: input.facilityId,
    before: { status: "disbursed" },
    after: { status: "active" },
    reason: "Jadwal cicilan dibuat dan diaktifkan",
  });
  try {
    inTransaction(database, () => {
      const requestResult = database
        .prepare(EXECUTE_DISBURSEMENT)
        .run(actor.id, occurredAt.toISOString(), reference, request.id);
      if (Number(requestResult.changes) === 0) {
        throw new Error("invalid_transition");
      }
      const facilityResult = database
        .prepare(DISBURSE_FACILITY)
        .run(occurredAt.toISOString(), input.deductionRate, input.facilityId);
      if (Number(facilityResult.changes) === 0) {
        throw new Error("invalid_transition");
      }
      createActiveSchedule(database, {
        facilityId: input.facilityId,
        principal: request.amount,
        tenorMonths,
        annualMarginRateBp: marginRateBp,
        serviceFeeRateBp: feeRateBp,
        firstDueDate,
      });
      const activation = database
        .prepare(ACTIVATE_FACILITY)
        .run(input.facilityId);
      if (Number(activation.changes) === 0) {
        throw new Error("invalid_transition");
      }
      appendLedgerEntry(database, {
        idempotencyKey: `disbursement:${request.id}`,
        facilityId: input.facilityId,
        entryType: "disbursement",
        direction: "debit",
        amount: request.amount,
        occurredAt: occurredAt.toISOString(),
        recordedBy: actor.id,
        memo: `${row.public_ref} → ${request.destination_name}`,
      });
      appendAudit(database, statusChanged);
      appendAudit(database, executed);
      appendAudit(database, activated);
    });
  } catch (error) {
    return { ok: false, code: pencairanWriteError(error) };
  }
  return { ok: true };
}
