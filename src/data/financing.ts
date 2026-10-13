import "server-only";
import type { DatabaseSync } from "node:sqlite";
import { jakartaPlainDateOf } from "@/domain/account/age";
import {
  buildPublicRef,
  FINANCING_REF_SCOPE,
} from "@/domain/financing/public-ref";
import {
  checkTransition,
  type FinancingStatus,
} from "@/domain/financing/state-machine";
import { type Rupiah, rupiah } from "@/domain/money/money";
import { openAuthDatabase } from "@/lib/db/sqlite";
import { inTransaction } from "@/lib/db/tx";
import { newId } from "@/lib/id";
import { getCurrentUser } from "@/lib/session";
import { appendAudit, prepareAudit } from "./audit";
import { hasActiveConsent } from "./consents";
import { nextSequenceValue } from "./sequences";
import { getMyStudentProfile } from "./students";

export type FinancingScheme = "vidyafund" | "vidyaringan";

export type FinancingPurpose = "tuition" | "living_cost" | "other";

export type FinancingFacility = {
  readonly id: string;
  readonly publicRef: string;
  readonly studentId: string;
  readonly institutionId: string | null;
  readonly lenderId: string | null;
  readonly status: FinancingStatus;
  readonly schemeType: FinancingScheme;
  readonly academicPurpose: FinancingPurpose | null;
  readonly requestedAmount: Rupiah | null;
  readonly approvedAmount: Rupiah | null;
  readonly tenorMonths: number | null;
  readonly annualMarginRateBp: number | null;
  readonly serviceFeeRateBp: number | null;
  readonly payrollDeductionRate: number | null;
  readonly submittedAt: string | null;
  readonly approvedAt: string | null;
  readonly signedAt: string | null;
  readonly disbursedAt: string | null;
  readonly closedAt: string | null;
  readonly createdAt: string;
};

export type DraftInput = {
  readonly institutionId?: string | null;
  readonly requestedAmount?: Rupiah | null;
  readonly academicPurpose?: FinancingPurpose | null;
};

type FacilityRow = {
  id: string;
  public_ref: string;
  student_id: string;
  institution_id: string | null;
  lender_id: string | null;
  status: string;
  scheme_type: string;
  academic_purpose: string | null;
  requested_amount: number | null;
  approved_amount: number | null;
  tenor_months: number | null;
  annual_margin_rate_bp: number | null;
  service_fee_rate_bp: number | null;
  payroll_deduction_rate: number | null;
  submitted_at: string | null;
  approved_at: string | null;
  signed_at: string | null;
  disbursed_at: string | null;
  closed_at: string | null;
  created_at: string;
};

const CONSENT_KEY = "data_processing";

const FACILITY_COLUMNS = `f.id, f.public_ref, f.student_id, f.institution_id, f.lender_id,
  f.status, f.scheme_type, f.academic_purpose, f.requested_amount, f.approved_amount,
  f.tenor_months, f.annual_margin_rate_bp, f.service_fee_rate_bp, f.payroll_deduction_rate,
  f.submitted_at, f.approved_at, f.signed_at, f.disbursed_at, f.closed_at, f.created_at`;

const SCOPED_FROM = `FROM financing_facilities f
JOIN students s ON s.id = f.student_id`;

const SELECT_DETAIL = `SELECT ${FACILITY_COLUMNS} ${SCOPED_FROM}
WHERE f.id = ? AND s.user_id = ?`;

const SELECT_LIST = `SELECT ${FACILITY_COLUMNS} ${SCOPED_FROM}
WHERE s.user_id = ?
ORDER BY f.created_at DESC, f.id DESC`;

const SELECT_LATEST_DRAFT = `SELECT ${FACILITY_COLUMNS} ${SCOPED_FROM}
WHERE s.user_id = ? AND f.status = 'draft'
ORDER BY f.created_at DESC, f.id DESC
LIMIT 1`;

