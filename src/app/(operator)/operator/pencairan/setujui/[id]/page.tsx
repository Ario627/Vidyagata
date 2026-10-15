import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { formatRateBp, STATUS_META } from "@/components/financing/labels";
import { FourEyesExplainer } from "@/components/operator/four-eyes-explainer";
import { CheckerPanel } from "@/components/operator/pencairan-checker-panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/data/dal";
import { getPencairanDetail, type PencairanDetail } from "@/data/disbursements";
import { formatIDR } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Persetujuan pencairan",
  robots: { index: false, follow: false },
};

export const instant = false;

function blockReason(detail: PencairanDetail): string {
  const request = detail.latestRequest;
  if (request === null) {
    return "Belum ada permintaan pencairan untuk pengajuan ini.";
  }
  if (request.status === "requested" && request.initiatedByMe) {
    return "Kamu yang mengajukan permintaan ini — persetujuan harus datang dari petugas lain. Itulah inti kontrol dua orang.";
  }
  if (request.status === "approved") {
    return `Permintaan ini sudah disetujui${
      request.decidedByName === null ? "" : ` oleh ${request.decidedByName}`
    }, menunggu pengaju mencatat bukti transfer.`;
  }
  if (request.status === "executed") {
    return "Pencairan ini sudah selesai dicatat.";
  }
  return "Tidak ada yang menunggu persetujuanmu saat ini.";
}

export default async function PencairanDecidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("operator");
  const { id } = await params;
  const detail = await getPencairanDetail(id);
  if (detail === null) notFound();
  const amount = detail.approvedAmount ?? detail.requestedAmount;
  const facilityMeta = STATUS_META[detail.facilityStatus];
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        eyebrow={detail.publicRef}
        title={amount === null ? "Pencairan" : formatIDR(amount)}
        description={`Tujuan: ${detail.institutionName ?? "kampus belum dipilih"}`}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={facilityMeta.variant}>{facilityMeta.label}</Badge>
        <Badge variant="neutral">
          {formatRateBp(detail.marginRateBp ?? 0)} margin ·{" "}
          {detail.tenorMonths === null ? "-" : `${detail.tenorMonths} bulan`}
        </Badge>
      </div>
      <div className="mt-4">
        {detail.permissions.decide ? (
          <CheckerPanel detail={detail} />
        ) : (
          <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
            <CardTitle>Tidak ada aksi untukmu</CardTitle>
            <p className="text-sm leading-6 text-foreground-muted">
              {blockReason(detail)}
            </p>
            <p className="text-sm text-foreground-muted">
              <FourEyesExplainer />
            </p>
          </section>
        )}
      </div>
      <Card className="mt-4">
        <CardContent>
          <CardTitle>Rekap pembiayaan</CardTitle>
        </CardContent>
        <CardContent className="flex flex-col gap-2 text-sm text-foreground-muted">
          <span>Mahasiswa: {detail.studentName}</span>
          <span>
            Nominal disetujui:{" "}
            {detail.approvedAmount === null
              ? "belum ditetapkan"
              : formatIDR(detail.approvedAmount)}
          </span>
          <span>
            Kampus tujuan: {detail.institutionName ?? "belum dipilih"}
          </span>
        </CardContent>
      </Card>
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
