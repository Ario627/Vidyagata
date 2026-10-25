import "server-only";
import { type Rupiah, rupiah } from "@/domain/money/money";
import { type Db, db } from "@/lib/db/client";
import { newId } from "@/lib/id";
import { getCurrentUser } from "@/lib/session";

export const LEDGER_ENTRY_TYPES = [
  "disbursement",
  "repayment",
  "payroll_deduction",
  "adjustment",
  "refund",
] as const;

export type LedgerEntryType = (typeof LEDGER_ENTRY_TYPES)[number];

export type LedgerDirection = "debit" | "credit";

export type LedgerEntryInput = {
  readonly idempotencyKey: string;
  readonly facilityId: string;
  readonly entryType: LedgerEntryType;
  readonly direction: LedgerDirection;
  readonly amount: number;
  readonly occurredAt: string;
  readonly recordedBy: string;
  readonly memo?: string;
};

export type LedgerHistoryEntry = {
  readonly id: string;
  readonly entryType: LedgerEntryType;
  readonly direction: LedgerDirection;
  readonly amount: Rupiah;
  readonly occurredAt: string;
  readonly memo: string | null;
  readonly facilityPublicRef: string;
};

type LedgerHistoryRow = {
  id: string;
  entry_type: string;
  direction: string;
  amount: number;
  occurred_at: string;
  memo: string | null;
  public_ref: string;
};

type FallbackPaymentRow = {
  id: string;
  amount: number;
  verified_at: string;
  period_no: number;
  public_ref: string;
};

const SELECT_MY_LEDGER = `SELECT le.id, le.entry_type, le.direction,
  le.amount, le.occurred_at, le.memo, f.public_ref
FROM ledger_entries le
JOIN financing_facilities f ON f.id = le.facility_id
JOIN students s ON s.id = f.student_id
WHERE s.user_id = ?
ORDER BY le.occurred_at DESC, le.id DESC
LIMIT 200`;

const SELECT_UNLEDGERED_PAYMENTS = `SELECT p.id, p.amount, p.verified_at,
  ins.period_no, f.public_ref
FROM installment_payments p
JOIN installments ins ON ins.id = p.installment_id
JOIN financing_facilities f ON f.id = p.facility_id
JOIN students s ON s.id = p.student_id
WHERE s.user_id = ? AND p.status = 'verified'
  AND NOT EXISTS (
    SELECT 1 FROM ledger_entries le
    WHERE le.idempotency_key = 'repayment:' || p.id
  )
ORDER BY p.verified_at DESC, p.id DESC`;

const INSERT_LEDGER_ENTRY = `INSERT INTO ledger_entries (
  id, idempotency_key, facility_id, entry_type, direction, amount,
  currency, occurred_at, recorded_at, recorded_by, memo, created_at
) VALUES (?, ?, ?, ?, ?, ?, 'IDR', ?, ?, ?, ?, ?)`;

function isLedgerEntryType(value: string): value is LedgerEntryType {
  return (LEDGER_ENTRY_TYPES as readonly string[]).includes(value);
}

function isLedgerDirection(value: string): value is LedgerDirection {
  return value === "debit" || value === "credit";
}

export async function appendLedgerEntry(
  database: Db,
  input: LedgerEntryInput,
): Promise<string> {
  const id = newId();
  const recordedAt = new Date().toISOString();
  await database
    .prepare(INSERT_LEDGER_ENTRY)
    .run(
      id,
      input.idempotencyKey,
      input.facilityId,
      input.entryType,
      input.direction,
      input.amount,
      input.occurredAt,
      recordedAt,
      input.recordedBy,
      input.memo ?? null,
      recordedAt,
    );
  return id;
}

export async function getMyLedgerHistory(): Promise<
  readonly LedgerHistoryEntry[]
> {
  const user = await getCurrentUser();
  if (user === null) return [];
  const [ledgerRows, paymentRows] = await Promise.all([
    db.prepare(SELECT_MY_LEDGER).all(user.id),
    db.prepare(SELECT_UNLEDGERED_PAYMENTS).all(user.id),
  ]);
  const entries: LedgerHistoryEntry[] = [];
  for (const raw of ledgerRows as LedgerHistoryRow[]) {
    if (!isLedgerEntryType(raw.entry_type)) continue;
    if (!isLedgerDirection(raw.direction)) continue;
    entries.push({
      id: raw.id,
      entryType: raw.entry_type,
      direction: raw.direction,
      amount: rupiah(raw.amount),
      occurredAt: raw.occurred_at,
      memo: raw.memo,
      facilityPublicRef: raw.public_ref,
    });
  }
  for (const raw of paymentRows as FallbackPaymentRow[]) {
    entries.push({
      id: `payment-${raw.id}`,
      entryType: "repayment",
      direction: "credit",
      amount: rupiah(raw.amount),
      occurredAt: raw.verified_at,
      memo: `Pembayaran cicilan periode ${raw.period_no}`,
      facilityPublicRef: raw.public_ref,
    });
  }
  return entries.sort((left, right) =>
    left.occurredAt < right.occurredAt ? 1 : -1,
  );
}
