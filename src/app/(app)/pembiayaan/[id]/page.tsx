import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { CancelFacility } from "@/components/financing/cancel-facility";
import { PURPOSE_LABELS, STATUS_META } from "@/components/financing/labels";
import { StatusTimeline } from "@/components/financing/status-timeline";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { getMyFacilityTimeline } from "@/data/financing";
import { listInstitutionOptions } from "@/data/institutions";
import { canTransition } from "@/domain/financing/state-machine";
import {
  buildStatusTimeline,
  mergeOccurredAt,
} from "@/domain/financing/timeline";
import { formatIDR } from "@/lib/format/currency";
import { formatInstantWib } from "@/lib/format/date";
import { formatPercentFromBp } from "@/lib/format/percent";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Detail pengajuan",
  description:
    "Status dan perjalanan pengajuan pembiayaanmu, langkah demi langkah.",
};

export const instant = false;

function InfoRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-sm text-foreground-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

export default async function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const detail = await getMyFacilityTimeline(id);
  if (detail === null) notFound();
  const { facility, transitions } = detail;
  const meta = STATUS_META[facility.status];
  const institutions = listInstitutionOptions();
  const institutionName =
    facility.institutionId === null
      ? null
      : (institutions.find(
          (institution) => institution.id === facility.institutionId,
        )?.name ?? null);
  const occurredAt = mergeOccurredAt([
    { status: "draft", occurredAt: facility.createdAt },
    { status: "submitted", occurredAt: facility.submittedAt },
    { status: "approved", occurredAt: facility.approvedAt },
    { status: "signed", occurredAt: facility.signedAt },
    { status: "disbursed", occurredAt: facility.disbursedAt },
    ...transitions,
  ]);
  const steps = buildStatusTimeline({
    current: facility.status,
    occurredAt,
  });
  const canCancel = canTransition(facility.status, "cancelled", "user");

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        eyebrow={facility.publicRef}
        title={
          facility.requestedAmount === null
            ? "Pengajuan pembiayaan"
            : formatIDR(facility.requestedAmount)
        }
        description="Statusnya selalu jujur di sini — tanpa istilah yang menyamarkan."
      />
      <div className="mt-3 flex items-center gap-2">
        <Badge variant={meta.variant}>{meta.label}</Badge>
        <span className="text-xs text-foreground-subtle">
          dibuat {formatInstantWib(facility.createdAt)}
        </span>
      </div>
      <Card className="mt-6">
        <CardContent>
          <CardTitle>Ringkasan</CardTitle>
        </CardContent>
        <CardContent>
          <dl className="flex flex-col divide-y divide-border">
            <InfoRow
              label="Kampus tujuan"
              value={institutionName ?? "Belum dipilih"}
            />
            <InfoRow
              label="Tujuan pembiayaan"
              value={
                facility.academicPurpose === null
                  ? "Belum dipilih"
                  : PURPOSE_LABELS[facility.academicPurpose]
              }
            />
            {facility.approvedAmount === null ? null : (
              <InfoRow
                label="Nominal disetujui"
                value={formatIDR(facility.approvedAmount)}
              />
            )}
            {facility.tenorMonths === null ? null : (
              <InfoRow label="Tenor" value={`${facility.tenorMonths} bulan`} />
            )}
            {facility.annualMarginRateBp === null ? null : (
              <InfoRow
                label="Margin"
                value={`${formatPercentFromBp(facility.annualMarginRateBp)} per tahun`}
              />
            )}
            {facility.serviceFeeRateBp === null ? null : (
              <InfoRow
                label="Biaya layanan"
                value={`${formatPercentFromBp(facility.serviceFeeRateBp)} (sekali)`}
              />
            )}
          </dl>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardContent>
          <CardTitle>Perjalanan pengajuan</CardTitle>
        </CardContent>
        <CardContent>
          <StatusTimeline steps={steps} />
        </CardContent>
      </Card>
      <div className="mt-4 flex flex-col gap-2">
        <Link
          href={"/pembiayaan" as Route}
          className={cn(
            buttonVariants({ variant: "secondary", size: "lg" }),
            "w-full",
          )}
        >
          Kembali ke daftar
        </Link>
        {canCancel ? (
          <CancelFacility
            facilityId={facility.id}
            publicRef={facility.publicRef}
          />
        ) : null}
      </div>
    </main>
  );
}