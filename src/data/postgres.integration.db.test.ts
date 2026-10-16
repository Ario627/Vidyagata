import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ userId: "user-1" }));

vi.mock("@/lib/session", () => ({
  getCurrentUser: async () => ({ id: session.userId }),
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

const PG_URL = process.env.PG_TEST_URL;

if (PG_URL !== undefined) {
  const env = process.env as Record<string, string | undefined>;
  delete env.VITEST;
  env.NODE_ENV = "development";
  env.DATABASE_URL = PG_URL;
  env.OTP_PEPPER ??= "x".repeat(48);
}

const describePg = PG_URL === undefined ? describe.skip : describe;

type Db = {
  prepare(sql: string): {
    get<T>(...params: unknown[]): Promise<T | undefined>;
    all<T>(...params: unknown[]): Promise<T[]>;
    run(...params: unknown[]): Promise<{ changes: number }>;
  };
  execute(sql: string): Promise<void>;
};

let db: Db;

beforeAll(async () => {
  const client = await import("@/lib/db/client");
  db = (await client.getDb()) as unknown as Db;
}, 60_000);

afterAll(() => {
  void db;
});

describePg("Postgres: seed + parameter regulasi", () => {
  it("menyemai parameter, konsen, kampus, lender, dan lowongan", async () => {
    const counts = await Promise.all([
      db
        .prepare("SELECT COUNT(*) AS n FROM regulatory_parameters")
        .get<{ n: number }>(),
      db.prepare("SELECT COUNT(*) AS n FROM consents").get<{ n: number }>(),
      db.prepare("SELECT COUNT(*) AS n FROM institutions").get<{ n: number }>(),
      db.prepare("SELECT COUNT(*) AS n FROM lenders").get<{ n: number }>(),
      db.prepare("SELECT COUNT(*) AS n FROM employers").get<{ n: number }>(),
      db.prepare("SELECT COUNT(*) AS n FROM job_postings").get<{ n: number }>(),
    ]);
    expect(counts.map((row) => row?.n)).toEqual([11, 2, 6, 1, 4, 6]);
  });

  it("menyimpan jsonb tanpa encoding ganda dan membacanya sebagai teks JSON", async () => {
    const shapes = await db
      .prepare(
        "SELECT DISTINCT jsonb_typeof(value_json) AS tipe FROM regulatory_parameters",
      )
      .all<{ tipe: string }>();
    expect(shapes.map((row) => row.tipe).sort()).toEqual(["array", "number"]);
    const { resolveActiveParameters } = await import("@/data/regulatory");
    const resolved = await resolveActiveParameters("2026-10-15");
    if (!resolved.ok) throw new Error(JSON.stringify(resolved.error));
    expect(resolved.value.max_tenor_months).toBeGreaterThan(1);
    expect(Array.isArray(resolved.value.repayment_reminder_days)).toBe(true);
  });

  it("getPilotLenderTerms membaca risk_appetite_json", async () => {
    const { getPilotLenderTerms } = await import("@/data/lenders");
    const terms = await getPilotLenderTerms();
    expect(terms?.marginRateBp).toBe(1200);
    expect(terms?.serviceFeeRateBp).toBe(200);
  });
});

describePg("Postgres: better-auth", () => {
  const email = `pg-uji-${Date.now()}@example.com`;

  it("mendaftarkan akun dan menyimpan boolean/timestamp dengan benar", async () => {
    const { auth } = await import("@/lib/auth");
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password: "RahasiaPg2026",
        username: `pg_uji_${Date.now() % 100000}`,
        name: "Pg Uji",
        birthdate: "2000-01-01",
      },
    });
    expect(result.user.id).toBeTruthy();
    session.userId = result.user.id;
    const row = await db
      .prepare(
        'SELECT "emailVerified", "twoFactorEnabled", birthdate, username, "createdAt" FROM "user" WHERE id = ?',
      )
      .get<{
        emailVerified: number;
        twoFactorEnabled: number;
        birthdate: string;
        username: string;
        createdAt: string;
      }>(result.user.id);
    expect(row?.emailVerified).toBe(1);
    expect(row?.twoFactorEnabled).toBe(0);
    expect(String(row?.birthdate)).toContain("2000-01-01");
    expect(typeof row?.createdAt).toBe("string");
    await db
      .prepare(
        'INSERT INTO "rateLimit" (id, key, count, "lastRequest") VALUES (?, ?, ?, ?)',
      )
      .run("rl-uji", "sign-in|ip", 3, 1_760_000_000_000);
    const rate = await db
      .prepare('SELECT count, "lastRequest" FROM "rateLimit" WHERE id = ?')
      .get<{ count: number; lastRequest: number }>("rl-uji");
    expect(rate?.count).toBe(3);
    expect(rate?.lastRequest).toBeGreaterThan(1_700_000_000_000);
  });

  it("login mengembalikan sesi", async () => {
    const { auth } = await import("@/lib/auth");
    const result = await auth.api.signInEmail({
      body: { email, password: "RahasiaPg2026" },
    });
    expect(result.user.email).toBe(email);
  });

  it("guard kode TOTP tersimpan di kolom user", async () => {
    const { markTotpCodeUsed, wasTotpCodeUsed } = await import(
      "@/data/mfa-code-guard"
    );
    expect(await wasTotpCodeUsed(session.userId, "111111")).toBe(false);
    await markTotpCodeUsed(session.userId, "111111");
    expect(await wasTotpCodeUsed(session.userId, "111111")).toBe(true);
  });
});

