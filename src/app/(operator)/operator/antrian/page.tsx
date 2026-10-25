import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { STATUS_META } from "@/components/financing/labels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/data/dal";
import { listReviewQueue, type QueueItem } from "@/data/operator";
import { formatIDR } from "@/lib/format/currency";
import { formatInstantWib } from "@/lib/format/date";

export const metadata: Metadata = {
  title: "Antrian pengajuan",
  robots: { index: false, follow: false },
};

export const instant = false;

function QueueRow({ item }: { readonly item: QueueItem }) {
  const meta = STATUS_META[item.status];
  return (
    <Link
      href={`/operator/pembiayaan/${item.id}` as Route}
      className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Card className="gap-2 transition-colors duration-150 ease-out hover:border-border-strong">
        <CardContent className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-mono text-2xs text-foreground-subtle">
              {item.publicRef}
            </span>
            <span className="text-base font-semibold tabular-nums text-foreground">
              {item.requestedAmount === null
                ? "Nominal kosong"
                : formatIDR(item.requestedAmount)}
            </span>
          </div>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </CardContent>
        <CardContent className="flex flex-col gap-1 text-xs text-foreground-muted">
          <span>{item.institutionName ?? "Kampus belum dipilih"}</span>
          {item.submittedAt === null ? null : (
            <span>diajukan {formatInstantWib(item.submittedAt)}</span>
          )}
          {item.claimedByName === null ? null : (
            <span>
              ditangani {item.claimedByMe ? "kamu" : item.claimedByName}
            </span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function OperatorQueuePage() {
  await requireRole("operator");
  const queue = await listReviewQueue();
  const pending = queue.filter((item) => item.status === "submitted");
  const inReview = queue.filter((item) => item.status === "under_review");

  return (
    <main className="mx-auto flex w-full max-w-[76rem] flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader
        title="Antrian pengajuan"
        description="Urut dari yang paling lama menunggu. Klaim satu pengajuan agar bisa ditinjau."
      />
      {queue.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Antrian kosong"
          description="Pengajuan baru akan muncul di sini begitu dikirim mahasiswa."
        />
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          {pending.length === 0 ? null : (
            <section className="flex flex-col gap-3">
              <h2 className="text-2xs font-semibold uppercase tracking-wider text-foreground-subtle">
                Menunggu ditinjau · {pending.length}
              </h2>
              <ul className="grid gap-3 lg:grid-cols-2">
                {pending.map((item) => (
                  <li key={item.id}>
                    <QueueRow item={item} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {inReview.length === 0 ? null : (
            <section className="flex flex-col gap-3">
              <h2 className="text-2xs font-semibold uppercase tracking-wider text-foreground-subtle">
                Sedang ditinjau · {inReview.length}
              </h2>
              <ul className="grid gap-3 lg:grid-cols-2">
                {inReview.map((item) => (
                  <li key={item.id}>
                    <QueueRow item={item} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
