import { createHash } from "node:crypto";
import { buildRepaymentSchedule } from "@/domain/financing/schedule";
import {
  buildStatementCanonical,
  STATEMENT_VERSION,
} from "@/domain/legal/statement";
import { rupiah } from "@/domain/money/money";
import { parsePlainDate } from "@/domain/time/plain-date";
import type { Db } from "@/lib/db/client";
import { hashPasswordSecurely } from "@/lib/password";

const DEFAULT_DEMO_PASSWORD = "VidyaDemo2026";
const ID_PREFIX = "01JDEM0";
const PAID_PERIODS = 6;
const PILOT_LENDER_NAME = "Mitra Pembiayaan Pilot";

let productionWarned = false;

type DemoPerson = {
  readonly index: number;
  readonly idKind: "STF" | "STD";
  readonly name: string;
  readonly email: string;
  readonly username: string;
  readonly birthdate: string;
  readonly createdAt: string;
};

type DemoStudent = DemoPerson & {
  readonly idKind: "STD";
  readonly institutionSlug: string;
  readonly semester: number;
  readonly gpaHundredths: number;
  readonly province: string;
  readonly city: string;
  readonly addressLine: string;
  readonly hobby: string;
  readonly bio: string;
};

type DemoTransition = {
  readonly from: string;
  readonly to: string;
  readonly at: string;
  readonly actor: "student" | "operator";
};

type DemoFacilityStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "forwarded_to_lender"
  | "active";

type DemoFacility = {
  readonly index: number;
  readonly studentIndex: number;
  readonly publicRef: string;
  readonly status: DemoFacilityStatus;
  readonly requestedAmount: number;
  readonly approvedAmount: number | null;
  readonly tenorMonths: number | null;
  readonly annualMarginRateBp: number | null;
  readonly serviceFeeRateBp: number | null;
  readonly deductionRate: number | null;
  readonly firstDueDate: string | null;
  readonly claimedBy: number | null;
  readonly createdAt: string;
  readonly transitions: readonly DemoTransition[];
};

const OPERATORS: readonly DemoPerson[] = [
  {
    index: 1,
    idKind: "STF",
    name: "Raka Pratama",
    email: "raka.operator@demo.vidyagata.id",
    username: "raka_operator",
    birthdate: "1994-03-12",
    createdAt: "2026-09-01T01:00:00.000Z",
  },
  {
    index: 2,
    idKind: "STF",
    name: "Sinta Maharani",
    email: "sinta.operator@demo.vidyagata.id",
    username: "sinta_operator",
    birthdate: "1992-08-25",
    createdAt: "2026-09-01T01:05:00.000Z",
  },
  {
    index: 3,
    idKind: "STF",
    name: "Bagus Nugroho",
    email: "bagus.operator@demo.vidyagata.id",
    username: "bagus_operator",
    birthdate: "1995-11-02",
    createdAt: "2026-09-01T01:10:00.000Z",
  },
];

