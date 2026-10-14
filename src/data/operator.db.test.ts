import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { openAuthDatabase } from "@/lib/db/sqlite";
import {
  claimFacility,
  forwardFacility,
  getReviewDetail,
  listReviewQueue,
  rejectFacility,
} from "./operator";

const session = vi.hoisted(() => ({ userId: "officer-1" }));

vi.mock("@/lib/session", () => ({
  getCurrentUser: async () => ({ id: session.userId }),
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

const directory = mkdtempSync(join(tmpdir(), "vidyagata-operator-"));
process.env.VIDYAGATA_DB_FILE = join(directory, "operator.db");

const STAMP = "2026-10-01T00:00:00.000Z";

function insertUser(id: string, name: string, email: string) {
  openAuthDatabase()
    .prepare(
      "INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, 1, ?, ?)",
    )
    .run(id, name, email, STAMP, STAMP);
}

function grantOperator(userId: string, withMfa = true) {
  const database = openAuthDatabase();
  database
    .prepare(
      "INSERT INTO user_roles (id, user_id, role, granted_by_user_id, granted_at, revoked_at, reason) VALUES (?, ?, 'operator', NULL, ?, NULL, NULL)",
    )
    .run(`role-${userId}`, userId, STAMP);
  if (withMfa) {
    database
      .prepare("UPDATE user SET twoFactorEnabled = 1 WHERE id = ?")
      .run(userId);
  }
}

function insertStudent(
  id: string,
  userId: string,
  gpa: number | null,
  status: string,
) {
  openAuthDatabase()
    .prepare(
      "INSERT INTO students (id, user_id, full_name, date_of_birth, academic_status, current_semester, gpa_hundredths, province, city, created_at, updated_at) VALUES (?, ?, ?, '2005-01-01', ?, 5, ?, 'Jawa Barat', 'Depok', ?, ?)",
    )
    .run(id, userId, `Mahasiswa ${id}`, status, gpa, STAMP, STAMP);
}

function insertFacility(id: string, studentId: string, amount = 4_000_000) {
  openAuthDatabase()
    .prepare(
      `INSERT INTO financing_facilities (id, public_ref, student_id, institution_id, status,
        scheme_type, academic_purpose, requested_amount, submitted_at, created_at, updated_at)
       VALUES (?, ?, ?, 'inst-op-1', 'submitted', 'vidyafund', 'tuition', ?, ?, ?, ?)`,
    )
    .run(
      id,
      `VG-FIN-2026-${id.slice(-6)}`,
      studentId,
      amount,
      STAMP,
      STAMP,
      STAMP,
    );
}

beforeAll(() => {
  const database = openAuthDatabase();
  database
    .prepare(
      `INSERT INTO institutions (id, name, slug, type, city, province, verification_method, partnership_status, created_at, updated_at)
       VALUES ('inst-op-1', 'Kampus Operator', 'kampus-operator', 'university', 'Depok', 'Jawa Barat', 'manual_document', 'prospect', ?, ?)`,
    )
    .run(STAMP, STAMP);
  insertUser("officer-1", "Petugas Satu", "officer1@example.com");
  insertUser("officer-2", "Petugas Dua", "officer2@example.com");
  insertUser("officer-3", "Petugas Tiga", "officer3@example.com");
  insertUser("student-user-1", "Mahasiswa Satu", "student1@example.com");
  insertUser("student-user-2", "Mahasiswa Dua", "student2@example.com");
  grantOperator("officer-1");
  grantOperator("officer-2");
  grantOperator("officer-3", false);
  insertStudent("student-strong", "student-user-1", 372, "undergraduate");
  insertStudent("student-weak", "student-user-2", 0, "dropout");
  insertUser("student-user-3", "Mahasiswa Tiga", "student3@example.com");
  insertStudent("student-extra", "student-user-3", 310, "undergraduate");
  insertFacility("facility-000001", "student-strong");
  insertFacility("facility-000002", "student-weak", 20_000_000);
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("listReviewQueue", () => {
  it("menampilkan antrean dengan status klaim", async () => {
    const queue = await listReviewQueue();
    expect(queue).toHaveLength(2);
    expect(queue.every((item) => item.status === "submitted")).toBe(true);
    expect(queue.every((item) => item.claimedByMe === false)).toBe(true);
    expect(queue[0]?.institutionName).toBe("Kampus Operator");
  });
});

describe("claimFacility", () => {
  it("mengklaim fasilitas submitted menjadi under_review milik petugas", async () => {
    const claimed = await claimFacility("facility-000001");
    expect(claimed.ok).toBe(true);
    const detail = await getReviewDetail("facility-000001");
    expect(detail?.status).toBe("under_review");
    expect(detail?.claimedByMe).toBe(true);
    expect(detail?.claimedByName).toBe("Petugas Satu");
    const audit = openAuthDatabase()
      .prepare(
        "SELECT actor_type, actor_id, reason, after_json FROM audit_logs WHERE action = 'financing.status_changed'",
      )
      .get() as {
      actor_type: string;
      actor_id: string;
      reason: string;
      after_json: string;
    };
    expect(audit.actor_type).toBe("operator");
    expect(audit.actor_id).toBe("officer-1");
    expect(audit.reason).toBe("Klaim antrian untuk peninjauan");
    expect(audit.after_json).toContain("under_review");
  });

  it("menolak klaim kedua atas fasilitas yang sama", async () => {
    session.userId = "officer-2";
    const claimed = await claimFacility("facility-000001");
    expect(claimed.ok).toBe(false);
    if (claimed.ok) return;
    expect(claimed.code).toBe("invalid_transition");
    session.userId = "officer-1";
  });

  it("menyembunyikan fasilitas yang diklaim petugas lain", async () => {
    session.userId = "officer-2";
    expect(await getReviewDetail("facility-000001")).toBeNull();
    session.userId = "officer-1";
  });

  it("menolak klaim fasilitas yang tidak ada", async () => {
    const claimed = await claimFacility("facility-ghost");
    expect(claimed.ok).toBe(false);
    if (claimed.ok) return;
    expect(claimed.code).toBe("facility_not_found");
  });
});

describe("gate verifikasi dua langkah", () => {
  it("menolak aksi tulis operator yang belum mengaktifkan dua langkah", async () => {
    session.userId = "officer-3";
    const claimed = await claimFacility("facility-000001");
    expect(claimed.ok).toBe(false);
    if (claimed.ok) return;
    expect(claimed.code).toBe("mfa_required");
    const forwarded = await forwardFacility({ facilityId: "facility-000001" });
    expect(forwarded.ok).toBe(false);
    if (forwarded.ok) return;
    expect(forwarded.code).toBe("mfa_required");
    const rejected = await rejectFacility({
      facilityId: "facility-000001",
      reason: "Percobaan tanpa dua langkah",
    });
    expect(rejected.ok).toBe(false);
    if (rejected.ok) return;
    expect(rejected.code).toBe("mfa_required");
    session.userId = "officer-1";
  });
});

describe("forwardFacility", () => {
  it("meneruskan fasilitas dengan skor memadai tanpa alasan tambahan", async () => {
    const detail = await getReviewDetail("facility-000001");
    expect(detail?.eligibility.score).toBeGreaterThanOrEqual(
      detail?.minScore ?? 50,
    );
    const forwarded = await forwardFacility({ facilityId: "facility-000001" });
    expect(forwarded.ok).toBe(true);
    const database = openAuthDatabase();
    const facility = database
      .prepare(
        "SELECT status, lender_id FROM financing_facilities WHERE id = 'facility-000001'",
      )
      .get() as { status: string; lender_id: string | null };
    expect(facility.status).toBe("forwarded_to_lender");
    expect(facility.lender_id).not.toBeNull();
    const assessment = database
      .prepare(
        "SELECT assessed_by, score, engine_version, factors_json FROM eligibility_assessments WHERE facility_id = 'facility-000001'",
      )
      .get() as {
      assessed_by: string;
      score: number;
      engine_version: string;
      factors_json: string;
    };
    expect(assessment.assessed_by).toBe("vidya_ai");
    expect(assessment.engine_version).toBe("vidya-elig-1.0.0");
    expect(assessment.factors_json).toContain("gpa_band");
  });

  it("menolak meneruskan fasilitas yang tidak diklaim oleh petugas", async () => {
    session.userId = "officer-2";
    const forwarded = await forwardFacility({ facilityId: "facility-000001" });
    expect(forwarded.ok).toBe(false);
    if (forwarded.ok) return;
    expect(forwarded.code).toBe("facility_not_found");
    session.userId = "officer-1";
  });

  it("mewajibkan alasan saat skor di bawah ambang", async () => {
    await claimFacility("facility-000002");
    const detail = await getReviewDetail("facility-000002");
    expect(detail?.eligibility.score).toBeLessThan(detail?.minScore ?? 50);
    const withoutReason = await forwardFacility({
      facilityId: "facility-000002",
    });
    expect(withoutReason.ok).toBe(false);
    if (withoutReason.ok) return;
    expect(withoutReason.code).toBe("reason_required");
    const withReason = await forwardFacility({
      facilityId: "facility-000002",
      reason: "Potensi naik semester depan, disetujui manual",
    });
    expect(withReason.ok).toBe(true);
    const audit = openAuthDatabase()
      .prepare(
        "SELECT reason, after_json FROM audit_logs WHERE entity_id = 'facility-000002' ORDER BY occurred_at DESC, id DESC LIMIT 1",
      )
      .get() as { reason: string; after_json: string };
    expect(audit.reason).toBe("Potensi naik semester depan, disetujui manual");
    expect(audit.after_json).toContain("below_threshold");
  });
});

describe("rejectFacility", () => {
  it("mewajibkan alasan penolakan", async () => {
    insertFacility("facility-000003", "student-extra");
    await claimFacility("facility-000003");
    const empty = await rejectFacility({
      facilityId: "facility-000003",
      reason: "   ",
    });
    expect(empty.ok).toBe(false);
    if (empty.ok) return;
    expect(empty.code).toBe("reason_required");
  });

  it("menolak fasilitas dengan alasan dan menutup waktunya", async () => {
    const rejected = await rejectFacility({
      facilityId: "facility-000003",
      reason: "Dokumen akademik tidak cocok",
    });
    expect(rejected.ok).toBe(true);
    const row = openAuthDatabase()
      .prepare(
        "SELECT status, closed_at FROM financing_facilities WHERE id = 'facility-000003'",
      )
      .get() as { status: string; closed_at: string | null };
    expect(row.status).toBe("rejected");
    expect(row.closed_at).not.toBeNull();
    const again = await rejectFacility({
      facilityId: "facility-000003",
      reason: "Dobel",
    });
    expect(again.ok).toBe(false);
    if (again.ok) return;
    expect(again.code).toBe("invalid_transition");
  });
});
