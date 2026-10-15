import "server-only";
import { requireRole } from "@/data/dal";
import type { AcademicStatus } from "@/domain/financing/eligibility";
import {
  assessEligibility,
  type EligibilityAssessment,
  type EligibilityInput,
  FORWARD_MIN_SCORE,
} from "@/domain/financing/eligibility";
import type { FinancingStatus } from "@/domain/financing/state-machine";
import { checkTransition } from "@/domain/financing/state-machine";
import { type Rupiah, rupiah } from "@/domain/money/money";
import { type Db, db } from "@/lib/db/client";
import { inTransaction } from "@/lib/db/tx";
import { newId } from "@/lib/id";
import { appendAudit, prepareAudit } from "./audit";
import { getPilotLenderTerms } from "./lenders";

export type FinancingPurpose = "tuition" | "living_cost" | "other";

export type QueueItem = {
  readonly id: string;
  readonly publicRef: string;
  readonly status: FinancingStatus;
  readonly requestedAmount: Rupiah | null;
  readonly academicPurpose: FinancingPurpose | null;
  readonly institutionName: string | null;
  readonly submittedAt: string | null;
  readonly claimedByMe: boolean;
  readonly claimedByName: string | null;
};

export type ReviewDetail = {
  readonly id: string;
  readonly publicRef: string;
  readonly status: FinancingStatus;
  readonly requestedAmount: Rupiah | null;
  readonly academicPurpose: FinancingPurpose | null;
  readonly institutionName: string | null;
  readonly submittedAt: string | null;
  readonly studentName: string;
  readonly studentSemester: number | null;
  readonly studentGpaHundredths: number | null;
  readonly studentAcademicStatus: AcademicStatus;
  readonly eligibility: EligibilityAssessment;
  readonly minScore: number;
  readonly claimedByMe: boolean;
  readonly claimedByName: string | null;
};

export type OperatorWriteResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly code: string };

type QueueRow = {
  id: string;
  public_ref: string;
  status: string;
  requested_amount: number | null;
  academic_purpose: string | null;
  institution_name: string | null;
  submitted_at: string | null;
  officer_id: string | null;
  officer_name: string | null;
};

type ReviewRow = QueueRow & {
  full_name: string;
  current_semester: number | null;
  gpa_hundredths: number | null;
  academic_status: string;
};

const QUEUE_COLUMNS = `f.id, f.public_ref, f.status, f.requested_amount,
  f.academic_purpose, i.name AS institution_name, f.submitted_at,
  op.officer_id, officer.name AS officer_name`;

const QUEUE_FROM = `FROM financing_facilities f
LEFT JOIN institutions i ON i.id = f.institution_id
LEFT JOIN officer_portfolios op ON op.facility_id = f.id
LEFT JOIN "user" officer ON officer.id = op.officer_id`;

const SELECT_QUEUE = `SELECT ${QUEUE_COLUMNS} ${QUEUE_FROM}
WHERE f.status IN ('submitted', 'under_review')
ORDER BY f.submitted_at, f.id`;

const SELECT_REVIEW = `SELECT ${QUEUE_COLUMNS}, s.full_name, s.current_semester,
  s.gpa_hundredths, s.academic_status
${QUEUE_FROM}
JOIN students s ON s.id = f.student_id
WHERE f.id = ?`;

const INSERT_PORTFOLIO = `INSERT INTO officer_portfolios (
  id, officer_id, facility_id, assigned_at, created_at
) VALUES (?, ?, ?, ?, ?)`;

const CLAIM_FACILITY = `UPDATE financing_facilities
SET status = 'under_review'
WHERE id = ? AND status = 'submitted'`;

const FORWARD_FACILITY = `UPDATE financing_facilities
SET status = 'forwarded_to_lender', lender_id = ?
WHERE id = ? AND status = 'under_review'`;

const REJECT_FACILITY = `UPDATE financing_facilities
SET status = 'rejected', closed_at = ?
WHERE id = ? AND status = 'under_review'`;

const INSERT_ASSESSMENT = `INSERT INTO eligibility_assessments (
  id, facility_id, assessed_by, score, plafon_recommended,
  factors_json, engine_version, assessed_at, created_at
) VALUES (?, ?, 'vidya_ai', ?, ?, ?, ?, ?, ?)`;

