import type { Db } from "@/lib/db/client";
import { newId } from "@/lib/id";

type ParameterSeed = {
  readonly key: string;
  readonly value: unknown;
};

type ConsentSeed = {
  readonly key: string;
  readonly title: string;
  readonly legalBasis: string;
  readonly body: string;
};

const EFFECTIVE_FROM = "2025-01-01T00:00:00.000Z";
const CONSENT_VERSION = 1;
const PARAMETER_SOURCE = "seed-v1";
const PARAMETER_NOTE =
  "Nilai awal pilot dari model bisnis proposal; tinjau bersama kepatuhan sebelum pencairan dana nyata.";

const PARAMETER_SEEDS: readonly ParameterSeed[] = [
  { key: "max_annual_margin_rate_bp", value: 1500 },
  { key: "max_service_fee_rate_bp", value: 300 },
  { key: "allowed_payroll_deduction_rates", value: [20, 40, 60] },
  { key: "max_tenor_months", value: 60 },
  { key: "min_age_years", value: 18 },
  { key: "max_age_years", value: 35 },
  { key: "default_threshold_days", value: 90 },
  { key: "grace_period_days", value: 7 },
  { key: "max_late_fee_rate_bp", value: 100 },
  { key: "repayment_reminder_days", value: [7, 3, 1, 0] },
  { key: "data_retention_years", value: 10 },
];

const CONSENT_SEEDS: readonly ConsentSeed[] = [
  {
    key: "data_processing",
    legalBasis: "contract",
    title: "Persetujuan pemrosesan data pribadi",
    body: "Saya menyetujui pengumpulan, penyimpanan, dan pemrosesan data pribadi saya - termasuk identitas, data akademik, dan data penghasilan - untuk penilaian kelayakan, penyampaian pengajuan kepada lembaga pembiayaan mitra yang tercantum pada layar pengajuan, pelaksanaan perjanjian pembiayaan, serta pemenuhan kewajiban hukum Vidyagata. Saya memahami data disimpan sesuai masa retensi yang berlaku dan saya dapat meminta akses, salinan, koreksi, atau penghapusan sesuai ketentuan pelindungan data pribadi.",
  },
  {
    key: "marketing",
    legalBasis: "consent",
    title: "Persetujuan komunikasi pemasaran",
    body: "Saya menyetujui penerimaan informasi promosi, program, dan penawaran Vidyagata melalui kanal yang saya pilih. Persetujuan ini bersifat opsional, terpisah dari persetujuan pemrosesan data, dan dapat saya tarik kapan saja tanpa memengaruhi layanan pembiayaan maupun pencocokan kerja yang sedang berjalan.",
  },
];

const INSERT_PARAMETER = `INSERT INTO regulatory_parameters (
  id, key, value_json, effective_from, effective_to,
  source, set_by_user_id, note, created_at
) VALUES (?, ?, ?, ?, NULL, ?, NULL, ?, ?)
ON CONFLICT(key, effective_from) DO NOTHING`;

const INSERT_CONSENT = `INSERT INTO consents (
  id, key, version, title, body, legal_basis, effective_from, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(key, version) DO NOTHING`;

export async function applyPlatformSeeds(database: Db): Promise<void> {
  const createdAt = new Date().toISOString();
  for (const seed of PARAMETER_SEEDS) {
    await database
      .prepare(INSERT_PARAMETER)
      .run(
        newId(),
        seed.key,
        JSON.stringify(seed.value),
        EFFECTIVE_FROM,
        PARAMETER_SOURCE,
        PARAMETER_NOTE,
        createdAt,
      );
  }
  for (const seed of CONSENT_SEEDS) {
    await database
      .prepare(INSERT_CONSENT)
      .run(
        newId(),
        seed.key,
        CONSENT_VERSION,
        seed.title,
        seed.body,
        seed.legalBasis,
        EFFECTIVE_FROM,
        createdAt,
      );
  }
}