const STUDENTS: readonly DemoStudent[] = [
  {
    index: 4,
    idKind: "STD",
    name: "Nadia Prameswari",
    email: "nadia@demo.vidyagata.id",
    username: "nadia_prameswari",
    birthdate: "2003-01-18",
    createdAt: "2026-04-18T23:30:00.000Z",
    institutionSlug: "universitas-indonesia",
    semester: 5,
    gpaHundredths: 362,
    province: "Jawa Barat",
    city: "Depok",
    addressLine: "Jl. Margonda Raya No. 118",
    hobby: "Fotografi dan kopi manual",
    bio: "Mahasiswa semester 5 yang aktif di komunitas fotografi kampus dan sedang belajar mengelola bisnis kecil.",
  },
  {
    index: 5,
    idKind: "STD",
    name: "Dimas Aditya",
    email: "dimas@demo.vidyagata.id",
    username: "dimas_aditya",
    birthdate: "2003-06-30",
    createdAt: "2026-10-11T22:45:00.000Z",
    institutionSlug: "institut-teknologi-bandung",
    semester: 3,
    gpaHundredths: 328,
    province: "Jawa Barat",
    city: "Bandung",
    addressLine: "Jl. Ganesa No. 10",
    hobby: "Futsal dan elektronika",
    bio: "Mahasiswa teknik yang suka merakit perangkat dan aktif membantu UKM kampus mengurus konten.",
  },
  {
    index: 6,
    idKind: "STD",
    name: "Rani Kusuma",
    email: "rani@demo.vidyagata.id",
    username: "rani_kusuma",
    birthdate: "2002-09-14",
    createdAt: "2026-10-09T20:15:00.000Z",
    institutionSlug: "universitas-gadjah-mada",
    semester: 7,
    gpaHundredths: 374,
    province: "DI Yogyakarta",
    city: "Yogyakarta",
    addressLine: "Jl. Kaliurang KM 5 No. 21",
    hobby: "Menulis puisi dan lari pagi",
    bio: "Mahasiswa tingkat akhir yang mempersiapkan skripsi dan mencari pengalaman kerja sambil kuliah.",
  },
  {
    index: 7,
    idKind: "STD",
    name: "Fajar Ramadhan",
    email: "fajar@demo.vidyagata.id",
    username: "fajar_ramadhan",
    birthdate: "2003-04-22",
    createdAt: "2026-10-04T21:05:00.000Z",
    institutionSlug: "universitas-airlangga",
    semester: 5,
    gpaHundredths: 305,
    province: "Jawa Timur",
    city: "Surabaya",
    addressLine: "Jl. Airlangga No. 4-6",
    hobby: "Basket dan videografi",
    bio: "Mahasiswa semester 5 yang senang membuat video pendek dan ingin mandiri secara finansial.",
  },
  {
    index: 8,
    idKind: "STD",
    name: "Aulia Safitri",
    email: "aulia@demo.vidyagata.id",
    username: "aulia_safitri",
    birthdate: "2004-05-09",
    createdAt: "2026-10-13T02:20:00.000Z",
    institutionSlug: "universitas-padjadjaran",
    semester: 2,
    gpaHundredths: 390,
    province: "Jawa Barat",
    city: "Bandung",
    addressLine: "Jl. Dipati Ukur No. 35",
    hobby: "Melukis digital dan badminton",
    bio: "Mahasiswa semester 2 yang sedang merintis usaha kecil ilustrasi dan rajin mengikuti lomba desain.",
  },
  {
    index: 9,
    idKind: "STD",
    name: "Bima Prasetyo",
    email: "bima@demo.vidyagata.id",
    username: "bima_prasetyo",
    birthdate: "2003-12-01",
    createdAt: "2026-10-10T23:50:00.000Z",
    institutionSlug: "institut-teknologi-sepuluh-nopember",
    semester: 4,
    gpaHundredths: 341,
    province: "Jawa Timur",
    city: "Surabaya",
    addressLine: "Keputih Tegal Timur No. 8",
    hobby: "Renang dan analisis data",
    bio: "Mahasiswa semester 4 yang aktif di himpunan dan tertarik pada analisis data olahraga.",
  },
];

