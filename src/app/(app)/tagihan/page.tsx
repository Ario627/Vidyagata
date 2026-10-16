import type { Metadata, Route } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { PageHeader } from "@/components/app/page-header";
import { Mascot } from "@/components/brand/brand";
import { INSTALLMENT_STATUS_META } from "@/components/financing/labels";
import { PaymentDialog } from "@/components/financing/payment-dialog";
import { RepaymentExplainer } from "@/components/financing/repayment-explainer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  type InstallmentPaymentSummary,
  latestOf,
  listMyPayments,
} from "@/data/payments";
import { getMyTagihan, type TagihanInstallment } from "@/data/repayments";
import { formatIDR } from "@/lib/format/currency";
import { formatPlainDate } from "@/lib/format/date";

export const metadata: Metadata = {
  title: "Tagihan",
  description: "Jadwal cicilan dan sisa tagihan pembiayaan pendidikanmu.",
};

export const instant = false;

function InstallmentRow({
  item,
  payment,
}: {
  readonly item: TagihanInstallment;
  readonly payment: InstallmentPaymentSummary | null;
}) {
  const meta = INSTALLMENT_STATUS_META[item.status];
  const pending = payment?.status === "submitted";
  const rejected = payment?.status === "rejected";
  const unsettled = item.status !== "paid" && item.status !== "waived";
  const canPay = unsettled && !pending;
  return (
    <div className="flex flex-col gap-2.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">
            Cicilan {item.periodNo}
          </span>
          <span className="text-2xs text-foreground-subtle">
            jatuh tempo {formatPlainDate(item.dueDate)}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-medium tabular-nums text-foreground">
            {formatIDR(item.total)}
          </span>
          {pending ? (
            <Badge variant="warning">Menunggu verifikasi</Badge>
          ) : (
            <Badge variant={meta.variant}>{meta.label}</Badge>
          )}
        </div>
      </div>
      {rejected ? (
        <p className="text-2xs leading-4 text-danger">
          Bukti sebelumnya ditolak
          {payment?.rejectionReason === null ||
          payment?.rejectionReason === undefined
            ? "."
            : `: ${payment.rejectionReason}`}
        </p>
      ) : null}
      {canPay ? (
        <div className="flex justify-end">
          <PaymentDialog
            installmentId={item.id}
            periodNo={item.periodNo}
            total={item.total}
            totalText={formatIDR(item.total)}
            dueDateText={formatPlainDate(item.dueDate)}
            label={rejected ? "Unggah ulang bukti" : "Bayar"}
            variant={rejected ? "secondary" : "primary"}
          />
        </div>
      ) : null}
      {pending ? (
        <p className="text-2xs leading-4 text-foreground-subtle">
          Bukti transfer dari {payment?.senderName} sedang diperiksa petugas —
          maksimal 1 hari kerja.
        </p>
      ) : null}
    </div>
  );
}

