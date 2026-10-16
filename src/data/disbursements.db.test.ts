import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getDb } from "@/lib/db/client";
import { openAuthDatabase } from "@/lib/db/sqlite";
import {
  decideDisbursement,
  executeDisbursement,
  getPencairanDetail,
  initiateDisbursement,
  listPencairanQueue,
  recordAgreementSignature,
  recordLenderDecision,
  withdrawDisbursement,
} from "./disbursements";

const session = vi.hoisted(() => ({ userId: "officer-a" }));

vi.mock("@/lib/session", () => ({
  getCurrentUser: async () => ({ id: session.userId }),
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

const directory = mkdtempSync(join(tmpdir(), "vidyagata-pencairan-"));
process.env.VIDYAGATA_DB_FILE = join(directory, "pencairan.db");

const SUBMITTED_AT = "2026-10-01T00:00:00.000Z";
const APPROVED_AT = "2026-10-02T00:00:00.000Z";
const SIGNED_AT = "2026-10-03T00:00:00.000Z";
const STAMP = "2026-09-30T00:00:00.000Z";
const AMOUNT = 4_000_000;

function insertUser(id: string, name: string) {
  openAuthDatabase()
    .prepare(
      "INSERT INTO user (id, name, email, emailVerified, twoFactorEnabled, createdAt, updatedAt) VALUES (?, ?, ?, 1, 1, ?, ?)",
    )
    .run(id, name, `${id}@example.com`, STAMP, STAMP);
}

function grantOperator(userId: string) {
  openAuthDatabase()
    .prepare(
      "INSERT INTO user_roles (id, user_id, role, granted_by_user_id, granted_at, revoked_at, reason) VALUES (?, ?, 'operator', NULL, ?, NULL, NULL)",
    )
    .run(`role-${userId}`, userId, STAMP);
}

function insertStudent(id: string, userId: string) {
  openAuthDatabase()
    .prepare(
      "INSERT INTO students (id, user_id, full_name, date_of_birth, academic_status, current_semester, gpa_hundredths, province, city, created_at, updated_at) VALUES (?, ?, ?, '2005-01-01', 'undergraduate', 5, 350, 'Jawa Barat', 'Depok', ?, ?)",
    )
    .run(id, userId, `Mahasiswa ${id}`, STAMP, STAMP);
}

function pilotLenderId(): string {
  const row = openAuthDatabase()
    .prepare("SELECT id FROM lenders ORDER BY created_at, id LIMIT 1")
    .get() as { id: string };
  return row.id;
}

function insertFacility(
  id: string,
  studentId: string,
  status: string,
  tenorMonths: number | null = 12,
) {
  const approved = status === "approved" || status === "signed";
  const signed = status === "signed";
  openAuthDatabase()
    .prepare(
      `INSERT INTO financing_facilities (
        id, public_ref, student_id, lender_id, institution_id, status,
        scheme_type, academic_purpose, requested_amount, approved_amount,
        tenor_months, annual_margin_rate_bp, service_fee_rate_bp,
        submitted_at, approved_at, signed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'inst-pc-1', ?, 'vidyafund', 'tuition', ?, ?, ?, 1200, 200, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      `VG-FIN-2026-${id.slice(-6)}`,
      studentId,
      pilotLenderId(),
      status,
      AMOUNT,
      approved ? AMOUNT : null,
      tenorMonths,
      SUBMITTED_AT,
      approved ? APPROVED_AT : null,
      signed ? SIGNED_AT : null,
      STAMP,
      STAMP,
    );
}

function asOfficer(userId: string) {
  session.userId = userId;
}

beforeAll(async () => {
  await getDb();
  const database = openAuthDatabase();
  database
    .prepare(
      `INSERT INTO institutions (id, name, slug, type, city, province, verification_method, partnership_status, created_at, updated_at)
       VALUES ('inst-pc-1', 'Kampus Pencairan', 'kampus-pencairan', 'university', 'Depok', 'Jawa Barat', 'manual_document', 'active', ?, ?)`,
    )
    .run(STAMP, STAMP);
  insertUser("officer-a", "Petugas A");
  insertUser("officer-b", "Petugas B");
  grantOperator("officer-a");
  grantOperator("officer-b");
  for (let index = 1; index <= 8; index += 1) {
    const suffix = index.toString().padStart(6, "0");
    insertUser(`student-user-${suffix}`, `Mahasiswa ${suffix}`);
    insertStudent(`pc-student-${suffix}`, `student-user-${suffix}`);
  }
  insertFacility("pcfac-000001", "pc-student-000001", "forwarded_to_lender");
  insertFacility("pcfac-000002", "pc-student-000002", "forwarded_to_lender");
  insertFacility("pcfac-000003", "pc-student-000003", "signed");
  insertFacility("pcfac-000004", "pc-student-000004", "signed");
  insertFacility("pcfac-000005", "pc-student-000005", "signed");
  insertFacility("pcfac-000006", "pc-student-000006", "signed");
  insertFacility(
    "pcfac-000007",
    "pc-student-000007",
    "forwarded_to_lender",
    null,
  );
  insertFacility(
    "pcfac-000008",
    "pc-student-000008",
    "forwarded_to_lender",
    null,
  );
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("recordLenderDecision", () => {
  it("menolak tanpa alasan", async () => {
    asOfficer("officer-a");
    const result = await recordLenderDecision({
      facilityId: "pcfac-000002",
      decision: "rejected",
    });
    expect(result).toEqual({ ok: false, code: "reason_required" });
  });

  it("mencatat penolakan mitra beserta alasan", async () => {
    asOfficer("officer-a");
    const result = await recordLenderDecision({
      facilityId: "pcfac-000002",
      decision: "rejected",
      reason: "Dokumen akademik tidak sesuai",
    });
    expect(result.ok).toBe(true);
    const row = openAuthDatabase()
      .prepare(
        "SELECT status, closed_at FROM financing_facilities WHERE id = ?",
      )
      .get("pcfac-000002") as { status: string; closed_at: string | null };
    expect(row.status).toBe("rejected");
    expect(row.closed_at).not.toBeNull();
  });

  it("menetapkan nominal dan tarif dari parameter mitra saat disetujui", async () => {
    asOfficer("officer-b");
    const result = await recordLenderDecision({
      facilityId: "pcfac-000001",
      decision: "approved",
    });
    expect(result.ok).toBe(true);
    const row = openAuthDatabase()
      .prepare(
        "SELECT status, approved_amount, annual_margin_rate_bp, service_fee_rate_bp, approved_at FROM financing_facilities WHERE id = ?",
      )
      .get("pcfac-000001") as {
      status: string;
      approved_amount: number;
      annual_margin_rate_bp: number;
      service_fee_rate_bp: number;
      approved_at: string | null;
    };
    expect(row.status).toBe("approved");
    expect(row.approved_amount).toBe(AMOUNT);
    expect(row.annual_margin_rate_bp).toBe(1200);
    expect(row.service_fee_rate_bp).toBe(200);
    expect(row.approved_at).not.toBeNull();
  });

  it("menolak persetujuan tanpa tenor saat fasilitas belum punya tenor", async () => {
    asOfficer("officer-a");
    const result = await recordLenderDecision({
      facilityId: "pcfac-000007",
      decision: "approved",
    });
    expect(result).toEqual({ ok: false, code: "invalid_tenor" });
  });

  it("menyimpan tenor keputusan mitra dan memakainya untuk jadwal cicilan", async () => {
    asOfficer("officer-a");
    const result = await recordLenderDecision({
      facilityId: "pcfac-000007",
      decision: "approved",
      tenorMonths: 24,
    });
    expect(result.ok).toBe(true);
    const row = openAuthDatabase()
      .prepare(
        "SELECT status, tenor_months, approved_amount FROM financing_facilities WHERE id = ?",
      )
      .get("pcfac-000007") as {
      status: string;
      tenor_months: number | null;
      approved_amount: number | null;
    };
    expect(row.status).toBe("approved");
    expect(row.tenor_months).toBe(24);
    expect(row.approved_amount).toBe(AMOUNT);
    const audit = openAuthDatabase()
      .prepare(
        "SELECT after_json FROM audit_logs WHERE entity_id = ? AND action = 'financing.status_changed' ORDER BY occurred_at DESC LIMIT 1",
      )
      .get("pcfac-000007") as { after_json: string };
    expect(audit.after_json).toContain('"tenor_months":24');
  });

  it("menolak tenor di atas batas mitra", async () => {
    asOfficer("officer-a");
    const result = await recordLenderDecision({
      facilityId: "pcfac-000008",
      decision: "approved",
      tenorMonths: 120,
    });
    expect(result).toEqual({ ok: false, code: "invalid_tenor" });
  });
});

describe("recordAgreementSignature", () => {
  it("mewajibkan catatan minimal", async () => {
    asOfficer("officer-a");
    const result = await recordAgreementSignature({
      facilityId: "pcfac-000001",
      note: "pendek",
    });
    expect(result).toEqual({ ok: false, code: "note_required" });
  });

  it("memindahkan status menjadi signed setelah catatan lengkap", async () => {
    asOfficer("officer-a");
    const result = await recordAgreementSignature({
      facilityId: "pcfac-000001",
      note: "Ditandatangani daring, arsip OP-2026-001",
    });
    expect(result.ok).toBe(true);
    const row = openAuthDatabase()
      .prepare(
        "SELECT status, signed_at FROM financing_facilities WHERE id = ?",
      )
      .get("pcfac-000001") as { status: string; signed_at: string | null };
    expect(row.status).toBe("signed");
    expect(row.signed_at).not.toBeNull();
  });

  it("menolak perjanjian pada tahap yang salah", async () => {
    asOfficer("officer-a");
    const result = await recordAgreementSignature({
      facilityId: "pcfac-000003",
      note: "Perjanjian dicatat lebih awal dari waktunya",
    });
    expect(result).toEqual({ ok: false, code: "invalid_transition" });
  });
});

describe("initiateDisbursement", () => {
  it("membuat permintaan dengan nominal tersimpan dari database", async () => {
    asOfficer("officer-a");
    const result = await initiateDisbursement("pcfac-000001");
    expect(result.ok).toBe(true);
    const row = openAuthDatabase()
      .prepare(
        "SELECT status, amount, initiated_by, destination_name FROM disbursement_requests WHERE facility_id = ?",
      )
      .get("pcfac-000001") as {
      status: string;
      amount: number;
      initiated_by: string;
      destination_name: string;
    };
    expect(row.status).toBe("requested");
    expect(row.amount).toBe(AMOUNT);
    expect(row.initiated_by).toBe("officer-a");
    expect(row.destination_name).toBe("Kampus Pencairan");
  });

  it("menolak permintaan kedua saat masih ada yang berjalan", async () => {
    asOfficer("officer-a");
    const result = await initiateDisbursement("pcfac-000001");
    expect(result).toEqual({ ok: false, code: "open_request_exists" });
  });

  it("menolak inisiasi pada status yang belum signed", async () => {
    asOfficer("officer-a");
    const result = await initiateDisbursement("pcfac-000002");
    expect(result).toEqual({ ok: false, code: "invalid_transition" });
  });
});

describe("four-eyes", () => {
  it("pengaju tidak bisa menyetujui permintaannya sendiri", async () => {
    asOfficer("officer-a");
    const result = await decideDisbursement({
      facilityId: "pcfac-000001",
      decision: "approved",
      confirmDestination: true,
    });
    expect(result).toEqual({ ok: false, code: "four_eyes_violation" });
  });

  it("menolak persetujuan tanpa konfirmasi tujuan", async () => {
    asOfficer("officer-b");
    const result = await decideDisbursement({
      facilityId: "pcfac-000001",
      decision: "approved",
      confirmDestination: false,
    });
    expect(result).toEqual({ ok: false, code: "confirmation_required" });
  });

  it("petugas lain bisa menyetujui dengan konfirmasi", async () => {
    asOfficer("officer-b");
    const result = await decideDisbursement({
      facilityId: "pcfac-000001",
      decision: "approved",
      confirmDestination: true,
    });
    expect(result.ok).toBe(true);
    const request = openAuthDatabase()
      .prepare(
        "SELECT status, decided_by FROM disbursement_requests WHERE facility_id = ?",
      )
      .get("pcfac-000001") as { status: string; decided_by: string };
    expect(request.status).toBe("approved");
    expect(request.decided_by).toBe("officer-b");
    const facility = openAuthDatabase()
      .prepare("SELECT status FROM financing_facilities WHERE id = ?")
      .get("pcfac-000001") as { status: string };
    expect(facility.status).toBe("signed");
  });

  it("constraint database menolak approver yang sama dengan pengaju", () => {
    openAuthDatabase()
      .prepare(
        "INSERT INTO disbursement_requests (id, facility_id, amount, destination_institution_id, destination_name, status, initiated_by, initiated_at, decided_by, decided_at, decision_reason, executed_by, executed_at, transfer_reference, created_at, updated_at) VALUES ('req-backstop-1', 'pcfac-000004', 4000000, 'inst-pc-1', 'Kampus Pencairan', 'requested', 'officer-a', ?, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?)",
      )
      .run(STAMP, STAMP, STAMP);
    expect(() =>
      openAuthDatabase()
        .prepare(
          "UPDATE disbursement_requests SET status = 'approved', decided_by = 'officer-a', decided_at = ? WHERE id = 'req-backstop-1'",
        )
        .run(STAMP),
    ).toThrow(/four_eyes/);
    openAuthDatabase()
      .prepare("DELETE FROM disbursement_requests WHERE id = 'req-backstop-1'")
      .run();
  });

  it("constraint database menolak eksekusi oleh orang selain pengaju", () => {
    openAuthDatabase()
      .prepare(
        "INSERT INTO disbursement_requests (id, facility_id, amount, destination_institution_id, destination_name, status, initiated_by, initiated_at, decided_by, decided_at, decision_reason, executed_by, executed_at, transfer_reference, created_at, updated_at) VALUES ('req-backstop-2', 'pcfac-000004', 4000000, 'inst-pc-1', 'Kampus Pencairan', 'requested', 'officer-a', ?, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?)",
      )
      .run(STAMP, STAMP, STAMP);
    expect(() =>
      openAuthDatabase()
        .prepare(
          "UPDATE disbursement_requests SET status = 'executed', decided_by = 'officer-b', decided_at = ?, executed_by = 'officer-b', executed_at = ?, transfer_reference = 'TRF-BACKSTOP-1' WHERE id = 'req-backstop-2'",
        )
        .run(STAMP, STAMP),
    ).toThrow();
    openAuthDatabase()
      .prepare("DELETE FROM disbursement_requests WHERE id = 'req-backstop-2'")
      .run();
  });
});

describe("decideDisbursement penolakan dan pembatalan", () => {
  it("penolakan membutuhkan alasan dan tidak mengubah status fasilitas", async () => {
    asOfficer("officer-a");
    await initiateDisbursement("pcfac-000003");
    asOfficer("officer-b");
    const missing = await decideDisbursement({
      facilityId: "pcfac-000003",
      decision: "rejected",
      confirmDestination: false,
    });
    expect(missing).toEqual({ ok: false, code: "reason_required" });
    const rejected = await decideDisbursement({
      facilityId: "pcfac-000003",
      decision: "rejected",
      reason: "Rekening tujuan berbeda dengan perjanjian",
      confirmDestination: false,
    });
    expect(rejected.ok).toBe(true);
    const facility = openAuthDatabase()
      .prepare("SELECT status FROM financing_facilities WHERE id = ?")
      .get("pcfac-000003") as { status: string };
    expect(facility.status).toBe("signed");
    asOfficer("officer-a");
    const again = await initiateDisbursement("pcfac-000003");
    expect(again.ok).toBe(true);
  });

  it("hanya pengaju yang bisa membatalkan permintaan", async () => {
    asOfficer("officer-b");
    const blocked = await withdrawDisbursement("pcfac-000003");
    expect(blocked).toEqual({ ok: false, code: "not_initiator" });
    asOfficer("officer-a");
    const result = await withdrawDisbursement("pcfac-000003");
    expect(result.ok).toBe(true);
    const row = openAuthDatabase()
      .prepare(
        "SELECT status, decided_by FROM disbursement_requests WHERE facility_id = ? AND status = 'withdrawn'",
      )
      .get("pcfac-000003") as { status: string; decided_by: string };
    expect(row.decided_by).toBe("officer-a");
  });
});

describe("executeDisbursement", () => {
  it("menolak eksekusi oleh petugas lain dan tanpa bukti", async () => {
    asOfficer("officer-a");
    await initiateDisbursement("pcfac-000005");
    asOfficer("officer-b");
    await decideDisbursement({
      facilityId: "pcfac-000005",
      decision: "approved",
      confirmDestination: true,
    });
    const wrongPerson = await executeDisbursement({
      facilityId: "pcfac-000005",
      transferReference: "TRF-2026-0001",
      deductionRate: 20,
    });
    expect(wrongPerson).toEqual({ ok: false, code: "not_initiator" });
    asOfficer("officer-a");
    const noReference = await executeDisbursement({
      facilityId: "pcfac-000005",
      transferReference: "abc",
      deductionRate: 20,
    });
    expect(noReference).toEqual({ ok: false, code: "reference_required" });
  });

  it("eksekusi penuh menulis status, jadwal cicilan, ledger, dan audit secara atomik", async () => {
    asOfficer("officer-a");
    const result = await executeDisbursement({
      facilityId: "pcfac-000005",
      transferReference: "TRF-2026-0001",
      deductionRate: 40,
    });
    expect(result.ok).toBe(true);
    const database = openAuthDatabase();
    const facility = database
      .prepare(
        "SELECT status, disbursed_at, payroll_deduction_rate FROM financing_facilities WHERE id = ?",
      )
      .get("pcfac-000005") as {
      status: string;
      disbursed_at: string | null;
      payroll_deduction_rate: number | null;
    };
    expect(facility.status).toBe("active");
    expect(facility.disbursed_at).not.toBeNull();
    expect(facility.payroll_deduction_rate).toBe(40);
    const schedule = database
      .prepare(
        "SELECT status, tenor_months, first_due_date FROM repayment_schedules WHERE facility_id = ?",
      )
      .get("pcfac-000005") as {
      status: string;
      tenor_months: number;
      first_due_date: string;
    };
    expect(schedule.status).toBe("active");
    expect(schedule.tenor_months).toBe(12);
    const installmentStats = database
      .prepare(
        `SELECT COUNT(*) AS total,
          SUM(CASE WHEN total_amount != principal_amount + margin_amount + fee_amount THEN 1 ELSE 0 END) AS mismatched,
          MIN(due_date) AS first_date
        FROM installments WHERE facility_id = ?`,
      )
      .get("pcfac-000005") as {
      total: number;
      mismatched: number;
      first_date: string;
    };
    expect(installmentStats.total).toBe(12);
    expect(installmentStats.mismatched).toBe(0);
    expect(installmentStats.first_date).toBe(schedule.first_due_date);
    const request = database
      .prepare(
        "SELECT id, status, executed_by, transfer_reference FROM disbursement_requests WHERE facility_id = ? AND status = 'executed'",
      )
      .get("pcfac-000005") as {
      id: string;
      status: string;
      executed_by: string;
      transfer_reference: string;
    };
    expect(request.executed_by).toBe("officer-a");
    expect(request.transfer_reference).toBe("TRF-2026-0001");
    const ledger = database
      .prepare(
        "SELECT facility_id, entry_type, direction, amount, idempotency_key FROM ledger_entries WHERE facility_id = ?",
      )
      .all("pcfac-000005") as {
      facility_id: string;
      entry_type: string;
      direction: string;
      amount: number;
      idempotency_key: string;
    }[];
    expect(ledger).toHaveLength(1);
    expect(ledger[0]?.entry_type).toBe("disbursement");
    expect(ledger[0]?.direction).toBe("debit");
    expect(ledger[0]?.amount).toBe(AMOUNT);
    expect(ledger[0]?.idempotency_key).toBe(`disbursement:${request.id}`);
    const audits = database
      .prepare("SELECT action FROM audit_logs WHERE entity_id IN (?, ?)")
      .all("pcfac-000005", request.id) as { action: string }[];
    expect(audits.length).toBeGreaterThan(0);
  });

  it("eksekusi kedua ditolak dan ledger tetap satu baris", async () => {
    asOfficer("officer-a");
    const result = await executeDisbursement({
      facilityId: "pcfac-000005",
      transferReference: "TRF-2026-0002",
      deductionRate: 20,
    });
    expect(result).toEqual({ ok: false, code: "invalid_transition" });
    const count = openAuthDatabase()
      .prepare(
        "SELECT COUNT(*) AS total FROM ledger_entries WHERE facility_id = ?",
      )
      .get("pcfac-000005") as { total: number };
    expect(count.total).toBe(1);
  });

  it("ledger tidak bisa diubah maupun dihapus", () => {
    expect(() =>
      openAuthDatabase()
        .prepare("UPDATE ledger_entries SET amount = 1 WHERE facility_id = ?")
        .run("pcfac-000005"),
    ).toThrow(/ledger_entries_immutable/);
    expect(() =>
      openAuthDatabase()
        .prepare("DELETE FROM ledger_entries WHERE facility_id = ?")
        .run("pcfac-000005"),
    ).toThrow(/ledger_entries_immutable/);
  });
});

describe("queue dan detail", () => {
  it("antrean memuat fasilitas pasca-peninjauan dengan aksi yang benar", async () => {
    asOfficer("officer-a");
    const queue = await listPencairanQueue();
    const ids = queue.active.map((item) => item.facilityId);
    expect(ids).toContain("pcfac-000001");
    expect(ids).toContain("pcfac-000003");
    expect(queue.recent.map((item) => item.facilityId)).toContain(
      "pcfac-000005",
    );
  });

  it("detail membedakan izin pengaju dan penyetuju", async () => {
    asOfficer("officer-a");
    const asInitiator = await getPencairanDetail("pcfac-000003");
    expect(asInitiator?.permissions.initiate).toBe(true);
    asOfficer("officer-b");
    const asOther = await getPencairanDetail("pcfac-000003");
    expect(asOther?.permissions.initiate).toBe(true);
    expect(asOther?.permissions.decide).toBe(false);
  });
});