const FACILITIES: readonly DemoFacility[] = [
  {
    index: 1,
    studentIndex: 4,
    publicRef: "VG-FIN-2026-900101",
    status: "active",
    requestedAmount: 8_000_000,
    approvedAmount: 8_000_000,
    tenorMonths: 12,
    annualMarginRateBp: 1200,
    serviceFeeRateBp: 200,
    deductionRate: 20,
    firstDueDate: "2026-05-10",
    claimedBy: 1,
    createdAt: "2026-04-20T02:10:00.000Z",
    transitions: [
      {
        from: "draft",
        to: "submitted",
        at: "2026-04-20T02:10:00.000Z",
        actor: "student",
      },
      {
        from: "submitted",
        to: "under_review",
        at: "2026-04-22T03:00:00.000Z",
        actor: "operator",
      },
      {
        from: "under_review",
        to: "forwarded_to_lender",
        at: "2026-04-24T04:30:00.000Z",
        actor: "operator",
      },
      {
        from: "forwarded_to_lender",
        to: "approved",
        at: "2026-04-28T02:00:00.000Z",
        actor: "operator",
      },
      {
        from: "approved",
        to: "signed",
        at: "2026-05-02T05:15:00.000Z",
        actor: "operator",
      },
      {
        from: "signed",
        to: "disbursed",
        at: "2026-05-05T01:45:00.000Z",
        actor: "operator",
      },
    ],
  },
  {
    index: 2,
    studentIndex: 5,
    publicRef: "VG-FIN-2026-900102",
    status: "submitted",
    requestedAmount: 6_000_000,
    approvedAmount: null,
    tenorMonths: null,
    annualMarginRateBp: null,
    serviceFeeRateBp: null,
    deductionRate: null,
    firstDueDate: null,
    claimedBy: null,
    createdAt: "2026-10-12T01:20:00.000Z",
    transitions: [
      {
        from: "draft",
        to: "submitted",
        at: "2026-10-12T01:20:00.000Z",
        actor: "student",
      },
    ],
  },
  {
    index: 3,
    studentIndex: 6,
    publicRef: "VG-FIN-2026-900103",
    status: "under_review",
    requestedAmount: 5_000_000,
    approvedAmount: null,
    tenorMonths: null,
    annualMarginRateBp: null,
    serviceFeeRateBp: null,
    deductionRate: null,
    firstDueDate: null,
    claimedBy: 1,
    createdAt: "2026-10-10T00:50:00.000Z",
    transitions: [
      {
        from: "draft",
        to: "submitted",
        at: "2026-10-10T00:50:00.000Z",
        actor: "student",
      },
      {
        from: "submitted",
        to: "under_review",
        at: "2026-10-12T02:40:00.000Z",
        actor: "operator",
      },
    ],
  },
  {
    index: 4,
    studentIndex: 7,
    publicRef: "VG-FIN-2026-900104",
    status: "forwarded_to_lender",
    requestedAmount: 4_000_000,
    approvedAmount: null,
    tenorMonths: null,
    annualMarginRateBp: null,
    serviceFeeRateBp: null,
    deductionRate: null,
    firstDueDate: null,
    claimedBy: 1,
    createdAt: "2026-10-05T02:05:00.000Z",
    transitions: [
      {
        from: "draft",
        to: "submitted",
        at: "2026-10-05T02:05:00.000Z",
        actor: "student",
      },
      {
        from: "submitted",
        to: "under_review",
        at: "2026-10-07T01:30:00.000Z",
        actor: "operator",
      },
      {
        from: "under_review",
        to: "forwarded_to_lender",
        at: "2026-10-09T03:10:00.000Z",
        actor: "operator",
      },
    ],
  },
  {
    index: 5,
    studentIndex: 8,
    publicRef: "VG-FIN-2026-900105",
    status: "draft",
    requestedAmount: 3_000_000,
    approvedAmount: null,
    tenorMonths: null,
    annualMarginRateBp: null,
    serviceFeeRateBp: null,
    deductionRate: null,
    firstDueDate: null,
    claimedBy: null,
    createdAt: "2026-10-13T02:25:00.000Z",
    transitions: [],
  },
];

const SELECT_USER_BY_EMAIL = `SELECT id FROM "user" WHERE email = ?`;

const SELECT_INSTITUTION_BY_SLUG = `SELECT id FROM institutions WHERE slug = ?`;

const SELECT_ANY_INSTITUTION = `SELECT id FROM institutions
ORDER BY created_at, id LIMIT 1`;

const SELECT_PILOT_LENDER = `SELECT id FROM lenders WHERE name = ? LIMIT 1`;