describePg("Postgres: age ban", () => {
  it("menulis dan membaca larangan usia (kolom date)", async () => {
    const { recordAgeBan, findActiveAgeBan } = await import("@/lib/age-ban");
    const eligibleAt = await recordAgeBan({
      fingerprint: "fp-uji",
      now: new Date("2026-10-15T03:00:00.000Z"),
    });
    expect(eligibleAt).not.toBeNull();
    if (eligibleAt === null) return;
    const record = await findActiveAgeBan({
      fingerprint: "fp-uji",
      today: "2026-10-15",
    });
    expect(record?.eligibleAt).toBe(eligibleAt);
  });
});

describePg("Postgres: alur pembiayaan", () => {
  it("profil, draft, konsen, dan submit berjalan", async () => {
    const institution = await db
      .prepare("SELECT id FROM institutions ORDER BY name LIMIT 1")
      .get<{ id: string }>();
    if (institution === undefined) throw new Error("institusi seed kosong");
    const { saveStudentProfile, getMyStudentProfile } = await import(
      "@/data/students"
    );
    const { recordConsent } = await import("@/data/consents");
    const {
      saveMyDraft,
      submitMyFacility,
      getMyFacilityTimeline,
      listMyFacilities,
    } = await import("@/data/financing");
    expect(await getMyStudentProfile()).toBeNull();
    const saved = await saveStudentProfile({
      fullName: "Pg Uji",
      nickname: "Pg",
      dateOfBirth: "2000-01-01" as never,
      academicStatus: "undergraduate",
      currentSemester: 4,
      gpaHundredths: 350,
      institutionId: institution.id,
      province: "DKI Jakarta",
      city: "Jakarta",
    });
    expect(saved.gpaHundredths).toBe(350);
    const draft = await saveMyDraft({ institutionId: institution.id });
    expect(draft.publicRef.startsWith("VG-FIN-")).toBe(true);
    const filled = await saveMyDraft({
      requestedAmount: 5_000_000 as never,
      academicPurpose: "tuition",
      purposeNote:
        "Dana dipakai untuk melunasi UKT sesuai tagihan kampus yang dilampirkan.",
    });
    expect(filled.id).toBe(draft.id);
    await expect(submitMyFacility(filled.id)).rejects.toThrow("proof_required");
    const { saveStudentDocument } = await import("@/data/documents");
    const proof = await saveStudentDocument({
      kind: "purpose_proof",
      bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]),
    });
    expect(proof.ok).toBe(true);
    await expect(submitMyFacility(filled.id)).rejects.toThrow(
      "consent_required",
    );
    await recordConsent({ key: "data_processing", grantedVia: "checkbox" });
    const submitted = await submitMyFacility(filled.id);
    expect(submitted.status).toBe("submitted");
    const timeline = await getMyFacilityTimeline(submitted.id);
    expect(
      timeline?.transitions.some((entry) => entry.status === "submitted"),
    ).toBe(true);
    const second = await saveMyDraft({ institutionId: institution.id });
    const secondFilled = await saveMyDraft({
      requestedAmount: 3_000_000 as never,
      academicPurpose: "living_cost",
    });
    expect(secondFilled.id).toBe(second.id);
    await expect(submitMyFacility(secondFilled.id)).rejects.toThrow(
      "active_facility_exists",
    );
    expect(await listMyFacilities()).toHaveLength(2);
  }, 30_000);
});
