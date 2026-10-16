import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { openAuthDatabase } from "@/lib/db/sqlite";
import {
  applyToJob,
  getMyApplicationForPosting,
  listMyApplications,
  withdrawApplication,
} from "./applications";

const session = vi.hoisted(() => ({ userId: "app-student-user-1" }));

vi.mock("@/lib/session", () => ({
  getCurrentUser: async () => ({ id: session.userId }),
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

const directory = mkdtempSync(join(tmpdir(), "vidyagata-applications-"));
process.env.VIDYAGATA_DB_FILE = join(directory, "applications.db");

const STAMP = "2026-10-01T00:00:00.000Z";
const POSTING_ACTIVE = "posting-active-000000000001";
const POSTING_DRAFT = "posting-draft-0000000000001";

function insertUser(id: string, name: string) {
  openAuthDatabase()
    .prepare(
      "INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, 1, ?, ?)",
    )
    .run(id, name, `${id}@example.com`, STAMP, STAMP);
}

function insertStudent(id: string, userId: string) {
  openAuthDatabase()
    .prepare(
      "INSERT INTO students (id, user_id, full_name, date_of_birth, academic_status, current_semester, gpa_hundredths, province, city, created_at, updated_at) VALUES (?, ?, ?, '2005-01-01', 'undergraduate', 5, 350, 'Jawa Barat', 'Depok', ?, ?)",
    )
    .run(id, userId, `Mahasiswa ${id}`, STAMP, STAMP);
}

function insertPosting(id: string, title: string, status: string) {
  openAuthDatabase()
    .prepare(
      `INSERT INTO job_postings (
        id, employer_id, title, description, job_type, weekly_hours,
        compensation_type, compensation_min, compensation_max, location_type,
        city, status, published_at, created_at, updated_at
      ) VALUES (?, 'emp-1', ?, 'Deskripsi uji', 'part_time', 10, 'hourly',
        20000, 30000, 'onsite', 'Depok', ?, ?, ?, ?)`,
    )
    .run(id, title, status, status === "active" ? STAMP : null, STAMP, STAMP);
}

function insertCv(studentId: string) {
  openAuthDatabase()
    .prepare(
      `INSERT INTO student_documents (
        id, student_id, kind, mime, byte_size, sha256, data, created_at, updated_at
      ) VALUES (?, ?, 'cv', 'application/pdf', 4, ?, ?, ?, ?)`,
    )
    .run(
      `cv-${studentId}`,
      studentId,
      "a".repeat(64),
      new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      STAMP,
      STAMP,
    );
}

beforeAll(() => {
  const database = openAuthDatabase();
  database
    .prepare(
      `INSERT INTO employers (id, user_id, name, sector, city, status, created_at, updated_at)
       VALUES ('emp-1', NULL, 'Mitra Uji', 'kuliner', 'Depok', 'active', ?, ?)`,
    )
    .run(STAMP, STAMP);
  insertUser("app-student-user-1", "Mahasiswa Satu");
  insertUser("app-student-user-2", "Mahasiswa Dua");
  insertStudent("app-student-1", "app-student-user-1");
  insertStudent("app-student-2", "app-student-user-2");
  insertCv("app-student-1");
  insertPosting(POSTING_ACTIVE, "Barista Uji", "active");
  insertPosting(POSTING_DRAFT, "Barista Draf", "draft");
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("applyToJob", () => {
  it("mengirim lamaran dengan status submitted dan audit", async () => {
    session.userId = "app-student-user-1";
    const result = await applyToJob({
      postingId: POSTING_ACTIVE,
      note: "Bisa mulai minggu depan",
    });
    expect(result.ok).toBe(true);
    const row = openAuthDatabase()
      .prepare(
        "SELECT status, note, submitted_at, student_id FROM job_applications WHERE job_posting_id = ?",
      )
      .get(POSTING_ACTIVE) as {
      status: string;
      note: string;
      submitted_at: string | null;
      student_id: string;
    };
    expect(row.status).toBe("submitted");
    expect(row.note).toBe("Bisa mulai minggu depan");
    expect(row.submitted_at).not.toBeNull();
    expect(row.student_id).toBe("app-student-1");
    const audit = openAuthDatabase()
      .prepare(
        "SELECT COUNT(*) AS total FROM audit_logs WHERE action = 'job.application_submitted'",
      )
      .get() as { total: number };
    expect(audit.total).toBe(1);
  });

  it("menolak lamaran kedua ke lowongan yang sama", async () => {
    session.userId = "app-student-user-1";
    const result = await applyToJob({ postingId: POSTING_ACTIVE });
    expect(result).toEqual({ ok: false, code: "already_applied" });
  });

  it("menolak lamaran tanpa CV terunggah", async () => {
    session.userId = "app-student-user-2";
    const result = await applyToJob({ postingId: POSTING_ACTIVE });
    expect(result).toEqual({ ok: false, code: "cv_required" });
  });

  it("menolak lowongan yang belum dibuka", async () => {
    session.userId = "app-student-user-1";
    const result = await applyToJob({ postingId: POSTING_DRAFT });
    expect(result).toEqual({ ok: false, code: "posting_not_open" });
  });

  it("menolak lowongan yang tidak ada", async () => {
    session.userId = "app-student-user-1";
    const result = await applyToJob({
      postingId: "posting-ghost-000000000001",
    });
    expect(result).toEqual({ ok: false, code: "posting_not_found" });
  });

  it("mewajibkan profil akademik", async () => {
    insertUser("app-user-3", "Tanpa Profil");
    session.userId = "app-user-3";
    const result = await applyToJob({ postingId: POSTING_ACTIVE });
    expect(result).toEqual({ ok: false, code: "student_profile_required" });
  });

  it("constraint database menolak lamaran aktif ganda", () => {
    expect(() =>
      openAuthDatabase()
        .prepare(
          `INSERT INTO job_applications (id, student_id, job_posting_id, status, note, submitted_at, decided_at, created_at, updated_at)
           VALUES ('app-dupe-1', 'app-student-1', ?, 'submitted', NULL, ?, NULL, ?, ?)`,
        )
        .run(POSTING_ACTIVE, STAMP, STAMP, STAMP),
    ).toThrow(/UNIQUE constraint failed: job_applications/);
  });
});

describe("withdrawApplication", () => {
  it("hanya pemilik lamaran yang bisa menarik", async () => {
    session.userId = "app-student-user-2";
    const target = (await openAuthDatabase()
      .prepare("SELECT id FROM job_applications WHERE job_posting_id = ?")
      .get(POSTING_ACTIVE)) as { id: string };
    const result = await withdrawApplication(target.id);
    expect(result).toEqual({ ok: false, code: "not_found" });
  });

  it("menarik lamaran sendiri dan tercatat di audit", async () => {
    session.userId = "app-student-user-1";
    const target = (await openAuthDatabase()
      .prepare("SELECT id FROM job_applications WHERE job_posting_id = ?")
      .get(POSTING_ACTIVE)) as { id: string };
    const result = await withdrawApplication(target.id);
    expect(result.ok).toBe(true);
    const row = openAuthDatabase()
      .prepare("SELECT status, decided_at FROM job_applications WHERE id = ?")
      .get(target.id) as { status: string; decided_at: string | null };
    expect(row.status).toBe("withdrawn");
    expect(row.decided_at).not.toBeNull();
    const audit = openAuthDatabase()
      .prepare(
        "SELECT COUNT(*) AS total FROM audit_logs WHERE action = 'job.application_withdrawn'",
      )
      .get() as { total: number };
    expect(audit.total).toBe(1);
  });

  it("menolak penarikan kedua", async () => {
    session.userId = "app-student-user-1";
    const target = (await openAuthDatabase()
      .prepare("SELECT id FROM job_applications WHERE job_posting_id = ?")
      .get(POSTING_ACTIVE)) as { id: string };
    const result = await withdrawApplication(target.id);
    expect(result).toEqual({ ok: false, code: "invalid_transition" });
  });

  it("membuka jalan melamar ulang setelah ditarik", async () => {
    session.userId = "app-student-user-1";
    const result = await applyToJob({ postingId: POSTING_ACTIVE });
    expect(result.ok).toBe(true);
    const count = openAuthDatabase()
      .prepare(
        "SELECT COUNT(*) AS total FROM job_applications WHERE job_posting_id = ?",
      )
      .get(POSTING_ACTIVE) as { total: number };
    expect(count.total).toBe(2);
  });
});

describe("getMyApplicationForPosting dan listMyApplications", () => {
  it("mengembalikan lamaran aktif milik sendiri", async () => {
    session.userId = "app-student-user-1";
    const ref = await getMyApplicationForPosting(POSTING_ACTIVE);
    expect(ref?.status).toBe("submitted");
    const other = await getMyApplicationForPosting(POSTING_DRAFT);
    expect(other).toBeNull();
  });

  it("mengembalikan null untuk pengguna tanpa profil", async () => {
    session.userId = "app-user-3";
    expect(await getMyApplicationForPosting(POSTING_ACTIVE)).toBeNull();
  });

  it("mendaftar lamaran dengan detail lowongan dan mitra", async () => {
    session.userId = "app-student-user-1";
    const applications = await listMyApplications();
    expect(applications).toHaveLength(2);
    const active = applications[0];
    expect(active?.postingTitle).toBe("Barista Uji");
    expect(active?.employerName).toBe("Mitra Uji");
    expect(active?.status).toBe("submitted");
    const withdrawn = applications[1];
    expect(withdrawn?.status).toBe("withdrawn");
  });

  it("mengembalikan daftar kosong untuk pengguna tanpa profil", async () => {
    session.userId = "app-user-3";
    expect(await listMyApplications()).toEqual([]);
  });
});
