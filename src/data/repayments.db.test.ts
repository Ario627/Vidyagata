import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { buildRepaymentSchedule } from "@/domain/financing/schedule";
import { rupiah } from "@/domain/money/money";
import { type PlainDate, parsePlainDate } from "@/domain/time/plain-date";
import { openAuthDatabase } from "@/lib/db/sqlite";
import { createActiveSchedule, getMyTagihan } from "./repayments";

const session = vi.hoisted(() => ({ userId: "rep-student-user-1" }));

vi.mock("@/lib/session", () => ({
  getCurrentUser: async () => ({ id: session.userId }),
}));

const directory = mkdtempSync(join(tmpdir(), "vidyagata-repayments-"));
process.env.VIDYAGATA_DB_FILE = join(directory, "repayments.db");

const STAMP = "2026-10-01T00:00:00.000Z";
const FIRST_DUE = "2026-11-14";
const PRINCIPAL = 1_200_000;
const TENOR = 12;
const MARGIN_BP = 1200;
const FEE_BP = 200;

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

function pilotLenderId(): string {
  const row = openAuthDatabase()
    .prepare("SELECT id FROM lenders ORDER BY created_at, id LIMIT 1")
    .get() as { id: string };
  return row.id;
}

function insertActiveFacility() {
  openAuthDatabase()
    .prepare(
      `INSERT INTO financing_facilities (
        id, public_ref, student_id, lender_id, institution_id, status, scheme_type,
        academic_purpose, requested_amount, approved_amount, tenor_months,
        annual_margin_rate_bp, service_fee_rate_bp, payroll_deduction_rate,
        submitted_at, approved_at, signed_at, disbursed_at, created_at, updated_at
      ) VALUES (
        'repfac-000001', 'VG-FIN-2026-000901', 'rep-student-1', ?, 'inst-rep-1',
        'active', 'vidyafund', 'tuition', ?, ?, ?, ?, ?, 20, ?, ?, ?, ?, ?, ?
      )`,
    )
    .run(
      pilotLenderId(),
      PRINCIPAL,
      PRINCIPAL,
      TENOR,
      MARGIN_BP,
      FEE_BP,
      STAMP,
      STAMP,
      STAMP,
      STAMP,
      STAMP,
      STAMP,
    );
}

function firstDuePlainDate(): PlainDate {
  const parsed = parsePlainDate(FIRST_DUE);
  if (!parsed.ok) throw new Error("tanggal uji tidak valid");
  return parsed.value;
}

