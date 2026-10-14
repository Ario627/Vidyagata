import "server-only";
import { jakartaPlainDateOf } from "@/domain/account/age";
import {
  buildRepaymentSchedule,
  type InstallmentStatus,
  isInstallmentStatus,
} from "@/domain/financing/schedule";
import { type Rupiah, rupiah, sum } from "@/domain/money/money";
import { addMonths } from "@/domain/time/calendar";
import {
  isBefore,
  type PlainDate,
  parsePlainDate,
} from "@/domain/time/plain-date";
import { type Db, db } from "@/lib/db/client";
import { newId } from "@/lib/id";
import { getCurrentUser } from "@/lib/session";

export type ScheduleSeed = {
  readonly facilityId: string;
  readonly principal: number;
  readonly tenorMonths: number;
  readonly annualMarginRateBp: number;
  readonly serviceFeeRateBp: number;
  readonly firstDueDate: PlainDate;
};

export type TagihanInstallment = {
  readonly periodNo: number;
  readonly dueDate: PlainDate;
  readonly principal: Rupiah;
  readonly margin: Rupiah;
  readonly fee: Rupiah;
  readonly total: Rupiah;
  readonly status: InstallmentStatus;
};

export type TagihanOverview = {
  readonly facilityPublicRef: string;
  readonly institutionName: string | null;
  readonly tenorMonths: number;
  readonly deductionRate: number | null;
  readonly activatedAt: string;
  readonly totalRepayment: Rupiah;
  readonly paidTotal: Rupiah;
  readonly outstandingTotal: Rupiah;
  readonly paidCount: number;
  readonly totalCount: number;
  readonly overdueCount: number;
  readonly nextDue: TagihanInstallment | null;
  readonly installments: readonly TagihanInstallment[];
};

type MyScheduleRow = {
  public_ref: string;
  tenor_months: number;
  payroll_deduction_rate: number | null;
  institution_name: string | null;
  schedule_id: string;
  activated_at: string;
};

type InstallmentRow = {
  period_no: number;
  due_date: string;
  principal_amount: number;
  margin_amount: number;
  fee_amount: number;
  total_amount: number;
  status: string;
};

const INSERT_SCHEDULE = `INSERT INTO repayment_schedules (
  id, facility_id, schedule_version, tenor_months, first_due_date,
  status, activated_at, created_at, updated_at
) VALUES (?, ?, 1, ?, ?, 'active', ?, ?, ?)`;

const INSERT_INSTALLMENT = `INSERT INTO installments (
  id, schedule_id, facility_id, period_no, due_date, principal_amount,
  margin_amount, fee_amount, total_amount, currency, status, paid_at,
  created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'IDR', 'due', NULL, ?, ?)`;

const SELECT_MY_SCHEDULE = `SELECT f.public_ref, f.tenor_months,
  f.payroll_deduction_rate, i.name AS institution_name,
  rs.id AS schedule_id, rs.activated_at
FROM financing_facilities f
JOIN students s ON s.id = f.student_id
JOIN repayment_schedules rs ON rs.facility_id = f.id
LEFT JOIN institutions i ON i.id = f.institution_id
WHERE s.user_id = ? AND rs.status IN ('active', 'completed')
ORDER BY rs.activated_at DESC, rs.id DESC
LIMIT 1`;

const SELECT_INSTALLMENTS = `SELECT period_no, due_date, principal_amount,
  margin_amount, fee_amount, total_amount, status
FROM installments
WHERE schedule_id = ?
ORDER BY period_no`;

export function todayInJakarta(): PlainDate | null {
  return jakartaPlainDateOf(new Date());
}

export function firstDueDateAfter(today: PlainDate): PlainDate | null {
  const next = addMonths(today, 1);
  return next.ok ? next.value : null;
}

export async function createActiveSchedule(
  database: Db,
  seed: ScheduleSeed,
): Promise<string> {
  const built = buildRepaymentSchedule({
    principal: rupiah(seed.principal),
    tenorMonths: seed.tenorMonths,
    annualMarginRateBp: seed.annualMarginRateBp,
    serviceFeeRateBp: seed.serviceFeeRateBp,
    firstDueDate: seed.firstDueDate,
  });
  if (!built.ok) throw new Error(`schedule_invalid:${built.error}`);
  const scheduleId = newId();
  const now = new Date().toISOString();
  await database
    .prepare(INSERT_SCHEDULE)
    .run(
      scheduleId,
      seed.facilityId,
      seed.tenorMonths,
      seed.firstDueDate,
      now,
      now,
      now,
    );
  for (const row of built.value.rows) {
    await database
      .prepare(INSERT_INSTALLMENT)
      .run(
        newId(),
        scheduleId,
        seed.facilityId,
        row.index,
        row.dueDate,
        row.principal,
        row.margin,
        row.serviceFee,
        row.total,
        now,
        now,
      );
  }
  return scheduleId;
}

function toInstallment(
  row: InstallmentRow,
  today: PlainDate | null,
): TagihanInstallment | null {
  const dueDate = parsePlainDate(row.due_date);
  if (!dueDate.ok || !isInstallmentStatus(row.status)) return null;
  const unsettled = row.status === "due" || row.status === "partially_paid";
  const status: InstallmentStatus =
    unsettled && today !== null && isBefore(dueDate.value, today)
      ? "overdue"
      : row.status;
  return {
    periodNo: row.period_no,
    dueDate: dueDate.value,
    principal: rupiah(row.principal_amount),
    margin: rupiah(row.margin_amount),
    fee: rupiah(row.fee_amount),
    total: rupiah(row.total_amount),
    status,
  };
}

function toOverview(
  schedule: MyScheduleRow,
  rows: readonly InstallmentRow[],
  today: PlainDate | null,
): TagihanOverview {
  const installments = rows
    .map((row) => toInstallment(row, today))
    .filter((item): item is TagihanInstallment => item !== null);
  const open = installments.filter(
    (item) => item.status !== "paid" && item.status !== "waived",
  );
  const nextDue =
    open.length === 0
      ? null
      : open.reduce((earliest, item) =>
          isBefore(item.dueDate, earliest.dueDate) ? item : earliest,
        );
  return {
    facilityPublicRef: schedule.public_ref,
    institutionName: schedule.institution_name,
    tenorMonths: schedule.tenor_months,
    deductionRate: schedule.payroll_deduction_rate,
    activatedAt: schedule.activated_at,
    totalRepayment: sum(installments.map((item) => item.total)),
    paidTotal: sum(
      installments
        .filter((item) => item.status === "paid")
        .map((item) => item.total),
    ),
    outstandingTotal: sum(open.map((item) => item.total)),
    paidCount: installments.filter((item) => item.status === "paid").length,
    totalCount: installments.length,
    overdueCount: installments.filter((item) => item.status === "overdue")
      .length,
    nextDue,
    installments,
  };
}

export async function getMyTagihan(): Promise<TagihanOverview | null> {
  const user = await getCurrentUser();
  if (user === null) return null;
  const database = db;
  const schedule = (await database.prepare(SELECT_MY_SCHEDULE).get(user.id)) as
    | MyScheduleRow
    | undefined;
  if (schedule === undefined) return null;
  const rows = (await database
    .prepare(SELECT_INSTALLMENTS)
    .all(schedule.schedule_id)) as InstallmentRow[];
  return toOverview(schedule, rows, jakartaPlainDateOf(new Date()));
}