const SELECT_ANY_LENDER = `SELECT id FROM lenders ORDER BY created_at, id LIMIT 1`;

const SELECT_ACTIVE_POSTINGS = `SELECT id FROM job_postings
WHERE status = 'active'
ORDER BY published_at DESC, id DESC
LIMIT 2`;

const INSERT_USER = `INSERT INTO "user" (
  id, name, email, "emailVerified", "createdAt", "updatedAt",
  username, "displayUsername", birthdate
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT DO NOTHING`;

const INSERT_ACCOUNT = `INSERT INTO account (
  id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
) VALUES (?, ?, 'credential', ?, ?, ?, ?)
ON CONFLICT DO NOTHING`;

const INSERT_ROLE = `INSERT INTO user_roles (
  id, user_id, role, granted_by_user_id, granted_at, revoked_at, reason
) VALUES (?, ?, 'operator', NULL, ?, NULL, ?)
ON CONFLICT DO NOTHING`;

const INSERT_STUDENT = `INSERT INTO students (
  id, user_id, full_name, nickname, date_of_birth, academic_status,
  current_semester, gpa_hundredths, institution_id, province, city,
  address_line, hobby, bio, created_at, updated_at
) VALUES (?, ?, ?, NULL, ?, 'undergraduate', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT DO NOTHING`;

const INSERT_FACILITY = `INSERT INTO financing_facilities (
  id, public_ref, student_id, lender_id, institution_id, status, scheme_type,
  academic_purpose, requested_amount, approved_amount, currency, tenor_months,
  annual_margin_rate_bp, service_fee_rate_bp, payroll_deduction_rate,
  submitted_at, approved_at, signed_at, disbursed_at, closed_at,
  created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, 'vidyafund', 'tuition', ?, ?, 'IDR', ?, ?, ?, ?,
  ?, ?, ?, ?, NULL, ?, ?)
ON CONFLICT DO NOTHING`;

const INSERT_PORTFOLIO = `INSERT INTO officer_portfolios (
  id, officer_id, facility_id, assigned_at, created_at
) VALUES (?, ?, ?, ?, ?)
ON CONFLICT DO NOTHING`;

const INSERT_SCHEDULE = `INSERT INTO repayment_schedules (
  id, facility_id, schedule_version, tenor_months, first_due_date,
  status, activated_at, created_at, updated_at
) VALUES (?, ?, 1, ?, ?, 'active', ?, ?, ?)
ON CONFLICT DO NOTHING`;

const INSERT_INSTALLMENT = `INSERT INTO installments (
  id, schedule_id, facility_id, period_no, due_date, principal_amount,
  margin_amount, fee_amount, total_amount, currency, status, paid_at,
  created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'IDR', 'due', NULL, ?, ?)
ON CONFLICT DO NOTHING`;

const MARK_PERIODS_PAID = `UPDATE installments
SET status = 'paid', paid_at = due_date
WHERE facility_id = ? AND period_no <= ?`;

const INSERT_APPLICATION = `INSERT INTO job_applications (
  id, student_id, job_posting_id, status, note, submitted_at, decided_at,
  created_at, updated_at
) VALUES (?, ?, ?, ?, NULL, ?, NULL, ?, ?)
ON CONFLICT DO NOTHING`;

const INSERT_SIGNATURE = `INSERT INTO student_statement_signatures (
  id, student_id, statement_version, statement_hash, signed_name,
  ip_address, user_agent, signed_at, created_at
) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?)
ON CONFLICT (student_id, statement_version) DO NOTHING`;

const INSERT_AUDIT = `INSERT INTO audit_logs (
  id, actor_type, actor_id, action, entity_type, entity_id,
  before_json, after_json, reason, ip_address, user_agent, occurred_at
) VALUES (?, ?, ?, 'financing.status_changed', 'financing_facility', ?, ?, ?, ?,
  NULL, NULL, ?)
ON CONFLICT DO NOTHING`;

