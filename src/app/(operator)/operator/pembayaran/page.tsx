import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/app/page-header";
import { PaymentReviewActions } from "@/components/operator/payment-review-actions";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/data/dal";
import { listPaymentQueue } from "@/data/payments";
import { formatIDR } from "@/lib/format/currency";
import { formatInstantWib } from "@/lib/format/date";

export const metadata: Metadata = {
  title: "Verifikasi pembayaran",
  robots: { index: false, follow: false },
};

export const instant = false;

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function OperatorPembayaranPage() {
  await requireRole("operator");
  const queue = await listPaymentQueue();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        eyebrow="Keuangan"
        title="Verifikasi pembayaran"
        description="Periksa tiap bukti transfer cicilan: nominal harus sama persis dengan tagihan dan nama pengirim sesuai. Verifikasi menandai cicilan lunas secara permanen."
      />
      {queue.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Antrean kosong"
          description="Belum ada bukti transfer yang menunggu verifikasi. Bukti baru muncul di sini begitu mahasiswa mengunggahnya dari halaman Tagihan."
        />
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {queue.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-base font-semibold tabular-nums text-foreground">
                    {formatIDR(item.amount)}
                  </p>
                  <span className="text-2xs text-foreground-subtle">
                    diunggah {formatInstantWib(item.submittedAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground-muted">
                  {item.studentName} · cicilan {item.periodNo} dari{" "}
                  {item.tenorMonths} · {item.facilityPublicRef}
                </p>
                <p className="text-sm text-foreground-muted">
                  Pengirim:{" "}
                  <span className="font-medium text-foreground">
                    {item.senderName}
                  </span>
                </p>
                {item.note === null ? null : (
                  <p className="text-2xs leading-4 text-foreground-subtle">
                    Catatan: {item.note}
                  </p>
                )}
              </CardContent>
              <CardContent className="flex flex-col gap-2 pt-0">
                {item.proofMime.startsWith("image/") ? (
                  <Image
                    src={`/api/payments/${item.id}/proof`}
                    alt={`Bukti transfer ${item.studentName}`}
                    width={720}
                    height={405}
                    unoptimized
                    className="h-44 w-full rounded-lg border border-border bg-surface-raised object-contain"
                  />
                ) : null}
                <a
                  href={`/api/payments/${item.id}/proof`}
                  className="text-sm font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
                >
                  {item.proofMime.startsWith("image/")
                    ? `Buka ukuran penuh (${formatSize(item.proofSize)})`
                    : `Unduh bukti PDF (${formatSize(item.proofSize)})`}
                </a>
              </CardContent>
              <CardContent className="pt-0">
                <PaymentReviewActions
                  paymentId={item.id}
                  senderName={item.senderName}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}