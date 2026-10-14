import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import {
  DISBURSEMENT_STATUS_META,
  formatRateBp,
  STATUS_META,
} from "@/components/financing/labels";
import { MfaRedirect } from "@/components/operator/mfa-redirect";
import { MakerPanel } from "@/components/operator/pencairan-maker-panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { getPencairanDetail } from "@/data/disbursements";
import { requireOperatorMfa } from "@/data/two-factor";
import { formatIDR } from "@/lib/format/currency";
import { formatInstantWib } from "@/lib/format/date";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Inisiasi pencairan",
  robots: { index: false, follow: false },
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

export default async function PencairanInitiatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { mfaRequired } = await requireOperatorMfa();
  if (mfaRequired) return <MfaRedirect />;
  const { id } = await params;
  const detail = await getPencairanDetail(id);
  if (detail === null) notFound();
  const amount = detail.approvedAmount ?? detail.requestedAmount;
  const facilityMeta = STATUS_META[detail.facilityStatus];
  const latestRequestMeta =
    detail.latestRequest === null
      ? undefined
      : DISBURSEMENT_STATUS_META[detail.latestRequest.status];
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        eyebrow={detail.publicRef}
        title={amount === null ? "Pencairan" : formatIDR(amount)}
        description={`Tujuan: ${detail.institutionName ?? "kampus belum dipilih"}`}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={facilityMeta.variant}>{facilityMeta.label}</Badge>
        {latestRequestMeta === undefined ? null : (
          <Badge variant={latestRequestMeta.variant}>
            {latestRequestMeta.label}
          </Badge>
        )}
      </div>
      <Card className="mt-6">
        <CardContent>
          <CardTitle>Rincian</CardTitle>
        </CardContent>
        <CardContent>
          <dl className="flex flex-col divide-y divide-border">
            <InfoRow label="Mahasiswa" value={detail.studentName} />
            <InfoRow
              label="Nominal disetujui"
              value={
                detail.approvedAmount === null
                  ? "Belum ditetapkan"
                  : formatIDR(detail.approvedAmount)
              }
            />
            <InfoRow
              label="Tenor"
              value={
                detail.tenorMonths === null
                  ? "Belum ditetapkan"
                  : `${detail.tenorMonths} bulan`
              }
            />
            <InfoRow
              label="Margin"
              value={
                detail.marginRateBp === null
                  ? "Belum ditetapkan"
                  : `${formatRateBp(detail.marginRateBp)} per tahun`
              }
            />
            <InfoRow
              label="Service fee"
              value={
                detail.serviceFeeRateBp === null
                  ? "Belum ditetapkan"
                  : formatRateBp(detail.serviceFeeRateBp)
              }
            />
            {detail.signedAt === null ? null : (
              <InfoRow
                label="Perjanjian"
                value={`ditandatangani ${formatInstantWib(detail.signedAt)}`}
              />
            )}
            {detail.disbursedAt === null ? null : (
              <InfoRow
                label="Dicairkan"
                value={formatInstantWib(detail.disbursedAt)}
              />
            )}
          </dl>
        </CardContent>
      </Card>
      {detail.latestRequest?.status === "executed" ? (
        <p className="mt-4 rounded-xl bg-success-soft p-4 text-sm leading-6 text-success">
          Pencairan selesai. Bukti transfer{" "}
          {detail.latestRequest.transferReference ?? "-"} dicatat oleh{" "}
          {detail.latestRequest.initiatedByName}
          {detail.latestRequest.executedAt === null
            ? ""
            : ` pada ${formatInstantWib(detail.latestRequest.executedAt)}`}
          .
        </p>
      ) : null}
      <div className="mt-4">
        <MakerPanel detail={detail} />
      </div>
      {detail.previousRequests.length === 0 ? null : (
        <Card className="mt-4">
          <CardContent>
            <CardTitle>Riwayat permintaan</CardTitle>
          </CardContent>
          <CardContent className="flex flex-col gap-3">
            {detail.previousRequests.map((request) => {
              const meta = DISBURSEMENT_STATUS_META[request.status];
              if (meta === undefined) return null;
              return (
                <div
                  key={request.id}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm text-foreground-muted">
                      {formatInstantWib(request.initiatedAt)} ·{" "}
                      {request.initiatedByName}
                    </span>
                    {request.decisionReason === null ? null : (
                      <span className="text-2xs leading-4 text-foreground-subtle">
                        {request.decisionReason}
                      </span>
                    )}
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
      <Link
        href={"/operator/pencairan" as Route}
        className={cn(
          buttonVariants({ variant: "secondary", size: "lg" }),
          "mt-4 w-full",
        )}
      >
        Kembali ke antrean
      </Link>
    </main>
  );
}