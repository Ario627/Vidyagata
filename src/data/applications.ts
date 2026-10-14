import "server-only";
import type { DatabaseSync } from "node:sqlite";
import { openAuthDatabase } from "@/lib/db/sqlite";
import { inTransaction } from "@/lib/db/tx";
import { newId } from "@/lib/id";
import { getCurrentUser } from "@/lib/session";
import { appendAudit, prepareAudit } from "./audit";

export const APPLICATION_STATUSES = [
  "draft",
  "submitted",
  "shortlisted",
  "rejected",
  "accepted",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type ApplicationResult =
  | { readonly ok: true; readonly applicationId: string }
  | { readonly ok: false; readonly code: string };

export type ApplicationRef = {
  readonly id: string;
  readonly status: ApplicationStatus;
};

export type MyApplication = {
  readonly id: string;
  readonly postingId: string;
  readonly postingTitle: string;
  readonly employerName: string;
  readonly status: ApplicationStatus;
  readonly note: string | null;
  readonly submittedAt: string | null;
  readonly createdAt: string;
};

type StudentIdRow = { id: string };
type PostingRow = { id: string; status: string };
type ApplicationRefRow = { id: string; status: string };
type MyApplicationRow = {
  id: string;
  status: string;
  note: string | null;
  submitted_at: string | null;
  created_at: string;
  posting_id: string;
  posting_title: string;
  employer_name: string;
};

const ACTIVE_APPLICATION_STATUSES =
  "'draft', 'submitted', 'shortlisted', 'accepted'";
const WITHDRAWABLE_STATUSES = "'submitted', 'shortlisted'";

const SELECT_MY_STUDENT_ID = "SELECT id FROM students WHERE user_id = ?";

const SELECT_POSTING = "SELECT id, status FROM job_postings WHERE id = ?";

const SELECT_ACTIVE_APPLICATION = `SELECT id, status FROM job_applications
WHERE student_id = ? AND job_posting_id = ?
  AND status IN (${ACTIVE_APPLICATION_STATUSES})
ORDER BY created_at DESC, id DESC
LIMIT 1`;

const SELECT_OWN_APPLICATION = `SELECT id, status FROM job_applications
WHERE id = ? AND student_id = ?`;

const INSERT_APPLICATION = `INSERT INTO job_applications (
  id, student_id, job_posting_id, status, note, submitted_at, decided_at,
  created_at, updated_at
) VALUES (?, ?, ?, 'submitted', ?, ?, NULL, ?, ?)`;

const WITHDRAW_APPLICATION = `UPDATE job_applications
SET status = 'withdrawn', decided_at = ?
WHERE id = ? AND status IN (${WITHDRAWABLE_STATUSES})`;

const SELECT_MY_APPLICATIONS = `SELECT a.id, a.status, a.note, a.submitted_at,
  a.created_at, j.id AS posting_id, j.title AS posting_title,
  e.name AS employer_name
FROM job_applications a
JOIN job_postings j ON j.id = a.job_posting_id
JOIN employers e ON e.id = j.employer_id
WHERE a.student_id = ?
ORDER BY a.created_at DESC, a.id DESC`;

function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}

function selectMyStudentId(
  database: DatabaseSync,
  userId: string,
): string | null {
  const row = database.prepare(SELECT_MY_STUDENT_ID).get(userId) as
    | StudentIdRow
    | undefined;
  return row?.id ?? null;
}

function applicationWriteError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("job_applications.student_id") ||
    message.includes("uq_job_applications_active")
  ) {
    return "already_applied";
  }
  if (message.includes("FOREIGN KEY constraint failed")) {
    return "posting_not_found";
  }
  if (message === "invalid_transition") return "invalid_transition";
  return "internal_error";
}

