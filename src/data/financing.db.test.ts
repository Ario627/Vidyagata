import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { isPublicRef } from "@/domain/financing/public-ref";
import { rupiah } from "@/domain/money/money";
import type { PlainDate } from "@/domain/time/plain-date";
import { openAuthDatabase } from "@/lib/db/sqlite";
import { recordConsent } from "./consents";
import {
  cancelMyFacility,
  getMyFacility,
  listMyFacilities,
  saveMyDraft,
  submitMyFacility,
} from "./financing";
import { getMyStudentProfile, saveStudentProfile } from "./students";

const session = vi.hoisted(() => ({ userId: "user-1" }));

vi.mock("@/lib/session", () => ({
  getCurrentUser: async () => ({ id: session.userId }),
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

const directory = mkdtempSync(join(tmpdir(), "vidyagata-financing-"));
process.env.VIDYAGATA_DB_FILE = join(directory, "financing.db");

const INSTITUTION_ID = "inst-test-1";

const STUDENT_PROFILE = {
  fullName: "Sari Dewanti",
  nickname: "Sari",
  dateOfBirth: "2005-04-12" as PlainDate,
  academicStatus: "undergraduate" as const,
  currentSemester: 5,
  gpaHundredths: 372,
  institutionId: INSTITUTION_ID,
  province: "Jawa Barat",
  city: "Depok",
};

function auditRows(entityId: string) {
  return openAuthDatabase()
    .prepare(
      "SELECT action, before_json, after_json FROM audit_logs WHERE entity_id = ? ORDER BY occurred_at, id",
    )
    .all(entityId) as {
    action: string;
    before_json: string | null;
    after_json: string | null;
  }[];
}

beforeAll(() => {
  const database = openAuthDatabase();
  const stamp = "2026-01-01T00:00:00.000Z";
  const insertUser = database.prepare(
    "INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, 1, ?, ?)",
  );
  insertUser.run("user-1", "Sari Dewanti", "sari@example.com", stamp, stamp);
  insertUser.run("user-2", "Budi Santoso", "budi@example.com", stamp, stamp);
  insertUser.run("user-3", "Tuti Gerbang", "tuti@example.com", stamp, stamp);
  database
    .prepare(
      `INSERT INTO institutions (id, name, slug, type, city, province, verification_method, partnership_status, created_at, updated_at)
       VALUES (?, 'Universitas Uji', 'universitas-uji', 'university', 'Depok', 'Jawa Barat', 'manual_document', 'active', ?, ?)`,
    )
    .run(INSTITUTION_ID, stamp, stamp);
});

function insertProof(studentId: string) {
  openAuthDatabase()
    .prepare(
      `INSERT INTO student_documents (
        id, student_id, kind, mime, byte_size, sha256, data, created_at, updated_at
      ) VALUES (?, ?, 'purpose_proof', 'application/pdf', 4, ?, ?, ?, ?)`,
    )
    .run(
      `proof-${studentId}`,
      studentId,
      "c".repeat(64),
      new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );
}

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("profil mahasiswa", () => {
  it("menyimpan profil lalu mengembalikannya dengan tipe yang benar", async () => {
    const before = await getMyStudentProfile();
    expect(before).toBeNull();
    const saved = await saveStudentProfile(STUDENT_PROFILE);
    expect(saved.fullName).toBe("Sari Dewanti");
    expect(saved.gpaHundredths).toBe(372);
    expect(saved.currentSemester).toBe(5);
    expect(saved.institutionId).toBe(INSTITUTION_ID);
    const loaded = await getMyStudentProfile();
    expect(loaded).toEqual(saved);
    const rows = auditRows(saved.id);
    expect(rows.map((row) => row.action)).toContain("student.profile_saved");
    expect(rows.map((row) => row.action)).toContain("student.gpa_updated");
    insertProof(saved.id);
  });

  it("memperbarui profil tanpa membuat baris kedua", async () => {
    const updated = await saveStudentProfile({
      ...STUDENT_PROFILE,
      nickname: "Sari D",
      gpaHundredths: 380,
    });
    const count = openAuthDatabase()
      .prepare("SELECT COUNT(*) AS total FROM students")
      .get() as { total: number };
    expect(count.total).toBe(1);
    expect(updated.nickname).toBe("Sari D");
    expect(updated.gpaHundredths).toBe(380);
  });
});

describe("draft dan submit", () => {
  it("menolak draft saat profil mahasiswa belum ada", async () => {
    session.userId = "user-2";
    await expect(
      saveMyDraft({ institutionId: INSTITUTION_ID }),
    ).rejects.toThrow("student_profile_required");
    session.userId = "user-1";
  });

  it("membuat draft berreferensi publik lalu mengisi bertahap di baris yang sama", async () => {
    const first = await saveMyDraft({ institutionId: INSTITUTION_ID });
    expect(first.status).toBe("draft");
    expect(isPublicRef(first.publicRef)).toBe(true);
    expect(first.institutionId).toBe(INSTITUTION_ID);
    const second = await saveMyDraft({
      requestedAmount: rupiah(5_000_000),
      academicPurpose: "tuition",
      purposeNote:
        "Dana dipakai untuk melunasi UKT semester lima sesuai tagihan kampus.",
    });
    expect(second.id).toBe(first.id);
    expect(second.publicRef).toBe(first.publicRef);
    expect(second.institutionId).toBe(INSTITUTION_ID);
    expect(second.requestedAmount).toBe(5_000_000);
    expect(second.academicPurpose).toBe("tuition");
    expect(second.purposeNote).toContain("UKT semester lima");
  });

  it("menolak submit tanpa catatan penggunaan dana", async () => {
    session.userId = "user-3";
    await saveStudentProfile({ ...STUDENT_PROFILE, fullName: "Tuti Gerbang" });
    const draft = await saveMyDraft({
      institutionId: INSTITUTION_ID,
      requestedAmount: rupiah(2_000_000),
      academicPurpose: "living_cost",
    });
    await expect(submitMyFacility(draft.id)).rejects.toThrow(
      "purpose_note_required",
    );
    session.userId = "user-1";
  });

  it("menolak submit tanpa bukti penggunaan dana", async () => {
    session.userId = "user-3";
    const draft = await saveMyDraft({
      purposeNote:
        "Dana dipakai untuk biaya kos enam bulan sesuai perjanjian sewa terlampir.",
    });
    await expect(submitMyFacility(draft.id)).rejects.toThrow("proof_required");
    session.userId = "user-1";
  });

  it("menolak submit tanpa persetujuan aktif", async () => {
    const drafted = await saveMyDraft({});
    await expect(submitMyFacility(drafted.id)).rejects.toThrow(
      "consent_required",
    );
  });

  it("submit mengubah status, mengisi waktu, dan menulis audit", async () => {
    await recordConsent({ key: "data_processing", grantedVia: "checkbox" });
    const list = await listMyFacilities();
    const draft = list.find((facility) => facility.status === "draft");
    if (draft === undefined) throw new Error("draft tidak ditemukan");
    const submitted = await submitMyFacility(draft.id);
    expect(submitted.status).toBe("submitted");
    expect(submitted.submittedAt).not.toBeNull();
    const rows = auditRows(draft.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.action).toBe("financing.status_changed");
    expect(rows[0]?.before_json).toContain("draft");
    expect(rows[0]?.after_json).toContain("submitted");
  });

  it("membuat draft baru setelah submit dan menolak submit kedua saat fasilitas aktif", async () => {
    const draft = await saveMyDraft({ institutionId: INSTITUTION_ID });
    const filled = await saveMyDraft({
      requestedAmount: rupiah(3_000_000),
      academicPurpose: "living_cost",
      purposeNote:
        "Dana dipakai untuk biaya kos dan makan enam bulan sesuai perjanjian sewa.",
    });
    expect(filled.id).toBe(draft.id);
    await expect(submitMyFacility(filled.id)).rejects.toThrow(
      "active_facility_exists",
    );
  });

  it("pengguna kedua mendapat urutan referensi berikutnya", async () => {
    session.userId = "user-2";
    await saveStudentProfile({ ...STUDENT_PROFILE, fullName: "Budi Santoso" });
    const draft = await saveMyDraft({ institutionId: INSTITUTION_ID });
    expect(isPublicRef(draft.publicRef)).toBe(true);
    const rows = await listMyFacilities();
    expect(rows).toHaveLength(1);
    session.userId = "user-1";
  });

  it("mengakses fasilitas pengguna lain mengembalikan null tanpa membocorkan data", async () => {
    const mine = await listMyFacilities();
    const target = mine[0];
    if (target === undefined) throw new Error("fasilitas tidak ditemukan");
    session.userId = "user-2";
    expect(await getMyFacility(target.id)).toBeNull();
    session.userId = "user-1";
    expect((await getMyFacility(target.id))?.id).toBe(target.id);
  });

  it("membatalkan fasilitas lalu mengizinkan submit berikutnya", async () => {
    const list = await listMyFacilities();
    const submitted = list.find((facility) => facility.status === "submitted");
    const draft = list.find((facility) => facility.status === "draft");
    if (submitted === undefined || draft === undefined) {
      throw new Error("fasilitas uji tidak lengkap");
    }
    const cancelled = await cancelMyFacility(submitted.id);
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.closedAt).not.toBeNull();
    await expect(cancelMyFacility(submitted.id)).rejects.toThrow(
      "invalid_transition",
    );
    const resubmitted = await submitMyFacility(draft.id);
    expect(resubmitted.status).toBe("submitted");
    const finalList = await listMyFacilities();
    expect(finalList).toHaveLength(2);
    expect(finalList.map((facility) => facility.status).sort()).toEqual([
      "cancelled",
      "submitted",
    ]);
  });
});
