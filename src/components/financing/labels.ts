import type { DisbursementRequestStatus } from "@/domain/financing/disbursement";
import type { FinancingStatus } from "@/domain/financing/state-machine";
import type { AcademicPurpose } from "@/schemas/financing";

export const PURPOSE_LABELS: Readonly<Record<AcademicPurpose, string>> = {
  tuition: "Biaya kuliah",
  living_cost: "Biaya hidup",
  other: "Lainnya",
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
