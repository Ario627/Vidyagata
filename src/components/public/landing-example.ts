import {
  buildRepaymentSchedule,
  type ScheduleRow,
} from "@/domain/financing/schedule";
import { type Rupiah, rupiah } from "@/domain/money/money";
import type { Result } from "@/domain/shared/result";
import { type PlainDate, plainDate } from "@/domain/time/plain-date";

export type LandingExample = {
  readonly principal: Rupiah;
  readonly tenorMonths: number;
  readonly marginRateBp: number;
  readonly serviceFeeRateBp: number;
  readonly margin: Rupiah;
  readonly serviceFee: Rupiah;
  readonly totalRepayment: Rupiah;
  readonly installmentFrom: Rupiah;
};

const EXAMPLE_PRINCIPAL_AMOUNT = 8_000_000;
const EXAMPLE_TENOR_MONTHS = 12;
const EXAMPLE_MARGIN_RATE_BP = 1_200;
const EXAMPLE_SERVICE_FEE_RATE_BP = 200;

function expectOk<T, E>(result: Result<T, E>): T {
  if (!result.ok) {
    throw new Error(
      `Contoh simulasi landing tidak valid: ${String(result.error)}`,
    );
  }
  return result.value;
}

const EXAMPLE_FIRST_DUE_DATE: PlainDate = expectOk(plainDate(2026, 1, 10));

function minimumInstallmentOf(rows: readonly ScheduleRow[]): Rupiah {
  if (rows.length === 0) {
    throw new Error("Jadwal contoh tidak memiliki baris cicilan");
  }
  return rupiah(Math.min(...rows.map((row) => row.total)));
}

export function buildLandingExample(): LandingExample {
  const schedule = expectOk(
    buildRepaymentSchedule({
      principal: rupiah(EXAMPLE_PRINCIPAL_AMOUNT),
      tenorMonths: EXAMPLE_TENOR_MONTHS,
      annualMarginRateBp: EXAMPLE_MARGIN_RATE_BP,
      serviceFeeRateBp: EXAMPLE_SERVICE_FEE_RATE_BP,
      firstDueDate: EXAMPLE_FIRST_DUE_DATE,
    }),
  );
  return {
    principal: schedule.totals.principal,
    tenorMonths: EXAMPLE_TENOR_MONTHS,
    marginRateBp: EXAMPLE_MARGIN_RATE_BP,
    serviceFeeRateBp: EXAMPLE_SERVICE_FEE_RATE_BP,
    margin: schedule.totals.margin,
    serviceFee: schedule.totals.serviceFee,
    totalRepayment: schedule.totals.totalRepayment,
    installmentFrom: minimumInstallmentOf(schedule.rows),
  };
}