const INSERT_DRAFT = `INSERT INTO financing_facilities (
  id, public_ref, student_id, status, scheme_type,
  institution_id, requested_amount, academic_purpose, created_at, updated_at
) VALUES (?, ?, ?, 'draft', 'vidyafund', ?, ?, ?, ?, ?)`;

const UPDATE_DRAFT = `UPDATE financing_facilities
SET institution_id = COALESCE(?, institution_id),
    requested_amount = COALESCE(?, requested_amount),
    academic_purpose = COALESCE(?, academic_purpose)
WHERE id = ? AND status = 'draft'`;

const SUBMIT_FACILITY = `UPDATE financing_facilities
SET status = 'submitted', submitted_at = ?
WHERE id = ? AND status = 'draft'`;

const CANCEL_FACILITY = `UPDATE financing_facilities
SET status = 'cancelled', closed_at = ?
WHERE id = ? AND status = ?`;

function toFacility(row: FacilityRow): FinancingFacility {
  return {
    id: row.id,
    publicRef: row.public_ref,
    studentId: row.student_id,
    institutionId: row.institution_id,
    lenderId: row.lender_id,
    status: row.status as FinancingStatus,
    schemeType: row.scheme_type as FinancingScheme,
    academicPurpose: row.academic_purpose as FinancingPurpose | null,
    requestedAmount:
      row.requested_amount === null ? null : rupiah(row.requested_amount),
    approvedAmount:
      row.approved_amount === null ? null : rupiah(row.approved_amount),
    tenorMonths: row.tenor_months,
    annualMarginRateBp: row.annual_margin_rate_bp,
    serviceFeeRateBp: row.service_fee_rate_bp,
    payrollDeductionRate: row.payroll_deduction_rate,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    signedAt: row.signed_at,
    disbursedAt: row.disbursed_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
  };
}

function selectFacility(
  database: DatabaseSync,
  facilityId: string,
  userId: string,
): FinancingFacility | null {
  const row = database.prepare(SELECT_DETAIL).get(facilityId, userId) as
    | FacilityRow
    | undefined;
  return row === undefined ? null : toFacility(row);
}

function selectLatestDraft(
  database: DatabaseSync,
  userId: string,
): FinancingFacility | null {
  const row = database.prepare(SELECT_LATEST_DRAFT).get(userId) as
    | FacilityRow
    | undefined;
  return row === undefined ? null : toFacility(row);
}

function jakartaYearOf(at: Date): number {
  const plainDate = jakartaPlainDateOf(at);
  if (plainDate === null) throw new Error("clock_unavailable");
  return Number(plainDate.slice(0, 4));
}

function financingWriteError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("financing_facilities.student_id")) {
    return new Error("active_facility_exists");
  }
  if (message.includes("FOREIGN KEY constraint failed")) {
    return new Error("institution_not_found");
  }
  return error instanceof Error ? error : new Error(message);
}

export async function getMyFacility(
  facilityId: string,
): Promise<FinancingFacility | null> {
  const user = await getCurrentUser();
  if (user === null) return null;
  return selectFacility(openAuthDatabase(), facilityId, user.id);
}

export async function listMyFacilities(): Promise<
  readonly FinancingFacility[]
> {
  const user = await getCurrentUser();
  if (user === null) return [];
  const rows = openAuthDatabase()
    .prepare(SELECT_LIST)
    .all(user.id) as FacilityRow[];
  return rows.map(toFacility);
}