function demoId(kind: string, index: number): string {
  const digits = String(index).padStart(
    26 - ID_PREFIX.length - kind.length,
    "0",
  );
  return `${ID_PREFIX}${kind}${digits}`;
}

export function demoSeedEnabled(): boolean {
  if (process.env.VITEST !== undefined || process.env.NODE_ENV === "test") {
    return false;
  }
  const flag = process.env.SEED_DEMO?.trim().toLowerCase();
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  return process.env.NODE_ENV !== "production";
}

function demoPassword(): string {
  const fromEnv = process.env.SEED_DEMO_PASSWORD?.trim();
  return fromEnv === undefined || fromEnv.length === 0
    ? DEFAULT_DEMO_PASSWORD
    : fromEnv;
}

function transitionAt(facility: DemoFacility, status: string): string | null {
  const hit = facility.transitions.find((item) => item.to === status);
  return hit?.at ?? null;
}

function studentOf(index: number): DemoStudent {
  const student = STUDENTS.find((item) => item.index === index);
  if (student === undefined) throw new Error(`demo_student_missing:${index}`);
  return student;
}

type DemoUserHandle = {
  readonly id: string;
  readonly created: boolean;
};

async function ensureDemoUser(
  database: Db,
  person: DemoPerson,
): Promise<DemoUserHandle> {
  const existing = (await database
    .prepare(SELECT_USER_BY_EMAIL)
    .get(person.email)) as { id: string } | undefined;
  if (existing !== undefined) return { id: existing.id, created: false };
  const userId = demoId(person.idKind, person.index);
  const passwordHash = await hashPasswordSecurely(demoPassword());
  await database
    .prepare(INSERT_USER)
    .run(
      userId,
      person.name,
      person.email,
      true,
      person.createdAt,
      person.createdAt,
      person.username,
      person.username,
      person.birthdate,
    );
  await database
    .prepare(INSERT_ACCOUNT)
    .run(
      demoId("ACC", person.index),
      userId,
      userId,
      passwordHash,
      person.createdAt,
      person.createdAt,
    );
  return { id: userId, created: true };
}

async function institutionIdFor(
  database: Db,
  slug: string,
): Promise<string | null> {
  const row = (await database.prepare(SELECT_INSTITUTION_BY_SLUG).get(slug)) as
    | { id: string }
    | undefined;
  if (row !== undefined) return row.id;
  const fallback = (await database.prepare(SELECT_ANY_INSTITUTION).get()) as
    | { id: string }
    | undefined;
  return fallback?.id ?? null;
}

async function pilotLenderId(database: Db): Promise<string | null> {
  const row = (await database
    .prepare(SELECT_PILOT_LENDER)
    .get(PILOT_LENDER_NAME)) as { id: string } | undefined;
  if (row !== undefined) return row.id;
  const fallback = (await database.prepare(SELECT_ANY_LENDER).get()) as
    | { id: string }
    | undefined;
  return fallback?.id ?? null;
}