beforeAll(() => {
  const database = openAuthDatabase();
  database
    .prepare(
      `INSERT INTO institutions (id, name, slug, type, city, province, verification_method, partnership_status, created_at, updated_at)
       VALUES ('inst-rep-1', 'Kampus Repayment', 'kampus-repayment', 'university', 'Depok', 'Jawa Barat', 'manual_document', 'active', ?, ?)`,
    )
    .run(STAMP, STAMP);
  insertUser("rep-student-user-1", "Mahasiswa Repayment");
  insertStudent("rep-student-1", "rep-student-user-1");
  insertActiveFacility();
  createActiveSchedule(openAuthDatabase(), {
    facilityId: "repfac-000001",
    principal: PRINCIPAL,
    tenorMonths: TENOR,
    annualMarginRateBp: MARGIN_BP,
    serviceFeeRateBp: FEE_BP,
    firstDueDate: firstDuePlainDate(),
  });
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("createActiveSchedule", () => {
  it("baris jadwal identik dengan hasil engine murni", () => {
    const built = buildRepaymentSchedule({
      principal: rupiah(PRINCIPAL),
      tenorMonths: TENOR,
      annualMarginRateBp: MARGIN_BP,
      serviceFeeRateBp: FEE_BP,
      firstDueDate: firstDuePlainDate(),
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const rows = openAuthDatabase()
      .prepare(
        "SELECT period_no, due_date, total_amount FROM installments ORDER BY period_no",
      )
      .all() as { period_no: number; due_date: string; total_amount: number }[];
    expect(rows).toHaveLength(TENOR);
    rows.forEach((row, index) => {
      const expected = built.value.rows[index];
      if (expected === undefined) throw new Error("baris engine hilang");
      expect(row.period_no).toBe(expected.index);
      expect(row.due_date).toBe(expected.dueDate);
      expect(row.total_amount).toBe(expected.total);
    });
  });

  it("menolak jadwal kedua untuk fasilitas yang sama", () => {
    expect(() =>
      createActiveSchedule(openAuthDatabase(), {
        facilityId: "repfac-000001",
        principal: PRINCIPAL,
        tenorMonths: TENOR,
        annualMarginRateBp: MARGIN_BP,
        serviceFeeRateBp: FEE_BP,
        firstDueDate: firstDuePlainDate(),
      }),
    ).toThrow(/UNIQUE/i);
  });

  it("menolak parameter yang tidak valid lewat engine", () => {
    openAuthDatabase()
      .prepare(
        `INSERT INTO financing_facilities (id, public_ref, student_id, status, scheme_type, academic_purpose, requested_amount, created_at, updated_at)
         VALUES ('repfac-000002', 'VG-FIN-2026-000902', 'rep-student-1', 'draft', 'vidyafund', 'tuition', 100, ?, ?)`,
      )
      .run(STAMP, STAMP);
    expect(() =>
      createActiveSchedule(openAuthDatabase(), {
        facilityId: "repfac-000002",
        principal: 0,
        tenorMonths: TENOR,
        annualMarginRateBp: MARGIN_BP,
        serviceFeeRateBp: FEE_BP,
        firstDueDate: firstDuePlainDate(),
      }),
    ).toThrow(/schedule_invalid:principal_not_positive/);
  });
});

describe("getMyTagihan", () => {
  it("meringkas tagihan dari jadwal yang tersimpan", async () => {
    session.userId = "rep-student-user-1";
    const tagihan = await getMyTagihan();
    expect(tagihan).not.toBeNull();
    if (tagihan === null) return;
    expect(tagihan.facilityPublicRef).toBe("VG-FIN-2026-000901");
    expect(tagihan.institutionName).toBe("Kampus Repayment");
    expect(tagihan.deductionRate).toBe(20);
    expect(tagihan.totalCount).toBe(TENOR);
    expect(tagihan.paidCount).toBe(0);
    expect(tagihan.overdueCount).toBe(0);
    expect(tagihan.outstandingTotal).toBe(tagihan.totalRepayment);
    expect(tagihan.nextDue?.periodNo).toBe(1);
    expect(tagihan.nextDue?.dueDate).toBe(FIRST_DUE);
  });

  it("menandai cicilan lewat jatuh tempo secara turunan", async () => {
    openAuthDatabase()
      .prepare(
        "UPDATE installments SET due_date = '2020-01-01' WHERE period_no = 1",
      )
      .run();
    const tagihan = await getMyTagihan();
    expect(tagihan?.overdueCount).toBe(1);
    expect(tagihan?.nextDue?.status).toBe("overdue");
  });

  it("mengecualikan cicilan lunas dan dibebaskan dari sisa tagihan", async () => {
    const database = openAuthDatabase();
    const before = await getMyTagihan();
    const first = before?.installments[0];
    const second = before?.installments[1];
    if (before === null || first === undefined || second === undefined) {
      throw new Error("data uji tidak lengkap");
    }
    database
      .prepare(
        "UPDATE installments SET status = 'paid', paid_at = ? WHERE period_no = 1",
      )
      .run(STAMP);
    database
      .prepare("UPDATE installments SET status = 'waived' WHERE period_no = 2")
      .run();
    const tagihan = await getMyTagihan();
    expect(tagihan).not.toBeNull();
    if (tagihan === null) return;
    expect(tagihan.paidCount).toBe(1);
    expect(tagihan.overdueCount).toBe(0);
    expect(tagihan.outstandingTotal).toBe(
      tagihan.totalRepayment - first.total - second.total,
    );
    expect(tagihan.nextDue?.periodNo).toBe(3);
  });

  it("mengembalikan null untuk pengguna yang tidak punya jadwal", async () => {
    session.userId = "rep-student-user-ghost";
    const tagihan = await getMyTagihan();
    expect(tagihan).toBeNull();
  });
});