export async function saveMyDraft(
  input: DraftInput,
): Promise<FinancingFacility> {
  const user = await getCurrentUser();
  if (user === null) throw new Error("unauthenticated");
  const student = await getMyStudentProfile();
  if (student === null) throw new Error("student_profile_required");
  const database = openAuthDatabase();
  const existing = selectLatestDraft(database, user.id);
  if (existing === null) {
    const occurredAt = new Date();
    const stamp = occurredAt.toISOString();
    const year = jakartaYearOf(occurredAt);
    const facilityId = newId(occurredAt.getTime());
    try {
      inTransaction(database, () => {
        const sequence = nextSequenceValue(database, {
          scope: FINANCING_REF_SCOPE,
          period: String(year),
        });
        database
          .prepare(INSERT_DRAFT)
          .run(
            facilityId,
            buildPublicRef({ year, value: sequence }),
            student.id,
            input.institutionId ?? null,
            input.requestedAmount ?? null,
            input.academicPurpose ?? null,
            stamp,
            stamp,
          );
      });
    } catch (error) {
      throw financingWriteError(error);
    }
    const created = selectFacility(database, facilityId, user.id);
    if (created === null) throw new Error("facility_not_found");
    return created;
  }
  try {
    inTransaction(database, () => {
      const result = database
        .prepare(UPDATE_DRAFT)
        .run(
          input.institutionId ?? null,
          input.requestedAmount ?? null,
          input.academicPurpose ?? null,
          existing.id,
        );
      if (Number(result.changes) === 0) {
        throw new Error("invalid_transition");
      }
    });
  } catch (error) {
    throw financingWriteError(error);
  }
  const updated = selectFacility(database, existing.id, user.id);
  if (updated === null) throw new Error("facility_not_found");
  return updated;
}

export async function submitMyFacility(
  facilityId: string,
): Promise<FinancingFacility> {
  const user = await getCurrentUser();
  if (user === null) throw new Error("unauthenticated");
  const database = openAuthDatabase();
  const current = selectFacility(database, facilityId, user.id);
  if (current === null) throw new Error("facility_not_found");
  const transition = checkTransition(current.status, "submitted", "user");
  if (!transition.ok) throw new Error("invalid_transition");
  if (
    current.institutionId === null ||
    current.requestedAmount === null ||
    current.academicPurpose === null
  ) {
    throw new Error("facility_incomplete");
  }
  if (!(await hasActiveConsent(CONSENT_KEY))) {
    throw new Error("consent_required");
  }
  const occurredAt = new Date();
  const prepared = await prepareAudit({
    actorType: "user",
    actorId: user.id,
    action: "financing.status_changed",
    entityType: "financing_facility",
    entityId: facilityId,
    before: { status: current.status },
    after: { status: "submitted" },
  });
  try {
    inTransaction(database, () => {
      const result = database
        .prepare(SUBMIT_FACILITY)
        .run(occurredAt.toISOString(), facilityId);
      if (Number(result.changes) === 0) {
        throw new Error("invalid_transition");
      }
      appendAudit(database, prepared);
    });
  } catch (error) {
    throw financingWriteError(error);
  }
  const submitted = selectFacility(database, facilityId, user.id);
  if (submitted === null) throw new Error("facility_not_found");
  return submitted;
}

export async function cancelMyFacility(
  facilityId: string,
): Promise<FinancingFacility> {
  const user = await getCurrentUser();
  if (user === null) throw new Error("unauthenticated");
  const database = openAuthDatabase();
  const current = selectFacility(database, facilityId, user.id);
  if (current === null) throw new Error("facility_not_found");
  const transition = checkTransition(current.status, "cancelled", "user");
  if (!transition.ok) throw new Error("invalid_transition");
  const occurredAt = new Date();
  const prepared = await prepareAudit({
    actorType: "user",
    actorId: user.id,
    action: "financing.status_changed",
    entityType: "financing_facility",
    entityId: facilityId,
    before: { status: current.status },
    after: { status: "cancelled" },
  });
  try {
    inTransaction(database, () => {
      const result = database
        .prepare(CANCEL_FACILITY)
        .run(occurredAt.toISOString(), facilityId, current.status);
      if (Number(result.changes) === 0) {
        throw new Error("invalid_transition");
      }
      appendAudit(database, prepared);
    });
  } catch (error) {
    throw financingWriteError(error);
  }
  const cancelled = selectFacility(database, facilityId, user.id);
  if (cancelled === null) throw new Error("facility_not_found");
  return cancelled;
}
