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
  {
    name: "Institut Teknologi Sepuluh Nopember",
    slug: "institut-teknologi-sepuluh-nopember",
    type: "university",
    city: "Surabaya",
    province: "Jawa Timur",
  },
  {
    name: "Universitas Padjadjaran",
    slug: "universitas-padjadjaran",
    type: "university",
    city: "Bandung",
    province: "Jawa Barat",
  },
  {
    name: "Universitas Bina Nusantara",
    slug: "universitas-bina-nusantara",
    type: "university",
    city: "Jakarta",
    province: "DKI Jakarta",
  },
  {
    name: "Universitas Pelita Harapan",
    slug: "universitas-pelita-harapan",
    type: "university",
    city: "Tangerang",
    province: "Banten",
  },
  {
    name: "Universitas Tarumanagara",
    slug: "universitas-tarumanagara",
    type: "university",
    city: "Jakarta",
    province: "DKI Jakarta",
  },
  {
    name: "Universitas Katolik Indonesia Atma Jaya",
    slug: "universitas-katolik-indonesia-atma-jaya",
    type: "university",
    city: "Jakarta",
    province: "DKI Jakarta",
  },
  {
    name: "Universitas Islam Indonesia",
    slug: "universitas-islam-indonesia",
    type: "university",
    city: "Yogyakarta",
    province: "DI Yogyakarta",
  },
  {
    name: "Universitas Islam Negeri Sunan Kalijaga",
    slug: "uin-sunan-kalijaga",
    type: "university",
    city: "Yogyakarta",
    province: "DI Yogyakarta",
  },
  {
    name: "Universitas Sebelas Maret",
    slug: "universitas-sebelas-maret",
    type: "university",
    city: "Surakarta",
    province: "Jawa Tengah",
  },
  {
    name: "Universitas Negeri Semarang",
    slug: "universitas-negeri-semarang",
    type: "university",
    city: "Semarang",
    province: "Jawa Tengah",
  },
  {
    name: "Universitas Negeri Malang",
    slug: "universitas-negeri-malang",
    type: "university",
    city: "Malang",
    province: "Jawa Timur",
  },
  {
    name: "Universitas Jember",
    slug: "universitas-jember",
    type: "university",
    city: "Jember",
    province: "Jawa Timur",
  },
  {
    name: "Universitas Udayana",
    slug: "universitas-udayana",
    type: "university",
    city: "Denpasar",
    province: "Bali",
  },
  {
    name: "Universitas Mataram",
    slug: "universitas-mataram",
    type: "university",
    city: "Mataram",
    province: "Nusa Tenggara Barat",
  },
  {
    name: "Universitas Hasanuddin",
    slug: "universitas-hasanuddin",
    type: "university",
    city: "Makassar",
    province: "Sulawesi Selatan",
  },
  {
    name: "Universitas Sam Ratulangi",
    slug: "universitas-sam-ratulangi",
    type: "university",
    city: "Manado",
    province: "Sulawesi Utara",
  },
  {
    name: "Universitas Sriwijaya",
    slug: "universitas-sriwijaya",
    type: "university",
    city: "Palembang",
    province: "Sumatera Selatan",
  },
  {
    name: "Universitas Lampung",
    slug: "universitas-lampung",
    type: "university",
    city: "Bandar Lampung",
    province: "Lampung",
  },
  {
    name: "Universitas Riau",
    slug: "universitas-riau",
    type: "university",
    city: "Pekanbaru",
    province: "Riau",
  },
  {
    name: "Universitas Sumatera Utara",
    slug: "universitas-sumatera-utara",
    type: "university",
    city: "Medan",
    province: "Sumatera Utara",
  },
  {
    name: "Universitas Syiah Kuala",
    slug: "universitas-syiah-kuala",
    type: "university",
    city: "Banda Aceh",
    province: "Aceh",
  },
  {
    name: "Universitas Andalas",
    slug: "universitas-andalas",
    type: "university",
    city: "Padang",
    province: "Sumatera Barat",
  },
  {
    name: "Universitas Tanjungpura",
    slug: "universitas-tanjungpura",
    type: "university",
    city: "Pontianak",
    province: "Kalimantan Barat",
  },
  {
    name: "Universitas Lambung Mangkurat",
    slug: "universitas-lambung-mangkurat",
    type: "university",
    city: "Banjarmasin",
    province: "Kalimantan Selatan",
  },
  {
    name: "Universitas Mulawarman",
    slug: "universitas-mulawarman",
    type: "university",
    city: "Samarinda",
    province: "Kalimantan Timur",
  },
  {
    name: "Universitas Palangka Raya",
    slug: "universitas-palangka-raya",
    type: "university",
    city: "Palangka Raya",
    province: "Kalimantan Tengah",
  },
  {
    name: "Universitas Cenderawasih",
    slug: "universitas-cenderawasih",
    type: "university",
    city: "Jayapura",
    province: "Papua",
  },
  {
    name: "Universitas Pattimura",
    slug: "universitas-pattimura",
    type: "university",
    city: "Ambon",
    province: "Maluku",
  },
  {
    name: "Politeknik Negeri Jakarta",
    slug: "politeknik-negeri-jakarta",
    type: "polytechnic",
    city: "Depok",
    province: "Jawa Barat",
  },
  {
    name: "Politeknik Negeri Bandung",
    slug: "politeknik-negeri-bandung",
    type: "polytechnic",
    city: "Bandung",
    province: "Jawa Barat",
  },
  {
    name: "Politeknik Elektronika Negeri Surabaya",
    slug: "politeknik-elektronika-negeri-surabaya",
    type: "polytechnic",
    city: "Surabaya",
    province: "Jawa Timur",
  },
  {
    name: "Politeknik Negeri Semarang",
    slug: "politeknik-negeri-semarang",
    type: "polytechnic",
    city: "Semarang",
    province: "Jawa Tengah",
  },
  {
    name: "Politeknik Negeri Malang",
    slug: "politeknik-negeri-malang",
    type: "polytechnic",
    city: "Malang",
    province: "Jawa Timur",
  },
  {
    name: "Politeknik Negeri Ujung Pandang",
    slug: "politeknik-negeri-ujung-pandang",
    type: "polytechnic",
    city: "Makassar",
    province: "Sulawesi Selatan",
  },
  {
    name: "Politeknik Negeri Medan",
    slug: "politeknik-negeri-medan",
    type: "polytechnic",
    city: "Medan",
    province: "Sumatera Utara",
  },
  {
    name: "Politeknik Negeri Bali",
    slug: "politeknik-negeri-bali",
    type: "polytechnic",
    city: "Badung",
    province: "Bali",
  },
  {
    name: "SMK Telkom Malang",
    slug: "smk-telkom-malang",
    type: "vocational_school",
    city: "Malang",
    province: "Jawa Timur",
  },
  {
    name: "SMK Negeri 1 Jakarta",
    slug: "smk-negeri-1-jakarta",
    type: "vocational_school",
    city: "Jakarta",
    province: "DKI Jakarta",
  },
  {
    name: "SMK Negeri 2 Bandung",
    slug: "smk-negeri-2-bandung",
    type: "vocational_school",
    city: "Bandung",
    province: "Jawa Barat",
  },
  {
    name: "SMK Negeri 3 Yogyakarta",
    slug: "smk-negeri-3-yogyakarta",
    type: "vocational_school",
    city: "Yogyakarta",
    province: "DI Yogyakarta",
  },
  {
    name: "SMK Negeri 5 Surabaya",
    slug: "smk-negeri-5-surabaya",
    type: "vocational_school",
    city: "Surabaya",
    province: "Jawa Timur",
  },
  {
    name: "SMA Negeri 8 Jakarta",
    slug: "sma-negeri-8-jakarta",
    type: "high_school",
    city: "Jakarta",
    province: "DKI Jakarta",
  },
];