export default async function TagihanPage() {
  const tagihan = await getMyTagihan();
  if (tagihan === null) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
        <AutoRefresh />
        <PageHeader
          eyebrow="VidyaFund"
          title="Tagihan"
          description="Cicilan bulanan dari fasilitas pembiayaanmu muncul di sini — lengkap dengan jatuh tempo, jumlah, dan status pembayaran."
        />
        <EmptyState
          className="mt-6"
          title="Belum ada tagihan"
          description="Tagihan pertama terbit setelah dana pembiayaanmu dicairkan langsung ke rekening kampus."
          action={
            <Link
              href={"/cek-kelayakan" as Route}
              className={buttonVariants({ variant: "secondary" })}
            >
              Lihat simulasi cicilan
            </Link>
          }
        />
      </main>
    );
  }

  const progressBp =
    tagihan.totalCount === 0
      ? 0
      : Math.round((tagihan.paidCount / tagihan.totalCount) * 100);
  const payments = await listMyPayments();
  const byInstallment = latestOf(payments);
  const pendingCount = payments.filter(
    (payment) => payment.status === "submitted",
  ).length;
  const allPaid =
    tagihan.totalCount > 0 && tagihan.paidCount === tagihan.totalCount;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <AutoRefresh />
      <PageHeader
        eyebrow="VidyaFund"
        title="Tagihan"
        description="Jadwal cicilan dan sisa tagihan pembiayaanmu."
      />
      {allPaid ? (
        <Card className="mt-6">
          <CardContent className="flex items-center gap-4">
            <Mascot name="pesta" sizes="88px" className="size-22 shrink-0" />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-base font-semibold text-foreground">
                Semua cicilan lunas
              </p>
              <p className="text-sm leading-6 text-foreground-muted">
                {tagihan.totalCount} dari {tagihan.totalCount} cicilan{" "}
                {tagihan.facilityPublicRef} sudah selesai. Terima kasih sudah
                menyelesaikan tanggung jawabmu sampai tuntas.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
      {pendingCount > 0 ? (
        <Card className="mt-4">
          <CardContent className="flex items-center gap-4">
            <Mascot name="jempol" sizes="64px" className="size-16 shrink-0" />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-sm font-semibold text-foreground">
                Bukti transfer sedang diverifikasi
              </p>
              <p className="text-xs leading-5 text-foreground-muted">
                {pendingCount === 1
                  ? "Ada 1 bukti transfer di antrean petugas. Cicilan ditandai lunas setelah verifikasi selesai (maksimal 1 hari kerja)."
                  : `Ada ${pendingCount} bukti transfer di antrean petugas. Cicilan ditandai lunas setelah verifikasi selesai.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <Card className="mt-4">
        <CardContent className="pt-2">
          <p className="text-xs text-foreground-muted">Sisa tagihan</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {formatIDR(tagihan.outstandingTotal)}
          </p>
          {tagihan.overdueCount === 0 ? null : (
            <p className="mt-1 text-sm text-danger">
              {tagihan.overdueCount} cicilan lewat jatuh tempo — segera
              selesaikan lewat penghasilan kerjamu.
            </p>
          )}
        </CardContent>
        <CardContent className="flex flex-col gap-2">
          <div className="h-2 overflow-hidden rounded-full bg-neutral-soft">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progressBp}%` }}
            />
          </div>
          <p className="text-xs text-foreground-muted">
            {tagihan.paidCount} dari {tagihan.totalCount} cicilan lunas · total{" "}
            {formatIDR(tagihan.totalRepayment)}
          </p>
        </CardContent>
      </Card>
      {tagihan.nextDue === null ? null : (
        <Card className="mt-4">
          <CardContent className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-foreground-muted">
                Cicilan berikutnya
              </span>
              <span className="text-base font-semibold tabular-nums text-foreground">
                {formatIDR(tagihan.nextDue.total)}
              </span>
            </div>
            <span className="shrink-0 text-sm font-medium text-foreground">
              {formatPlainDate(tagihan.nextDue.dueDate)}
            </span>
          </CardContent>
          {tagihan.deductionRate === null ? null : (
            <CardContent className="flex items-center justify-between gap-3 pt-0">
              <p className="text-2xs leading-4 text-foreground-subtle">
                Dipotong {tagihan.deductionRate}% dari penghasilan kerjamu tiap
                bulan.
              </p>
              <RepaymentExplainer />
            </CardContent>
          )}
        </Card>
      )}
      <section className="mt-6 flex flex-col">
        <h2 className="text-2xs font-semibold uppercase tracking-wider text-foreground-subtle">
          Jadwal cicilan · {tagihan.facilityPublicRef}
        </h2>
        <p className="mt-1 text-2xs leading-4 text-foreground-subtle">
          Cara bayar: transfer ke rekening escrow sebesar tagihan, lalu unggah
          bukti transfernya langsung dari baris cicilan.
        </p>
        <Card className="mt-3">
          <CardContent className="divide-y divide-border">
            {tagihan.installments.map((item) => (
              <InstallmentRow
                key={item.periodNo}
                item={item}
                payment={byInstallment.get(item.id) ?? null}
              />
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
