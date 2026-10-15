import "server-only";
import type { Db } from "@/lib/db/client";

const SCOPE_PATTERN = /^[a-z][a-z0-9_]{2,31}$/;
const PERIOD_PATTERN = /^\d{4}$/;

type SequenceRow = {
  current_value: number;
};

const BUMP_AND_READ = `INSERT INTO reference_sequences (scope, period, current_value, updated_at)
VALUES (?, ?, 1, ?)
ON CONFLICT(scope, period) DO UPDATE SET
  current_value = reference_sequences.current_value + 1,
  updated_at = excluded.updated_at
RETURNING current_value`;

export async function nextSequenceValue(
  database: Db,
  input: { readonly scope: string; readonly period: string },
): Promise<number> {
  if (!SCOPE_PATTERN.test(input.scope)) {
    throw new RangeError(`Scope urutan tidak valid: ${input.scope}`);
  }
  if (!PERIOD_PATTERN.test(input.period)) {
    throw new RangeError(`Periode urutan tidak valid: ${input.period}`);
  }
  const row = (await database
    .prepare(BUMP_AND_READ)
    .get(input.scope, input.period, new Date().toISOString())) as
    | SequenceRow
    | undefined;
  if (row === undefined) throw new Error("sequence_allocation_failed");
  return row.current_value;
}
