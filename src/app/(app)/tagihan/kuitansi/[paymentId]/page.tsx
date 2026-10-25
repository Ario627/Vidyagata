import { ArrowLeft } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/app/page-shell";
import { PrintButton } from "@/components/account/print-button";
import { getMyPaymentReceipt } from "@/data/payments";
import { parsePlainDate } from "@/domain/time/plain-date";
import { formatIDR } from "@/lib/format/currency";
import { formatInstantWib, formatPlainDate } from "@/lib/format/date";

export const metadata: Metadata = {
  title: "Kuitansi pembayaran",
  robots: { index: false, follow: false },
};

export const instant = false;

function receiptNumber(id: string, verifiedAt: string | null): string {
  const year = (verifiedAt ?? new Date().toISOString()).slice(0, 4);
  return `KW-${year}-${id.slice(-6).toUpperCase()}`;
}

export default async function PaymentReceiptPage({
  params,
}: PageProps<"/tagihan/kuitansi/[paymentId]">) {
  const { paymentId } = await params;
  const receipt = await getMyPaymentReceipt(paymentId);
  if (receipt === null) notFound();

  const dueDate = parsePlainDate(receipt.dueDate);
  const number = receiptNumber(receipt.id, receipt.verifiedAt);

  return (
    <PageShell
      title="Kuitansi pembayaran"
      description="Bukti resmi bahwa pembayaran cicilanmu sudah diterima dan diverifikasi."
      actions={
        <>
          <Link
            href={"/tagihan" as Route}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" strokeWidth={2} className="size-4" />
            Kembali ke tagihan
          </Link>
          <PrintButton label="Cetak / simpan PDF" />
        </>
      }
    >
      <article className="statement-sheet mx-auto w-full max-w-3xl rounded-2xl border border-border bg-surface p-6 shadow-panel sm:p-10">
        <header className="flex items-start justify-between gap-6 border-border border-b pb-6">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
            >
              V
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-base font-semibold tracking-tight text-foreground">
                vidyagata
              </span>
              <span className="mt-1 text-[0.5625rem] font-medium uppercase tracking-[0.16em] text-foreground-subtle">
                Pembiayaan pendidikan
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
              Kuitansi pembayaran
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-foreground">
              {number}
            </p>
          </div>
        </header>

        <div className="grid gap-8 py-6 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="text-2xs uppercase tracking-[0.14em] text-foreground-subtle">
              Dibayarkan oleh
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {receipt.studentName}
            </p>
            <p className="mt-0.5 text-xs text-foreground-muted">
              Pengirim tercatat: {receipt.senderName}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-2xs uppercase tracking-[0.14em] text-foreground-subtle">
              Jumlah diterima
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground tabular-nums">
              {formatIDR(receipt.amount)}
            </p>
            <p className="mt-0.5 text-xs text-success">Terverifikasi</p>
          </div>
        </div>

        <dl className="grid gap-x-8 gap-y-3 border-border border-t py-6 sm:grid-cols-2">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-xs text-foreground-muted">Fasilitas</dt>
            <dd className="font-mono text-xs font-medium text-foreground">
              {receipt.facilityPublicRef}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-xs text-foreground-muted">Institusi</dt>
            <dd className="text-right text-xs font-medium text-foreground">
              {receipt.institutionName ?? "Tidak tercatat"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-xs text-foreground-muted">Cicilan</dt>
            <dd className="text-xs font-medium text-foreground">
              Periode {receipt.periodNo} dari {receipt.tenorMonths}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-xs text-foreground-muted">Jatuh tempo</dt>
            <dd className="text-right text-xs font-medium text-foreground">
              {dueDate.ok ? formatPlainDate(dueDate.value) : receipt.dueDate}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-xs text-foreground-muted">Bukti diunggah</dt>
            <dd className="text-right text-xs font-medium text-foreground">
              {formatInstantWib(receipt.submittedAt)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-xs text-foreground-muted">Diverifikasi</dt>
            <dd className="text-right text-xs font-medium text-foreground">
              {receipt.verifiedAt === null
                ? "—"
                : formatInstantWib(receipt.verifiedAt)}
            </dd>
          </div>
        </dl>

        <footer className="border-border border-t pt-5">
          <p className="text-2xs leading-5 text-foreground-subtle">
            Kode verifikasi bukti:{" "}
            <span className="font-mono break-all">{receipt.proofSha256}</span>
          </p>
          <p className="mt-2 text-2xs leading-5 text-foreground-subtle">
            Kuitansi ini dibuat otomatis dari catatan pembayaran Vidyagata.
            Status cicilan dapat diperiksa kembali di halaman Tagihan.
          </p>
        </footer>
      </article>
    </PageShell>
  );
}
