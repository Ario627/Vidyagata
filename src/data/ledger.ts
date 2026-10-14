import "server-only";
import type { Db } from "@/lib/db/client";
import { newId } from "@/lib/id";

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

const INSERT_LEDGER_ENTRY = `INSERT INTO ledger_entries (
  id, idempotency_key, facility_id, entry_type, direction, amount,
  currency, occurred_at, recorded_at, recorded_by, memo, created_at
) VALUES (?, ?, ?, ?, ?, ?, 'IDR', ?, ?, ?, ?, ?)`;

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
