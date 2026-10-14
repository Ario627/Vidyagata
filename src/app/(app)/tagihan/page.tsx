import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { INSTALLMENT_STATUS_META } from "@/components/financing/labels";
import { RepaymentExplainer } from "@/components/financing/repayment-explainer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getMyTagihan, type TagihanInstallment } from "@/data/repayments";
import { formatIDR } from "@/lib/format/currency";
import { formatPlainDate } from "@/lib/format/date";

export const metadata: Metadata = {
  title: "Tagihan",
  description: "Jadwal cicilan dan sisa tagihan pembiayaan pendidikanmu.",
};

export const instant = false;

function InstallmentRow({ item }: { readonly item: TagihanInstallment }) {
  const meta = INSTALLMENT_STATUS_META[item.status];
  return (
    <div className="flex items-center justify-between gap-3 py-3">
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
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </div>
    </div>
  );
}

export default async function TagihanPage() {
  const tagihan = await getMyTagihan();

  if (tagihan === null) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
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

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        eyebrow="VidyaFund"
        title="Tagihan"
        description="Jadwal cicilan dan sisa tagihan pembiayaanmu."
      />
      <Card className="mt-6">
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
        <Card className="mt-3">
          <CardContent className="divide-y divide-border">
            {tagihan.installments.map((item) => (
              <InstallmentRow key={item.periodNo} item={item} />
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
