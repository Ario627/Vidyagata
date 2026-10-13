import {
  computePayrollDeduction,
  estimatePayoffPeriods,
  PAYROLL_DEDUCTION_RATES,
  type PayrollDeductionRate,
} from "@/domain/financing/deduction";
import { type Rupiah, rupiah } from "@/domain/money/money";

export type DeductionExampleRow = {
  readonly rate: PayrollDeductionRate;
  readonly monthlyDeduction: Rupiah;
  readonly payoffMonths: number | null;
};

export type DeductionExample = {
  readonly outstanding: Rupiah;
  readonly monthlyEarnings: Rupiah;
  readonly rows: readonly DeductionExampleRow[];
};

const EXAMPLE_OUTSTANDING_AMOUNT = 9_120_000;
const EXAMPLE_MONTHLY_EARNINGS = 2_000_000;

export function buildDeductionExample(): DeductionExample {
  const outstanding = rupiah(EXAMPLE_OUTSTANDING_AMOUNT);
  const monthlyEarnings = rupiah(EXAMPLE_MONTHLY_EARNINGS);
  return {
    outstanding,
    monthlyEarnings,
    rows: PAYROLL_DEDUCTION_RATES.map((rate) => {
      const monthlyDeduction = computePayrollDeduction({
        earnings: monthlyEarnings,
        rate,
        outstanding,
      });
      return {
        rate,
        monthlyDeduction,
        payoffMonths: estimatePayoffPeriods({
          outstanding,
          periodDeduction: monthlyDeduction,
        }),
      };
    }),
  };
}