async function ensureSchedule(
  database: Db,
  facility: DemoFacility,
  facilityId: string,
): Promise<void> {
  if (
    facility.status !== "active" ||
    facility.approvedAmount === null ||
    facility.tenorMonths === null ||
    facility.annualMarginRateBp === null ||
    facility.serviceFeeRateBp === null ||
    facility.firstDueDate === null
  ) {
    return;
  }
  const parsedDue = parsePlainDate(facility.firstDueDate);
  if (!parsedDue.ok) throw new Error("demo_first_due_invalid");
  const built = buildRepaymentSchedule({
    principal: rupiah(facility.approvedAmount),
    tenorMonths: facility.tenorMonths,
    annualMarginRateBp: facility.annualMarginRateBp,
    serviceFeeRateBp: facility.serviceFeeRateBp,
    firstDueDate: parsedDue.value,
  });
  if (!built.ok) throw new Error(`demo_schedule_invalid:${built.error}`);
  const disbursedAt = transitionAt(facility, "disbursed") ?? facility.createdAt;
  const scheduleId = demoId("SKD", facility.index);
  await database
    .prepare(INSERT_SCHEDULE)
    .run(
      scheduleId,
      facilityId,
      facility.tenorMonths,
      facility.firstDueDate,
      disbursedAt,
      disbursedAt,
      disbursedAt,
    );
  for (const row of built.value.rows) {
    await database
      .prepare(INSERT_INSTALLMENT)
      .run(
        demoId("ANG", facility.index * 100 + row.index),
        scheduleId,
        facilityId,
        row.index,
        row.dueDate,
        row.principal,
        row.margin,
        row.serviceFee,
        row.total,
        disbursedAt,
        disbursedAt,
      );
  }
  await database.prepare(MARK_PERIODS_PAID).run(facilityId, PAID_PERIODS);
}

async function insertAudit(
  database: Db,
  input: {
    readonly index: number;
    readonly facilityId: string;
    readonly actorType: "user" | "operator";
    readonly actorId: string;
    readonly from: string;
    readonly to: string;
    readonly at: string;
  },
): Promise<void> {
  await database
    .prepare(INSERT_AUDIT)
    .run(
      demoId("ADT", input.index),
      input.actorType,
      input.actorId,
      input.facilityId,
      JSON.stringify({ status: input.from }),
      JSON.stringify({ status: input.to }),
      "Perubahan status data demo",
      input.at,
    );
}

async function insertSignature(
  database: Db,
  student: DemoStudent,
  studentId: string,
  institutionName: string,
  signedAt: string,
): Promise<void> {
  const canonical = buildStatementCanonical({
    fullName: student.name,
    institutionName,
    academicStatus: "undergraduate",
    currentSemester: student.semester,
    city: student.city,
    deductionRate: null,
  });
  const hash = createHash("sha256").update(canonical).digest("hex");
  await database
    .prepare(INSERT_SIGNATURE)
    .run(
      demoId("SPR", student.index),
      studentId,
      STATEMENT_VERSION,
      hash,
      student.name,
      signedAt,
      signedAt,
    );
}

async function insertApplications(
  database: Db,
  studentId: string,
): Promise<void> {
  const postings = (await database.prepare(SELECT_ACTIVE_POSTINGS).all()) as {
    id: string;
  }[];
  const first = postings[0];
  const second = postings[1];
  if (first !== undefined) {
    await database
      .prepare(INSERT_APPLICATION)
      .run(
        demoId("APP", 1),
        studentId,
        first.id,
        "submitted",
        "2026-10-12T02:15:00.000Z",
        "2026-10-12T02:15:00.000Z",
        "2026-10-12T02:15:00.000Z",
      );
  }
  if (second !== undefined) {
    await database
      .prepare(INSERT_APPLICATION)
      .run(
        demoId("APP", 2),
        studentId,
        second.id,
        "shortlisted",
        "2026-10-08T01:40:00.000Z",
        "2026-10-08T01:40:00.000Z",
        "2026-10-10T03:00:00.000Z",
      );
  }
}

