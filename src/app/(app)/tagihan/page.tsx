import { ChevronDown, ReceiptText } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { PageShell } from "@/components/app/page-shell";
import { Mascot } from "@/components/brand/brand";
import { INSTALLMENT_STATUS_META } from "@/components/financing/labels";
import { PaymentDialog } from "@/components/financing/payment-dialog";
import { PayrollSimulator } from "@/components/financing/payroll-simulator";
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
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tagihan",
  description: "Jadwal cicilan dan sisa tagihan pembiayaan pendidikanmu.",
};

export const instant = false;

const PAYMENT_DESTINATION_LINES = [
  { label: "Bank", value: "BCA" },
  { label: "Nomor rekening", value: "8830 0177 4455" },
  { label: "Atas nama", value: "PT Vidyagata Edukasi Nusantara" },
] as const;

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
  const verified = payment?.status === "verified";
  const unsettled = item.status !== "paid" && item.status !== "waived";
  const canPay = unsettled && !pending;
  return (
    <details className="group py-1">
      <summary className="flex cursor-pointer list-none items-center gap-3 py-3 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full text-2xs font-semibold tabular-nums",
            item.status === "paid"
              ? "bg-success-soft text-success"
              : item.status === "overdue"
                ? "bg-danger-soft text-danger"
                : "bg-surface-raised text-foreground-muted",
          )}
        >
          {item.periodNo}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">
            Cicilan {item.periodNo}
          </span>
          <span className="text-2xs text-foreground-subtle">
            jatuh tempo {formatPlainDate(item.dueDate)}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {formatIDR(item.total)}
          </span>
          {pending ? (
            <Badge variant="warning">Menunggu verifikasi</Badge>
          ) : (
            <Badge variant={meta.variant}>{meta.label}</Badge>
          )}
        </span>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={2}
          className="size-4 shrink-0 text-foreground-subtle transition-transform duration-150 ease-out group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div className="ml-11 flex flex-col gap-3 pb-4">
        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-surface-raised px-3 py-2.5">
          <div className="flex flex-col gap-0.5">
            <dt className="text-2xs text-foreground-subtle">Pokok</dt>
            <dd className="text-xs font-medium tabular-nums text-foreground">
              {formatIDR(item.principal)}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-2xs text-foreground-subtle">Margin</dt>
            <dd className="text-xs font-medium tabular-nums text-foreground">
              {formatIDR(item.margin)}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-2xs text-foreground-subtle">Service fee</dt>
            <dd className="text-xs font-medium tabular-nums text-foreground">
              {formatIDR(item.fee)}
            </dd>
          </div>
        </dl>
        {rejected ? (
          <p className="text-2xs leading-4 text-danger">
            Bukti sebelumnya ditolak
            {payment?.rejectionReason === null ||
            payment?.rejectionReason === undefined
              ? "."
              : `: ${payment.rejectionReason}`}
          </p>
        ) : null}
        {pending ? (
          <p className="text-2xs leading-4 text-foreground-subtle">
            Bukti transfer dari {payment?.senderName} sedang diperiksa petugas —
            maksimal 1 hari kerja.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {verified ? (
            <Link
              href={`/tagihan/kuitansi/${payment.id}` as Route}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <ReceiptText
                aria-hidden="true"
                strokeWidth={1.8}
                className="size-3.5"
              />
              Kuitansi
            </Link>
          ) : null}
          {canPay ? (
            <PaymentDialog
              installmentId={item.id}
              periodNo={item.periodNo}
              total={item.total}
              totalText={formatIDR(item.total)}
              dueDateText={formatPlainDate(item.dueDate)}
              label={rejected ? "Unggah ulang bukti" : "Bayar"}
              variant={rejected ? "secondary" : "primary"}
            />
          ) : null}
        </div>
      </div>
    </details>
  );
}

