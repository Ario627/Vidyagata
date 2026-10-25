import { ArrowUpRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { STATUS_META } from "@/components/financing/labels";
import { Badge } from "@/components/ui/badge";
import type { FinancingFacility } from "@/data/financing";
import { formatIDR } from "@/lib/format/currency";
import { formatInstantWib } from "@/lib/format/date";
import { PURPOSE_LABELS } from "./labels";

type FacilityCardProps = {
  readonly facility: FinancingFacility;
  readonly institutionName: string | null;
};

function FacilityCard({ facility, institutionName }: FacilityCardProps) {
  const meta = STATUS_META[facility.status];
  const purposeLabel =
    facility.academicPurpose === null
      ? "Tujuan belum dipilih"
      : PURPOSE_LABELS[facility.academicPurpose];
  const isDraft = facility.status === "draft";
  const href = isDraft ? "/pembiayaan/ajukan" : `/pembiayaan/${facility.id}`;
  const cta = isDraft ? "Lanjutkan pengajuan" : "Lihat detail";

  return (
    <Link
      href={href as Route}
      className="group block rounded-xl border border-border bg-surface p-4 transition-colors duration-150 ease-out hover:border-border-strong hover:bg-surface-raised/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-mono text-2xs tracking-tight text-foreground-subtle">
            {facility.publicRef}
          </span>
          <span className="text-xl font-semibold tracking-[-0.03em] text-foreground tabular-nums">
            {facility.requestedAmount === null
              ? "Nominal belum diisi"
              : formatIDR(facility.requestedAmount)}
          </span>
        </div>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground-muted">
        <span className="font-medium text-foreground">
          {institutionName ?? "Kampus belum dipilih"}
        </span>
        <span aria-hidden="true" className="text-foreground-subtle">
          ·
        </span>
        <span>{purposeLabel}</span>
        <span aria-hidden="true" className="text-foreground-subtle">
          ·
        </span>
        <span>Dibuat {formatInstantWib(facility.createdAt)}</span>
      </div>
      <div className="mt-4 flex items-center justify-between border-border border-t pt-3">
        <span className="text-2xs text-foreground-subtle">
          {facility.approvedAmount === null
            ? "Menunggu keputusan"
            : `Disetujui ${formatIDR(facility.approvedAmount)}`}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
          {cta}
          <ArrowUpRight
            aria-hidden="true"
            strokeWidth={2}
            className="size-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </div>
    </Link>
  );
}

export { FacilityCard };