function toQueueItem(row: QueueRow, officerId: string): QueueItem {
  return {
    id: row.id,
    publicRef: row.public_ref,
    status: row.status as FinancingStatus,
    requestedAmount:
      row.requested_amount === null ? null : rupiah(row.requested_amount),
    academicPurpose: row.academic_purpose as FinancingPurpose | null,
    institutionName: row.institution_name,
    submittedAt: row.submitted_at,
    claimedByMe: row.officer_id === officerId,
    claimedByName: row.officer_name,
  };
}

async function selectQueueRow(
  database: Db,
  facilityId: string,
): Promise<ReviewRow | null> {
  const row = (await database.prepare(SELECT_REVIEW).get(facilityId)) as
    | ReviewRow
    | undefined;
  return row ?? null;
}

async function eligibilityOf(
  row: ReviewRow,
): Promise<EligibilityAssessment | null> {
  if (row.requested_amount === null) return null;
  const terms = await getPilotLenderTerms();
  if (terms === null) return null;
  const input: EligibilityInput = {
    academicStatus: row.academic_status as EligibilityInput["academicStatus"],
    currentSemester: row.current_semester,
    gpaHundredths: row.gpa_hundredths,
    requestedAmount: rupiah(row.requested_amount),
    tenorMonths: terms.maxTenorMonths,
    plafonCap: terms.maxAmount,
    maxTenorMonths: terms.maxTenorMonths,
  };
  return assessEligibility(input);
}

function toReviewDetail(
  row: ReviewRow,
  officerId: string,
  eligibility: EligibilityAssessment,
): ReviewDetail {
  return {
    id: row.id,
    publicRef: row.public_ref,
    status: row.status as FinancingStatus,
    requestedAmount:
      row.requested_amount === null ? null : rupiah(row.requested_amount),
    academicPurpose: row.academic_purpose as FinancingPurpose | null,
    institutionName: row.institution_name,
    submittedAt: row.submitted_at,
    studentName: row.full_name,
    studentSemester: row.current_semester,
    studentGpaHundredths: row.gpa_hundredths,
    studentAcademicStatus: row.academic_status as AcademicStatus,
    eligibility,
    minScore: FORWARD_MIN_SCORE,
    claimedByMe: row.officer_id === officerId,
    claimedByName: row.officer_name,
  };
}

function operatorWriteError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("officer_portfolios.facility_id") ||
    message.includes("officer_portfolios_facility_id_key")
  ) {
    return new Error("already_claimed");
  }
  if (
    /FOREIGN KEY constraint failed/.test(message) ||
    /violates foreign key constraint/.test(message)
  ) {
    return new Error("facility_not_found");
  }
  return error instanceof Error ? error : new Error(message);
}

export async function listReviewQueue(): Promise<readonly QueueItem[]> {
  const actor = await requireRole("operator");
  const rows = (await db.prepare(SELECT_QUEUE).all()) as QueueRow[];
  return rows.map((row) => toQueueItem(row, actor.id));
}

export async function getReviewDetail(
  facilityId: string,
): Promise<ReviewDetail | null> {
  const actor = await requireRole("operator");
  const database = db;
  const row = await selectQueueRow(database, facilityId);
  if (row === null) return null;
  const eligibility = await eligibilityOf(row);
  if (eligibility === null) return null;
  const claimedByOther = row.officer_id !== null && row.officer_id !== actor.id;
  if (claimedByOther) return null;
  return toReviewDetail(row, actor.id, eligibility);
}

export async function claimFacility(
  facilityId: string,
): Promise<OperatorWriteResult> {
  const actor = await requireRole("operator");
  const database = db;
  const current = await selectQueueRow(database, facilityId);
  if (current === null) return { ok: false, code: "facility_not_found" };
  if (current.status !== "submitted") {
    return { ok: false, code: "invalid_transition" };
  }
  const occurredAt = new Date();
  const prepared = await prepareAudit({
    actorType: "operator",
    actorId: actor.id,
    action: "financing.status_changed",
    entityType: "financing_facility",
    entityId: facilityId,
    before: { status: "submitted" },
    after: { status: "under_review" },
    reason: "Klaim antrian untuk peninjauan",
  });
  try {
    await inTransaction(database, async () => {
      await database
        .prepare(INSERT_PORTFOLIO)
        .run(
          newId(occurredAt.getTime()),
          actor.id,
          facilityId,
          occurredAt.toISOString(),
          occurredAt.toISOString(),
        );
      const result = await database.prepare(CLAIM_FACILITY).run(facilityId);
      if (result.changes === 0) {
        throw new Error("invalid_transition");
      }
      await appendAudit(database, prepared);
    });
  } catch (error) {
    return { ok: false, code: operatorWriteError(error).message };
  }
  return { ok: true };
}

