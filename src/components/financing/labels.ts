import type { DisbursementRequestStatus } from "@/domain/financing/disbursement";
import type { InstallmentStatus } from "@/domain/financing/schedule";
import type { FinancingStatus } from "@/domain/financing/state-machine";
import type { AcademicPurpose } from "@/schemas/financing";

export const PURPOSE_LABELS: Readonly<Record<AcademicPurpose, string>> = {
  tuition: "Biaya kuliah",
  living_cost: "Biaya hidup",
  other: "Lainnya",
};

export const PURPOSE_PROOF_GUIDANCE: Readonly<Record<AcademicPurpose, string>> =
  {
    tuition:
      "Bukti berupa tagihan resmi dari kampus — surat UKT/BPP, invoice, atau kuitansi pembayaran terbaru. Pastikan nama dan nominalnya terbaca.",
    living_cost:
      "Bukti berupa rincian kebutuhan bulanan yang didukung dokumen — perjanjian sewa/kontrak kamar, tagihan kos, atau daftar pengeluaran dengan nominal yang jelas.",
    other:
      "Bukti berupa dokumen pendukung sesuai keperluan — invoice alat, penawaran vendor, atau surat keterangan resmi yang relevan.",
  };

export const PURPOSE_NOTE_PLACEHOLDER: Readonly<
  Record<AcademicPurpose, string>
> = {
  tuition:
    "mis. Dana dipakai untuk melunasi UKT semester 7 sebesar Rp6.000.000 sesuai surat tagihan kampus yang saya lampirkan.",
  living_cost:
    "mis. Dana dipakai untuk biaya kos dan makan selama 6 bulan ke depan; sewa Rp1.200.000/bulan sesuai perjanjian sewa yang saya lampirkan.",
  other:
    "mis. Dana dipakai untuk membeli laptop pendukung kuliah; penawaran toko dengan spesifikasi dan harga saya lampirkan.",
};

type StatusMeta = {
  readonly label: string;
  readonly variant: "neutral" | "info" | "success" | "warning" | "danger";
};

export const STATUS_META: Readonly<Record<FinancingStatus, StatusMeta>> = {
  draft: { label: "Draf", variant: "neutral" },
  submitted: { label: "Diajukan", variant: "info" },
  under_review: { label: "Sedang ditinjau", variant: "info" },
  forwarded_to_lender: { label: "Diteruskan ke mitra", variant: "info" },
  approved: { label: "Disetujui", variant: "success" },
  signed: { label: "Ditandatangani", variant: "success" },
  disbursed: { label: "Dicairkan", variant: "success" },
  active: { label: "Berjalan", variant: "success" },
  paid_off: { label: "Lunas", variant: "success" },
  defaulted: { label: "Gagal bayar", variant: "danger" },
  rejected: { label: "Ditolak", variant: "danger" },
  cancelled: { label: "Dibatalkan", variant: "neutral" },
};

const ACTIVE_FACILITY_STATUSES: readonly FinancingStatus[] = [
  "submitted",
  "under_review",
  "forwarded_to_lender",
  "approved",
  "signed",
  "disbursed",
  "active",
];

export function hasActiveFacility(status: FinancingStatus): boolean {
  return ACTIVE_FACILITY_STATUSES.includes(status);
}

export const DISBURSEMENT_STATUS_META: Readonly<
  Record<DisbursementRequestStatus, StatusMeta>
> = {
  requested: { label: "Menunggu persetujuan", variant: "warning" },
  approved: { label: "Disetujui — menunggu transfer", variant: "info" },
  rejected: { label: "Ditolak", variant: "danger" },
  withdrawn: { label: "Dibatalkan pengaju", variant: "neutral" },
  executed: { label: "Selesai", variant: "success" },
};

export function formatRateBp(basisPoints: number): string {
  const value = basisPoints / 100;
  const text = Number.isInteger(value)
    ? String(value)
    : value
        .toFixed(2)
        .replace(/\.?0+$/, "")
        .replace(".", ",");
  return `${text}%`;
}

export const INSTALLMENT_STATUS_META: Readonly<
  Record<InstallmentStatus, StatusMeta>
> = {
  due: { label: "Terjadwal", variant: "neutral" },
  partially_paid: { label: "Dibayar sebagian", variant: "warning" },
  paid: { label: "Lunas", variant: "success" },
  overdue: { label: "Terlambat", variant: "danger" },
  waived: { label: "Dibebaskan", variant: "info" },
};