function SummaryCard({
  tagihan,
  progressBp,
}: {
  tagihan: NonNullable<Awaited<ReturnType<typeof getMyTagihan>>>;
  progressBp: number;
}) {
  const allPaid =
    tagihan.totalCount > 0 && tagihan.paidCount === tagihan.totalCount;
  return (
    <Card className="gap-0 shadow-none">
      <CardContent className="flex flex-wrap items-start justify-between gap-3 pb-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
            Sisa tagihan
          </p>
          <p className="text-[2rem] font-semibold leading-none tracking-[-0.04em] text-foreground tabular-nums">
            {formatIDR(tagihan.outstandingTotal)}
          </p>
          <p className="mt-1 font-mono text-2xs text-foreground-subtle">
            {tagihan.facilityPublicRef}
            {tagihan.institutionName === null
              ? ""
              : ` · ${tagihan.institutionName}`}
          </p>
        </div>
        {allPaid ? (
          <Badge variant="success">Lunas</Badge>
        ) : tagihan.overdueCount > 0 ? (
          <Badge variant="danger">{tagihan.overdueCount} terlambat</Badge>
        ) : (
          <Badge variant="info">Berjalan</Badge>
        )}
      </CardContent>
      <CardContent className="flex flex-col gap-2 pb-4">
        <div
          role="progressbar"
          aria-label="Progres cicilan"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressBp}
          className="h-2 overflow-hidden rounded-full bg-surface-sunken"
        >
          <div
            className="h-full rounded-full bg-success-500"
            style={{ width: `${progressBp}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-3 text-2xs text-foreground-muted">
          <span>
            {tagihan.paidCount} dari {tagihan.totalCount} cicilan lunas
          </span>
          <span className="tabular-nums">
            {formatIDR(tagihan.paidTotal)} / {formatIDR(tagihan.totalRepayment)}
          </span>
        </div>
      </CardContent>
      <CardContent className="border-border border-t pt-4">
        {tagihan.nextDue === null ? (
          <p className="text-sm text-foreground-muted">
            Semua cicilan sudah selesai. Tidak ada tagihan berikutnya.
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-2xs text-foreground-subtle">
                Cicilan berikutnya
              </span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {formatIDR(tagihan.nextDue.total)}
              </span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {formatPlainDate(tagihan.nextDue.dueDate)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentInstructionsCard() {
  return (
    <Card className="gap-0 shadow-none">
      <CardContent className="pb-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Cara membayar
        </h2>
        <p className="mt-1 text-xs leading-5 text-foreground-muted">
          Transfer tepat sebesar tagihan, lalu unggah bukti dari baris cicilan
          yang sesuai.
        </p>
      </CardContent>
      <CardContent>
        <dl className="flex flex-col divide-y divide-border">
          {PAYMENT_DESTINATION_LINES.map((line) => (
            <div
              key={line.label}
              className="flex items-baseline justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <dt className="text-xs text-foreground-muted">{line.label}</dt>
              <dd className="text-right text-xs font-medium text-foreground">
                {line.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
      <CardContent className="flex items-center justify-between gap-3 border-border border-t pt-3">
        <p className="text-2xs leading-4 text-foreground-subtle">
          Rekening escrow pembiayaan
        </p>
        <RepaymentExplainer />
      </CardContent>
    </Card>
  );
}

export default async function TagihanPage() {
  const tagihan = await getMyTagihan();
  if (tagihan === null) {
    return (
      <PageShell
        title="Tagihan"
        description="Cicilan bulanan dari fasilitas pembiayaanmu muncul di sini — lengkap dengan jatuh tempo, jumlah, dan status pembayaran."
      >
        <AutoRefresh />
        <EmptyState
          className="rounded-xl border border-border border-dashed bg-surface"
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
      </PageShell>
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
  const openPeriods = tagihan.totalCount - tagihan.paidCount;

  return (
    <PageShell
      title="Tagihan"
      description="Jadwal cicilan dan sisa tagihan pembiayaanmu."
      actions={<RepaymentExplainer />}
    >
      <AutoRefresh />
      {allPaid ? (
        <Card className="mb-6 gap-0 shadow-none">
          <CardContent className="flex items-center gap-4">
            <Mascot name="pesta" sizes="88px" className="size-20 shrink-0" />
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
        <Card className="mb-6 gap-0 shadow-none">
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <SummaryCard tagihan={tagihan} progressBp={progressBp} />
          <section className="flex flex-col">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-2xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
                Jadwal cicilan
              </h2>
              <span className="text-2xs text-foreground-subtle">
                {tagihan.totalCount} periode
              </span>
            </div>
            <Card className="mt-3 gap-0 shadow-none">
              <CardContent>
                <div className="divide-y divide-border">
                  {tagihan.installments.map((item) => (
                    <InstallmentRow
                      key={item.periodNo}
                      item={item}
                      payment={byInstallment.get(item.id) ?? null}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <PayrollSimulator
            outstanding={tagihan.outstandingTotal}
            openPeriods={openPeriods}
            currentRate={tagihan.deductionRate}
          />
          <PaymentInstructionsCard />
          {tagihan.deductionRate === null ? null : (
            <p className="px-1 text-2xs leading-4 text-foreground-subtle">
              Potongan penghasilan saat ini {tagihan.deductionRate}% per bulan.
            </p>
          )}
        </aside>
      </div>
    </PageShell>
  );
}