export async function forwardFacility(input: {
  readonly facilityId: string;
  readonly reason?: string;
}): Promise<OperatorWriteResult> {
  const actor = await requireRole("operator");
  const database = db;
  const row = await selectQueueRow(database, input.facilityId);
  if (row === null || row.officer_id !== actor.id) {
    return { ok: false, code: "facility_not_found" };
  }
  const transition = checkTransition(
    row.status as FinancingStatus,
    "forwarded_to_lender",
    "operator",
  );
  if (!transition.ok) return { ok: false, code: "invalid_transition" };
  const terms = await getPilotLenderTerms();
  if (terms === null) return { ok: false, code: "lender_unavailable" };
  const eligibility = await eligibilityOf(row);
  if (eligibility === null)
    return { ok: false, code: "eligibility_unavailable" };
  const reason = input.reason?.trim() ?? "";
  const belowThreshold = eligibility.score < FORWARD_MIN_SCORE;
  if (belowThreshold && reason === "") {
    return { ok: false, code: "reason_required" };
  }
  const occurredAt = new Date();
  const prepared = await prepareAudit({
    actorType: "operator",
    actorId: actor.id,
    action: "financing.status_changed",
    entityType: "financing_facility",
    entityId: input.facilityId,
    before: { status: row.status },
    after: {
      status: "forwarded_to_lender",
      score: eligibility.score,
      below_threshold: belowThreshold,
    },
    reason: reason === "" ? "Skor kelayakan memenuhi ambang" : reason,
  });
  try {
    await inTransaction(database, async () => {
      await database
        .prepare(INSERT_ASSESSMENT)
        .run(
          newId(occurredAt.getTime()),
          input.facilityId,
          eligibility.score,
          eligibility.plafonRecommended,
          JSON.stringify(eligibility.factors),
          eligibility.engineVersion,
          occurredAt.toISOString(),
          occurredAt.toISOString(),
        );
      const result = await database
        .prepare(FORWARD_FACILITY)
        .run(terms.lenderId, input.facilityId);
      if (result.changes === 0) {
        throw new Error("invalid_transition");
      }
      await appendAudit(database, prepared);
    });
  } catch (error) {
    return { ok: false, code: operatorWriteError(error).message };
  }
  return { ok: true };
}

export async function rejectFacility(input: {
  readonly facilityId: string;
  readonly reason: string;
}): Promise<OperatorWriteResult> {
  const actor = await requireRole("operator");
  const reason = input.reason.trim();
  if (reason === "") return { ok: false, code: "reason_required" };
  const database = db;
  const row = await selectQueueRow(database, input.facilityId);
  if (row === null || row.officer_id !== actor.id) {
    return { ok: false, code: "facility_not_found" };
  }
  const transition = checkTransition(
    row.status as FinancingStatus,
    "rejected",
    "operator",
  );
  if (!transition.ok) return { ok: false, code: "invalid_transition" };
  const occurredAt = new Date();
  const prepared = await prepareAudit({
    actorType: "operator",
    actorId: actor.id,
    action: "financing.status_changed",
    entityType: "financing_facility",
    entityId: input.facilityId,
    before: { status: row.status },
    after: { status: "rejected" },
    reason,
  });
  try {
    await inTransaction(database, async () => {
      const result = await database
        .prepare(REJECT_FACILITY)
        .run(occurredAt.toISOString(), input.facilityId);
      if (result.changes === 0) {
        throw new Error("invalid_transition");
      }
      await appendAudit(database, prepared);
    });
  } catch (error) {
    return { ok: false, code: operatorWriteError(error).message };
  }
  return { ok: true };
}
