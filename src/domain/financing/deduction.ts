import { min, type Rupiah, rupiah, ZERO } from "../money/money";
import { multiplyDivideRoundUp } from "./rounding";

export const PAYROLL_DEDUCTION_RATES = [20, 40, 60] as const;

export type PayrollDeductionRate = (typeof PAYROLL_DEDUCTION_RATES)[number];

export function isPayrollDeductionRate(
  value: unknown,
): value is PayrollDeductionRate {
  return (
    typeof value === "number" &&
    (PAYROLL_DEDUCTION_RATES as readonly number[]).includes(value)
  );
}

export function estimatePayoffPeriods(input: {
  readonly outstanding: Rupiah;
  readonly periodDeduction: Rupiah;
}): number | null {
  if (input.outstanding <= ZERO) return 0;
  if (input.periodDeduction <= ZERO) return null;
  return Math.ceil(input.outstanding / input.periodDeduction);
}

export function computePayrollDeduction(input: {
  readonly earnings: Rupiah;
  readonly rate: PayrollDeductionRate;
  readonly outstanding: Rupiah;
}): Rupiah {
  const raw = rupiah(multiplyDivideRoundUp(input.earnings, input.rate, 100));
  return min(raw, input.outstanding);
}
