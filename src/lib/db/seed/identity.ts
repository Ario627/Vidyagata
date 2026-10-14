import type { Db } from "@/lib/db/client";
import { newId } from "@/lib/id";

type InstitutionSeed = {
  readonly name: string;
  readonly slug: string;
  readonly type:
    | "university"
    | "polytechnic"
    | "high_school"
    | "vocational_school";
  readonly city: string;
  readonly province: string;
};

type LenderSeed = {
  readonly name: string;
  readonly licenseType:
    | "bank"
    | "multifinance"
    | "fintech_lending"
    | "cooperative"
    | "other";
  readonly licenseNumber: string | null;
  readonly riskAppetite: unknown;
};

const INSTITUTION_SEEDS: readonly InstitutionSeed[] = [
  {
    name: "Universitas Indonesia",
    slug: "universitas-indonesia",
    type: "university",
    city: "Depok",
    province: "Jawa Barat",
  },
  {
    name: "Institut Teknologi Bandung",
    slug: "institut-teknologi-bandung",
    type: "university",
    city: "Bandung",
    province: "Jawa Barat",
  },
  {
    name: "Universitas Gadjah Mada",
    slug: "universitas-gadjah-mada",
    type: "university",
    city: "Yogyakarta",
    province: "DI Yogyakarta",
  },
  {
    name: "Universitas Airlangga",
    slug: "universitas-airlangga",
    type: "university",
    city: "Surabaya",
    province: "Jawa Timur",
  },
  {
    name: "Universitas Brawijaya",
    slug: "universitas-brawijaya",
    type: "university",
    city: "Malang",
    province: "Jawa Timur",
  },
  {
    name: "Universitas Diponegoro",
    slug: "universitas-diponegoro",
    type: "university",
    city: "Semarang",
    province: "Jawa Tengah",
  },
];

const LENDER_SEEDS: readonly LenderSeed[] = [
  {
    name: "Mitra Pembiayaan Pilot",
    licenseType: "other",
    licenseNumber: null,
    riskAppetite: {
      max_amount: 15_000_000,
      max_tenor_months: 60,
      margin_rate_bp: 1200,
      service_fee_rate_bp: 200,
    },
  },
];

const INSERT_INSTITUTION = `INSERT INTO institutions (
  id, name, slug, type, city, province, verification_method,
  partnership_status, bank_account_encrypted, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, 'manual_document', 'prospect', NULL, ?, ?)
ON CONFLICT(name) DO NOTHING`;

const INSERT_LENDER = `INSERT INTO lenders (
  id, name, license_type, license_number, status, risk_appetite_json,
  created_at, updated_at
) VALUES (?, ?, ?, ?, 'pilot', ?, ?, ?)
ON CONFLICT(name) DO NOTHING`;

const BACKFILL_LENDER_APPETITE = `UPDATE lenders
SET risk_appetite_json = ?
WHERE name = ? AND json_extract(risk_appetite_json, '$.margin_rate_bp') IS NULL`;

export async function applyIdentitySeeds(database: Db): Promise<void> {
  const createdAt = new Date().toISOString();
  for (const seed of INSTITUTION_SEEDS) {
    await database
      .prepare(INSERT_INSTITUTION)
      .run(
        newId(),
        seed.name,
        seed.slug,
        seed.type,
        seed.city,
        seed.province,
        createdAt,
        createdAt,
      );
  }
  for (const seed of LENDER_SEEDS) {
    await database
      .prepare(INSERT_LENDER)
      .run(
        newId(),
        seed.name,
        seed.licenseType,
        seed.licenseNumber,
        JSON.stringify(seed.riskAppetite),
        createdAt,
        createdAt,
      );
  }
  if ((await database.dialect()) === "sqlite") {
    for (const seed of LENDER_SEEDS) {
      await database
        .prepare(BACKFILL_LENDER_APPETITE)
        .run(JSON.stringify(seed.riskAppetite), seed.name);
    }
  }
}