export async function applyToJob(input: {
  readonly postingId: string;
  readonly note?: string | undefined;
}): Promise<ApplicationResult> {
  const user = await getCurrentUser();
  if (user === null) return { ok: false, code: "unauthenticated" };
  const database = openAuthDatabase();
  const studentId = selectMyStudentId(database, user.id);
  if (studentId === null) {
    return { ok: false, code: "student_profile_required" };
  }
  const posting = database.prepare(SELECT_POSTING).get(input.postingId) as
    | PostingRow
    | undefined;
  if (posting === undefined) return { ok: false, code: "posting_not_found" };
  if (posting.status !== "active")
    return { ok: false, code: "posting_not_open" };
  const existing = database
    .prepare(SELECT_ACTIVE_APPLICATION)
    .get(studentId, input.postingId) as ApplicationRefRow | undefined;
  if (existing !== undefined) return { ok: false, code: "already_applied" };
  const note = input.note?.trim() ?? "";
  const occurredAt = new Date();
  const applicationId = newId(occurredAt.getTime());
  const prepared = await prepareAudit({
    actorType: "user",
    actorId: user.id,
    action: "job.application_submitted",
    entityType: "job_application",
    entityId: applicationId,
    after: { posting_id: input.postingId, status: "submitted" },
  });
  try {
    inTransaction(database, () => {
      database
        .prepare(INSERT_APPLICATION)
        .run(
          applicationId,
          studentId,
          input.postingId,
          note === "" ? null : note,
          occurredAt.toISOString(),
          occurredAt.toISOString(),
          occurredAt.toISOString(),
        );
      appendAudit(database, prepared);
    });
  } catch (error) {
    return { ok: false, code: applicationWriteError(error) };
  }
  return { ok: true, applicationId };
}

export async function withdrawApplication(
  applicationId: string,
): Promise<ApplicationResult> {
  const user = await getCurrentUser();
  if (user === null) return { ok: false, code: "unauthenticated" };
  const database = openAuthDatabase();
  const studentId = selectMyStudentId(database, user.id);
  if (studentId === null) {
    return { ok: false, code: "student_profile_required" };
  }
  const application = database
    .prepare(SELECT_OWN_APPLICATION)
    .get(applicationId, studentId) as ApplicationRefRow | undefined;
  if (application === undefined) return { ok: false, code: "not_found" };
  if (
    application.status !== "submitted" &&
    application.status !== "shortlisted"
  ) {
    return { ok: false, code: "invalid_transition" };
  }
  const occurredAt = new Date();
  const prepared = await prepareAudit({
    actorType: "user",
    actorId: user.id,
    action: "job.application_withdrawn",
    entityType: "job_application",
    entityId: applicationId,
    before: { status: application.status },
    after: { status: "withdrawn" },
  });
  try {
    inTransaction(database, () => {
      const result = database
        .prepare(WITHDRAW_APPLICATION)
        .run(occurredAt.toISOString(), applicationId);
      if (Number(result.changes) === 0) throw new Error("invalid_transition");
      appendAudit(database, prepared);
    });
  } catch (error) {
    return { ok: false, code: applicationWriteError(error) };
  }
  return { ok: true, applicationId };
}

export async function getMyApplicationForPosting(
  postingId: string,
): Promise<ApplicationRef | null> {
  const user = await getCurrentUser();
  if (user === null) return null;
  const database = openAuthDatabase();
  const studentId = selectMyStudentId(database, user.id);
  if (studentId === null) return null;
  const row = database
    .prepare(SELECT_ACTIVE_APPLICATION)
    .get(studentId, postingId) as ApplicationRefRow | undefined;
  if (row === undefined || !isApplicationStatus(row.status)) return null;
  return { id: row.id, status: row.status };
}

export async function listMyApplications(): Promise<readonly MyApplication[]> {
  const user = await getCurrentUser();
  if (user === null) return [];
  const database = openAuthDatabase();
  const studentId = selectMyStudentId(database, user.id);
  if (studentId === null) return [];
  const rows = database
    .prepare(SELECT_MY_APPLICATIONS)
    .all(studentId) as MyApplicationRow[];
  return rows.flatMap((row) =>
    isApplicationStatus(row.status)
      ? [
          {
            id: row.id,
            postingId: row.posting_id,
            postingTitle: row.posting_title,
            employerName: row.employer_name,
            status: row.status,
            note: row.note,
            submittedAt: row.submitted_at,
            createdAt: row.created_at,
          },
        ]
      : [],
  );
}
