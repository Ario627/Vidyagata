import "server-only";
import type { AcademicStatus } from "@/domain/financing/eligibility";
import { type PlainDate, parsePlainDate } from "@/domain/time/plain-date";
import { type Db, db } from "@/lib/db/client";
import { inTransaction } from "@/lib/db/tx";
import { newId } from "@/lib/id";
import { getCurrentUser } from "@/lib/session";
import { appendAudit, prepareAudit } from "./audit";

export type StudentProfile = {
  readonly id: string;
  readonly userId: string;
  readonly fullName: string;
  readonly nickname: string | null;
  readonly dateOfBirth: PlainDate;
  readonly academicStatus: AcademicStatus;
  readonly currentSemester: number | null;
  readonly gpaHundredths: number | null;
  readonly institutionId: string | null;
  readonly province: string;
  readonly city: string;
  readonly addressLine: string | null;
  readonly hobby: string | null;
  readonly bio: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type StudentProfileInput = {
  readonly fullName: string;
  readonly nickname?: string | null;
  readonly dateOfBirth: PlainDate;
  readonly academicStatus: AcademicStatus;
  readonly currentSemester?: number | null;
  readonly gpaHundredths?: number | null;
  readonly institutionId?: string | null;
  readonly province: string;
  readonly city: string;
  readonly addressLine?: string | null;
  readonly hobby?: string | null;
  readonly bio?: string | null;
};

type StudentRow = {
  id: string;
  user_id: string;
  full_name: string;
  nickname: string | null;
  date_of_birth: string;
  academic_status: string;
  current_semester: number | null;
  gpa_hundredths: number | null;
  institution_id: string | null;
  province: string;
  city: string;
  address_line: string | null;
  hobby: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

type AuditSnapshot = {
  readonly academicStatus: string;
  readonly currentSemester: number | null;
  readonly gpaHundredths: number | null;
  readonly institutionId: string | null;
};

const STUDENT_COLUMNS = `id, user_id, full_name, nickname, date_of_birth, academic_status,
  current_semester, gpa_hundredths, institution_id, province, city,
  address_line, hobby, bio, created_at, updated_at`;

const SELECT_BY_USER = `SELECT ${STUDENT_COLUMNS} FROM students WHERE user_id = ?`;

const UPSERT_STUDENT = `INSERT INTO students (
  id, user_id, full_name, nickname, date_of_birth, academic_status,
  current_semester, gpa_hundredths, institution_id, province, city,
  address_line, hobby, bio, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(user_id) DO UPDATE SET
  full_name = excluded.full_name,
  nickname = excluded.nickname,
  date_of_birth = excluded.date_of_birth,
  academic_status = excluded.academic_status,
  current_semester = excluded.current_semester,
  gpa_hundredths = excluded.gpa_hundredths,
  institution_id = excluded.institution_id,
  province = excluded.province,
  city = excluded.city,
  address_line = excluded.address_line,
  hobby = excluded.hobby,
  bio = excluded.bio`;

function toProfile(row: StudentRow): StudentProfile {
  const dateOfBirth = parsePlainDate(row.date_of_birth);
  if (!dateOfBirth.ok) throw new Error("student_profile_corrupt");
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    nickname: row.nickname,
    dateOfBirth: dateOfBirth.value,
    academicStatus: row.academic_status as AcademicStatus,
    currentSemester: row.current_semester,
    gpaHundredths: row.gpa_hundredths,
    institutionId: row.institution_id,
    province: row.province,
    city: row.city,
    addressLine: row.address_line,
    hobby: row.hobby,
    bio: row.bio,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function selectProfileRow(
  database: Db,
  userId: string,
): Promise<StudentRow | null> {
  const row = (await database.prepare(SELECT_BY_USER).get(userId)) as
    | StudentRow
    | undefined;
  return row ?? null;
}

function auditSnapshot(row: StudentRow): AuditSnapshot {
  return {
    academicStatus: row.academic_status,
    currentSemester: row.current_semester,
    gpaHundredths: row.gpa_hundredths,
    institutionId: row.institution_id,
  };
}

export async function getMyStudentProfile(): Promise<StudentProfile | null> {
  const user = await getCurrentUser();
  if (user === null) return null;
  const row = await selectProfileRow(db, user.id);
  return row === null ? null : toProfile(row);
}

export type StudentIdentity = {
  readonly profile: StudentProfile;
  readonly institutionName: string | null;
};

type IdentityRow = StudentRow & { institution_name: string | null };

const SELECT_IDENTITY_BY_USER = `SELECT s.id, s.user_id, s.full_name,
  s.nickname, s.date_of_birth, s.academic_status, s.current_semester,
  s.gpa_hundredths, s.institution_id, s.province, s.city,
  s.address_line, s.hobby, s.bio, s.created_at, s.updated_at,
  i.name AS institution_name
FROM students s
LEFT JOIN institutions i ON i.id = s.institution_id
WHERE s.user_id = ?`;

export async function getMyStudentIdentity(): Promise<StudentIdentity | null> {
  const user = await getCurrentUser();
  if (user === null) return null;
  const row = (await db.prepare(SELECT_IDENTITY_BY_USER).get(user.id)) as
    | IdentityRow
    | undefined;
  if (row === undefined) return null;
  return { profile: toProfile(row), institutionName: row.institution_name };
}

export async function saveStudentProfile(
  input: StudentProfileInput,
): Promise<StudentProfile> {
  const user = await getCurrentUser();
  if (user === null) throw new Error("unauthenticated");
  const database = db;
  const previous = await selectProfileRow(database, user.id);
  const occurredAt = new Date();
  const stamp = occurredAt.toISOString();
  const studentId = previous?.id ?? newId(occurredAt.getTime());
  const after: AuditSnapshot = {
    academicStatus: input.academicStatus,
    currentSemester: input.currentSemester ?? null,
    gpaHundredths: input.gpaHundredths ?? null,
    institutionId: input.institutionId ?? null,
  };
  const before = previous === null ? undefined : auditSnapshot(previous);
  const prepared = await prepareAudit({
    actorType: "user",
    actorId: user.id,
    action: "student.profile_saved",
    entityType: "student",
    entityId: studentId,
    before,
    after,
  });
  const gpaChanged = (before?.gpaHundredths ?? null) !== after.gpaHundredths;
  const gpaAudit =
    gpaChanged && after.gpaHundredths !== null
      ? await prepareAudit({
          actorType: "user",
          actorId: user.id,
          action: "student.gpa_updated",
          entityType: "student",
          entityId: studentId,
          before: { gpaHundredths: before?.gpaHundredths ?? null },
          after: { gpaHundredths: after.gpaHundredths },
        })
      : null;
  await inTransaction(database, async () => {
    await database
      .prepare(UPSERT_STUDENT)
      .run(
        studentId,
        user.id,
        input.fullName,
        input.nickname ?? null,
        input.dateOfBirth,
        input.academicStatus,
        input.currentSemester ?? null,
        input.gpaHundredths ?? null,
        input.institutionId ?? null,
        input.province,
        input.city,
        input.addressLine ?? null,
        input.hobby ?? null,
        input.bio ?? null,
        stamp,
        stamp,
      );
    await appendAudit(database, prepared);
    if (gpaAudit !== null) await appendAudit(database, gpaAudit);
  });
  const saved = await selectProfileRow(database, user.id);
  if (saved === null) throw new Error("student_profile_corrupt");
  return toProfile(saved);
}
