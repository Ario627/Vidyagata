import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/app/page-shell";
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
}: PageProps<"/pembiayaan/[id]">) {
  await requireUser();
  const { id } = await params;
  const detail = await getMyFacilityTimeline(id);
  if (detail === null) notFound();
  const { facility, transitions } = detail;
  const meta = STATUS_META[facility.status];
  const institutions = await listInstitutionOptions();
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
    <PageShell
      eyebrow={facility.publicRef}
      title={
        facility.requestedAmount === null
          ? "Pengajuan pembiayaan"
          : formatIDR(facility.requestedAmount)
      }
      description="Statusnya selalu jujur di sini — tanpa istilah yang menyamarkan."
      actions={
        <Link
          href={"/pembiayaan" as Route}
          className={buttonVariants({ variant: "secondary", size: "md" })}
        >
          Kembali ke daftar
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            <span className="text-xs text-foreground-subtle">
              dibuat {formatInstantWib(facility.createdAt)}
            </span>
          </div>
          <Card className="gap-0 shadow-none">
            <CardContent className="pb-2">
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
                  <InfoRow
                    label="Tenor"
                    value={`${facility.tenorMonths} bulan`}
                  />
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
          <Card className="gap-0 shadow-none">
            <CardContent className="pb-3">
              <CardTitle>Perjalanan pengajuan</CardTitle>
            </CardContent>
            <CardContent>
              <StatusTimeline steps={steps} />
            </CardContent>
          </Card>
        </div>
        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
          <Card className="gap-0 shadow-none">
            <CardContent className="pb-2">
              <CardTitle>Status saat ini</CardTitle>
            </CardContent>
            <CardContent className="flex flex-col gap-3">
              <Badge variant={meta.variant}>{meta.label}</Badge>
              <p className="text-xs leading-5 text-foreground-muted">
                {facility.status === "draft"
                  ? "Pengajuan masih draf. Kamu bisa melanjutkan kapan saja tanpa kehilangan isian."
                  : facility.status === "submitted"
                    ? "Pengajuan sudah masuk antrian. Petugas akan mengklaim dan meninjau dokumenmu."
                    : facility.status === "under_review"
                      ? "Petugas sedang memeriksa kelengkapan dan kelayakan pengajuanmu."
                      : facility.status === "forwarded_to_lender"
                        ? "Pengajuan sudah diteruskan ke mitra pembiayaan. Keputusan akhir ada di tangan mitra."
                        : facility.status === "active"
                          ? "Pembiayaan berjalan. Cicilan bisa dilihat di halaman Tagihan."
                          : facility.status === "paid_off"
                            ? "Semua cicilan lunas. Terima kasih sudah menyelesaikan tanggung jawabmu."
                            : "Status terbaru tercatat di perjalanan pengajuan."}
              </p>
            </CardContent>
          </Card>
          {facility.status === "draft" ? (
            <Link
              href={"/pembiayaan/ajukan" as Route}
              className={cn(buttonVariants({ size: "md" }), "w-full")}
            >
              Lanjutkan pengajuan
            </Link>
          ) : null}
          {canCancel ? (
            <CancelFacility
              facilityId={facility.id}
              publicRef={facility.publicRef}
            />
          ) : null}
        </aside>
      </div>
    </PageShell>
  );
}