const PILOT_APPETITE = {
  max_amount: 15_000_000,
  max_tenor_months: 36,
  margin_rate_bp: 1200,
  service_fee_rate_bp: 200,
} as const;

const LENDER_SEEDS: readonly LenderSeed[] = [
  {
    name: "Mitra Pembiayaan Pilot",
    licenseType: "other",
    licenseNumber: null,
    riskAppetite: { ...PILOT_APPETITE, max_tenor_months: 60 },
  },
  {
    name: "Bank Kampus Nusantara (pilot)",
    licenseType: "other",
    licenseNumber: null,
    riskAppetite: {
      ...PILOT_APPETITE,
      max_amount: 25_000_000,
      margin_rate_bp: 1050,
    },
  },
  {
    name: "Fintech Edufund (pilot)",
    licenseType: "other",
    licenseNumber: null,
    riskAppetite: {
      ...PILOT_APPETITE,
      max_amount: 10_000_000,
      margin_rate_bp: 1400,
    },
  },
  {
    name: "Multifinance Cendekia (pilot)",
    licenseType: "other",
    licenseNumber: null,
    riskAppetite: {
      ...PILOT_APPETITE,
      max_amount: 20_000_000,
      service_fee_rate_bp: 250,
    },
  },
  {
    name: "Koperasi Mahasiswa Sejahtera (pilot)",
    licenseType: "other",
    licenseNumber: null,
    riskAppetite: {
      ...PILOT_APPETITE,
      max_amount: 8_000_000,
      margin_rate_bp: 900,
    },
  },
  {
    name: "Bank Pembangunan Daerah (pilot)",
    licenseType: "other",
    licenseNumber: null,
    riskAppetite: {
      ...PILOT_APPETITE,
      max_amount: 18_000_000,
      margin_rate_bp: 1100,
    },
  },
  {
    name: "Fintech Talenta Muda (pilot)",
    licenseType: "other",
    licenseNumber: null,
    riskAppetite: {
      ...PILOT_APPETITE,
      max_amount: 12_000_000,
      max_tenor_months: 24,
    },
  },
  {
    name: "Lembaga Beasiswa Mandiri (pilot)",
    licenseType: "other",
    licenseNumber: null,
    riskAppetite: {
      ...PILOT_APPETITE,
      max_amount: 6_000_000,
      margin_rate_bp: 800,
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

const BACKFILL_LENDER_APPETITE_POSTGRES = `UPDATE lenders
SET risk_appetite_json = ?
WHERE name = ?
  AND (risk_appetite_json IS NULL
    OR risk_appetite_json ->> 'margin_rate_bp' IS NULL)`;

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
  const dialect = await database.dialect();
  const backfill =
    dialect === "postgres"
      ? BACKFILL_LENDER_APPETITE_POSTGRES
      : BACKFILL_LENDER_APPETITE;
  await database
    .prepare(backfill)
    .run(
      JSON.stringify({ ...PILOT_APPETITE, max_tenor_months: 60 }),
      "Mitra Pembiayaan Pilot",
    );
}