export async function applyDemoSeeds(database: Db): Promise<void> {
  if (!demoSeedEnabled()) return;
  try {
    const userIds = new Map<number, string>();
    let createdAccounts = 0;
    for (const person of [...OPERATORS, ...STUDENTS]) {
      const handle = await ensureDemoUser(database, person);
      if (handle.created) createdAccounts += 1;
      userIds.set(person.index, handle.id);
    }
    for (const operator of OPERATORS) {
      const operatorId = userIds.get(operator.index);
      if (operatorId === undefined) continue;
      await database
        .prepare(INSERT_ROLE)
        .run(
          demoId("PRN", operator.index),
          operatorId,
          operator.createdAt,
          "Operator demo",
        );
    }
    const studentIds = new Map<number, string>();
    for (const student of STUDENTS) {
      const userId = userIds.get(student.index);
      if (userId === undefined) continue;
      const institutionId = await institutionIdFor(
        database,
        student.institutionSlug,
      );
      const studentId = demoId("STD", student.index);
      studentIds.set(student.index, studentId);
      await database
        .prepare(INSERT_STUDENT)
        .run(
          studentId,
          userId,
          student.name,
          student.birthdate,
          student.semester,
          student.gpaHundredths,
          institutionId,
          student.province,
          student.city,
          student.addressLine,
          student.hobby,
          student.bio,
          student.createdAt,
          student.createdAt,
        );
    }
    const lenderId = await pilotLenderId(database);
    let auditIndex = 0;
    for (const facility of FACILITIES) {
      const student = studentOf(facility.studentIndex);
      const studentId = studentIds.get(facility.studentIndex);
      if (studentId === undefined) continue;
      const institutionId = await institutionIdFor(
        database,
        student.institutionSlug,
      );
      const facilityId = demoId("FAS", facility.index);
      await database
        .prepare(INSERT_FACILITY)
        .run(
          facilityId,
          facility.publicRef,
          studentId,
          facility.status === "forwarded_to_lender" ||
            facility.status === "active"
            ? lenderId
            : null,
          institutionId,
          facility.status,
          facility.requestedAmount,
          facility.approvedAmount,
          facility.tenorMonths,
          facility.annualMarginRateBp,
          facility.serviceFeeRateBp,
          facility.deductionRate,
          transitionAt(facility, "submitted"),
          transitionAt(facility, "approved"),
          transitionAt(facility, "signed"),
          transitionAt(facility, "disbursed"),
          facility.createdAt,
          transitionAt(facility, facility.status) ??
            transitionAt(facility, "disbursed") ??
            facility.createdAt,
        );
      await ensureSchedule(database, facility, facilityId);
      if (facility.claimedBy !== null) {
        const officerId = userIds.get(facility.claimedBy);
        const claimedAt = transitionAt(facility, "under_review");
        if (officerId !== undefined && claimedAt !== null) {
          await database
            .prepare(INSERT_PORTFOLIO)
            .run(
              demoId("PRT", facility.index),
              officerId,
              facilityId,
              claimedAt,
              claimedAt,
            );
        }
      }
      for (const transition of facility.transitions) {
        auditIndex += 1;
        const actorId =
          transition.actor === "student"
            ? (userIds.get(facility.studentIndex) ?? studentId)
            : userIds.get(facility.claimedBy ?? 1);
        if (actorId === undefined) continue;
        await insertAudit(database, {
          index: auditIndex,
          facilityId,
          actorType: transition.actor === "student" ? "user" : "operator",
          actorId,
          from: transition.from,
          to: transition.to,
          at: transition.at,
        });
      }
    }
    const rani = STUDENTS.find((item) => item.index === 6);
    const raniId = studentIds.get(6);
    if (rani !== undefined && raniId !== undefined) {
      await insertSignature(
        database,
        rani,
        raniId,
        "Universitas Gadjah Mada",
        "2026-10-09T21:00:00.000Z",
      );
    }
    const bimaId = studentIds.get(9);
    if (bimaId !== undefined) {
      await insertApplications(database, bimaId);
    }
    if (createdAccounts === 0) return;
    if (process.env.NODE_ENV === "production" && !productionWarned) {
      productionWarned = true;
      console.warn(
        "[seed] SEED_DEMO aktif di produksi — semua akun demo memakai satu kata sandi; matikan sebelum dipakai untuk data asli.",
      );
    }
    console.log(
      `[seed] data demo dibuat: ${createdAccounts} akun (${OPERATORS.length} operator, ${STUDENTS.length} mahasiswa), ${FACILITIES.length} pengajuan`,
    );
  } catch (error) {
    console.error("[seed] data demo gagal disiapkan:", error);
  }
}
