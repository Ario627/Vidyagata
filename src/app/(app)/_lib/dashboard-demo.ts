import {
  buildRepaymentSchedule,
  type RepaymentSchedule,
  type ScheduleRow,
} from "@/domain/financing/schedule";
import { type Rupiah, rupiah, subtract, sum } from "@/domain/money/money";
import {
  comparePlainDate,
  type PlainDate,
  plainDate,
} from "@/domain/time/plain-date";
import type { Result } from "@/domain/shared/result";

export type DemoComposition = {
  readonly paidPrincipal: Rupiah;
  readonly remainingPrincipal: Rupiah;
  readonly margin: Rupiah;
  readonly serviceFee: Rupiah;
  readonly total: Rupiah;
};

export type DashboardDemo = {
  readonly student: {
    readonly name: string;
    readonly institution: string;
    readonly status: string;
  };
  readonly facility: {
    readonly principal: Rupiah;
    readonly tenorMonths: number;
    readonly firstDueDate: PlainDate;
  };
  readonly totals: RepaymentSchedule["totals"];
  readonly paidCount: number;
  readonly progressPercent: number;
  readonly nextInstallment: ScheduleRow;
  readonly nextDueDate: PlainDate;
  readonly composition: DemoComposition;
  readonly asOf: PlainDate;
};

function expectOk<T, E>(result: Result<T, E>): T {
  if (!result.ok) {
    throw new Error(`Data demo dashboard tidak valid: ${String(result.error)}`);
  }
  return result.value;
}

function at(rows: readonly ScheduleRow[], index: number): ScheduleRow {
  const row = rows[index];
  if (row === undefined) {
    throw new Error(`Cicilan ke-${index + 1} tidak tersedia`);
  }
  return row;
}

const AS_OF = expectOk(plainDate(2026, 10, 12));

const STUDENT = {
  name: "Nathania Keisya",
  institution: "Universitas Indonesia",
  status: "Mahasiswa Semester 3",
} as const;

const FACILITY = {
  principal: rupiah(8_000_000),
  tenorMonths: 12,
  annualMarginRateBp: 1200,
  serviceFeeRateBp: 200,
  firstDueDate: expectOk(plainDate(2026, 3, 10)),
} as const;

const SCHEDULE = expectOk(buildRepaymentSchedule(FACILITY));

function countPaid(schedule: RepaymentSchedule, asOf: PlainDate): number {
  return schedule.rows.filter((row) => comparePlainDate(row.dueDate, asOf) <= 0)
    .length;
}

function percentOf(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

function compositionOf(
  schedule: RepaymentSchedule,
  paidCount: number,
): DemoComposition {
  const paidPrincipal = sum(
    schedule.rows.slice(0, paidCount).map((row) => row.principal),
  );
  return {
    paidPrincipal,
    remainingPrincipal: expectOk(
      subtract(schedule.totals.principal, paidPrincipal),
    ),
    margin: schedule.totals.margin,
    serviceFee: schedule.totals.serviceFee,
    total: schedule.totals.totalRepayment,
  };
}

const PAID_COUNT = countPaid(SCHEDULE, AS_OF);
const NEXT_INSTALLMENT = at(SCHEDULE.rows, PAID_COUNT);

export const dashboardDemo: DashboardDemo = {
  student: STUDENT,
  facility: FACILITY,
  totals: SCHEDULE.totals,
  paidCount: PAID_COUNT,
  progressPercent: percentOf(PAID_COUNT, FACILITY.tenorMonths),
  nextInstallment: NEXT_INSTALLMENT,
  nextDueDate: NEXT_INSTALLMENT.dueDate,
  composition: compositionOf(SCHEDULE, PAID_COUNT),
  asOf: AS_OF,
};
