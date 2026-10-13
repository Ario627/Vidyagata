import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import type { FinancingFacility } from "@/data/financing";
import { formatIDR } from "@/lib/format/currency";
import { formatInstantWib } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { PURPOSE_LABELS, STATUS_META } from "./labels";

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

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-mono text-2xs text-foreground-subtle">
            {facility.publicRef}
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground tabular-nums">
            {facility.requestedAmount === null
              ? "Nominal belum diisi"
              : formatIDR(facility.requestedAmount)}
          </span>
        </div>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </CardContent>
      <CardContent className="flex flex-col gap-1 text-xs text-foreground-muted">
        <span>{institutionName ?? "Kampus belum dipilih"}</span>
        <span>
          {purposeLabel} · dibuat {formatInstantWib(facility.createdAt)}
        </span>
      </CardContent>
      {facility.status === "draft" ? (
        <CardContent>
          <Link
            href={"/pembiayaan/ajukan" as Route}
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "w-full",
            )}
          >
            Lanjutkan pengajuan
          </Link>
        </CardContent>
      ) : (
        <CardContent>
          <Link
            href={`/pembiayaan/${facility.id}` as Route}
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "w-full",
            )}
          >
            Lihat detail
          </Link>
        </CardContent>
      )}
    </Card>
  );
}

export { FacilityCard };
