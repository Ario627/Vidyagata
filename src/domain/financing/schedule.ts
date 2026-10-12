import { add, type Rupiah, rupiah, subtract, sum, ZERO } from "../money/money";
import { err, ok, type Result } from "../shared/result";
import { addMonths } from "../time/calendar";
import type { PlainDate } from "../time/plain-date";
import { allocateEvenly, multiplyDivideRoundUp } from "./rounding";

const MONTHS_PER_YEAR = 12;
export const MAX_TENOR_MONTHS = 360;
export const MAX_RATE_BP = 99_999;

export type ScheduleError =
  | "principal_not_positive"
  | "invalid_tenor"
  | "invalid_margin_rate"
  | "invalid_service_fee_rate"
  | "due_date_out_of_range";

export type ScheduleInput = {
  readonly principal: Rupiah;
  readonly tenorMonths: number;
  readonly annualMarginRateBp: number;
  readonly serviceFeeRateBp: number;
  readonly firstDueDate: PlainDate;
};

export type ScheduleRow = {
  readonly index: number;
  readonly dueDate: PlainDate;
  readonly principal: Rupiah;
  readonly margin: Rupiah;
  readonly serviceFee: Rupiah;
  readonly total: Rupiah;
  readonly remainingPrincipal: Rupiah;
};

export type RepaymentSchedule = {
  readonly rows: readonly ScheduleRow[];
  readonly totals: {
    readonly principal: Rupiah;
    readonly margin: Rupiah;
    readonly serviceFee: Rupiah;
    readonly totalRepayment: Rupiah;
  };
};

function isValidRate(bp: number): boolean {
  return Number.isInteger(bp) && bp >= 0 && bp <= MAX_RATE_BP;
}

function part(parts: readonly number[], index: number): number {
  const value = parts[index];
  if (value === undefined) {
    throw new RangeError(`Bagian cicilan ke-${index} tidak tersedia`);
  }
  return value;
}

function buildDueDates(
  firstDueDate: PlainDate,
  tenorMonths: number,
): Result<PlainDate[], ScheduleError> {
  const dates: PlainDate[] = [firstDueDate];
  for (let offset = 1; offset < tenorMonths; offset += 1) {
    const next = addMonths(firstDueDate, offset);
    if (!next.ok) return err("due_date_out_of_range");
    dates.push(next.value);
  }
  return ok(dates);
}

function marginTotal(input: ScheduleInput): Rupiah {
  const multiplier = input.annualMarginRateBp * input.tenorMonths;
  return rupiah(
    multiplyDivideRoundUp(
      input.principal,
      multiplier,
      MONTHS_PER_YEAR * 10_000,
    ),
  );
}

function serviceFeeTotal(input: ScheduleInput): Rupiah {
  return rupiah(
    multiplyDivideRoundUp(input.principal, input.serviceFeeRateBp, 10_000),
  );
}

function buildRows(
  input: ScheduleInput,
  dueDates: readonly PlainDate[],
  principalParts: readonly number[],
  marginParts: readonly number[],
  serviceFeeParts: readonly number[],
): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  let repaidPrincipal = ZERO;
  for (let index = 0; index < dueDates.length; index += 1) {
    const dueDate = dueDates[index];
    if (dueDate === undefined) {
      throw new RangeError(`Jatuh tempo ke-${index} tidak tersedia`);
    }
    const principal = rupiah(part(principalParts, index));
    const margin = rupiah(part(marginParts, index));
    const serviceFee = rupiah(part(serviceFeeParts, index));
    repaidPrincipal = add(repaidPrincipal, principal);
    const remaining = subtract(input.principal, repaidPrincipal);
    if (!remaining.ok) {
      throw new RangeError("Sisa pokok negatif saat menyusun jadwal");
    }
    rows.push({
      index: index + 1,
      dueDate,
      principal,
      margin,
      serviceFee,
      total: add(add(principal, margin), serviceFee),
      remainingPrincipal: remaining.value,
    });
  }
  return rows;
}

function totalsFromRows(
  rows: readonly ScheduleRow[],
): RepaymentSchedule["totals"] {
  return {
    principal: sum(rows.map((row) => row.principal)),
    margin: sum(rows.map((row) => row.margin)),
    serviceFee: sum(rows.map((row) => row.serviceFee)),
    totalRepayment: sum(rows.map((row) => row.total)),
  };
}

export function buildRepaymentSchedule(
  input: ScheduleInput,
): Result<RepaymentSchedule, ScheduleError> {
  if (input.principal <= ZERO) return err("principal_not_positive");
  const validTenor =
    Number.isInteger(input.tenorMonths) &&
    input.tenorMonths >= 1 &&
    input.tenorMonths <= MAX_TENOR_MONTHS;
  if (!validTenor) return err("invalid_tenor");
  if (!isValidRate(input.annualMarginRateBp)) {
    return err("invalid_margin_rate");
  }
  if (!isValidRate(input.serviceFeeRateBp)) {
    return err("invalid_service_fee_rate");
  }
  const dueDates = buildDueDates(input.firstDueDate, input.tenorMonths);
  if (!dueDates.ok) return dueDates;
  const rows = buildRows(
    input,
    dueDates.value,
    allocateEvenly(input.principal, input.tenorMonths),
    allocateEvenly(marginTotal(input), input.tenorMonths),
    allocateEvenly(serviceFeeTotal(input), input.tenorMonths),
  );
  return ok({ rows, totals: totalsFromRows(rows) });
}
