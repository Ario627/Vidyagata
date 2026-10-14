import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import {
  DISBURSEMENT_STATUS_META,
  STATUS_META,
} from "@/components/financing/labels";
import { FourEyesExplainer } from "@/components/operator/four-eyes-explainer";
import { MfaRedirect } from "@/components/operator/mfa-redirect";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  listPencairanQueue,
  type PencairanQueueItem,
} from "@/data/disbursements";
import { requireOperatorMfa } from "@/data/two-factor";
import { formatIDR } from "@/lib/format/currency";

export const metadata: Metadata = {
  title: "Pencairan",
  description: "Antrean pencairan dana pembiayaan ke rekening kampus.",
  robots: { index: false, follow: false },
};

export const instant = false;

function targetOf(item: PencairanQueueItem): {
  readonly href: Route;
  readonly action: string;
} {
  const inisiasi = `/operator/pencairan/inisiasi/${item.facilityId}` as Route;
  if (item.requestStatus === "requested" && !item.requestInitiatedByMe) {
    return {
      href: `/operator/pencairan/setujui/${item.facilityId}` as Route,
      action: "Perlu persetujuanmu",
    };
  }
  if (item.requestStatus === "requested") {
    return { href: inisiasi, action: "Menunggu persetujuan" };
  }
  if (item.requestStatus === "approved") {
    return {
      href: inisiasi,
      action: item.requestInitiatedByMe
        ? "Catat bukti transfer"
        : "Menunggu transfer pengaju",
    };
  }
  if (item.facilityStatus === "forwarded_to_lender") {
    return { href: inisiasi, action: "Catat keputusan mitra" };
  }
  if (item.facilityStatus === "approved") {
    return { href: inisiasi, action: "Catat perjanjian" };
  }
  if (item.facilityStatus === "signed") {
    return { href: inisiasi, action: "Ajukan pencairan" };
  }
  return { href: inisiasi, action: "Lihat detail" };
}

function subtitleOf(item: PencairanQueueItem): string {
  if (item.requestStatus === "requested") {
    return item.requestInitiatedByMe
      ? "Diajukan olehmu · menunggu petugas lain"
      : `Diajukan ${item.requestInitiatedByName ?? "petugas"} · menunggu persetujuanmu`;
  }
  if (item.requestStatus === "approved") {
    return item.requestInitiatedByMe
      ? "Disetujui · catat bukti transfer"
      : `Disetujui · menunggu transfer ${item.requestInitiatedByName ?? "pengaju"}`;
  }
  if (item.facilityStatus === "forwarded_to_lender") {
    return "Menunggu keputusan mitra";
  }
  if (item.facilityStatus === "approved") {
    return "Menunggu perjanjian ditandatangani";
  }
  if (item.facilityStatus === "signed") {
    return "Siap diajukan pencairan";
  }
  return "Pencairan selesai";
}

function QueueCard({ item }: { readonly item: PencairanQueueItem }) {
  const target = targetOf(item);
  const meta =
    item.requestStatus === null
      ? STATUS_META[item.facilityStatus]
      : DISBURSEMENT_STATUS_META[item.requestStatus];
  const amount = item.approvedAmount ?? item.requestedAmount;
  return (
    <Link
      href={target.href}
      className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Card className="gap-2 transition-colors duration-150 ease-out hover:border-border-strong">
        <CardContent className="flex items-start justify-between gap-3">
            
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-mono text-2xs text-foreground-subtle">
              {item.publicRef}
            </span>
            <span className="text-base font-semibold tabular-nums text-foreground">
              {amount === null ? "Nominal belum final" : formatIDR(amount)}
            </span>
          </div>
          {meta ? <Badge variant={meta.variant}>{meta.label}</Badge> : null}
        </CardContent>
        <CardContent className="flex items-center justify-between gap-3 text-xs text-foreground-muted">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate">
              {item.institutionName ?? "Kampus belum dipilih"}
            </span>
            <span>{subtitleOf(item)}</span>
          </span>
          <span className="shrink-0 font-medium text-info">
            {target.action}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function PencairanQueuePage() {
  const { mfaRequired } = await requireOperatorMfa();
  if (mfaRequired) return <MfaRedirect />;
  const queue = await listPencairanQueue();
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        title="Pencairan"
        description="Alur setelah peninjauan: keputusan mitra, perjanjian, lalu dana cair ke rekening kampus. Satu petugas mengajukan, petugas lain menyetujui."
      />
      <div className="mt-2">
        <FourEyesExplainer />
      </div>
      {queue.active.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Tidak ada proses berjalan"
          description="Pengajuan yang sudah diteruskan ke mitra pembiayaan akan muncul di sini."
        />
      ) : (
        <section className="mt-6 flex flex-col gap-3">
          <h2 className="text-2xs font-semibold uppercase tracking-wider text-foreground-subtle">
            Antrean · {queue.active.length}
          </h2>
          <ul className="flex flex-col gap-3">
            {queue.active.map((item) => (
              <li key={item.facilityId}>
                <QueueCard item={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {queue.recent.length === 0 ? null : (
        <section className="mt-6 flex flex-col gap-3">
          <h2 className="text-2xs font-semibold uppercase tracking-wider text-foreground-subtle">
            Selesai terakhir
          </h2>
          <ul className="flex flex-col gap-3">
            {queue.recent.map((item) => (
              <li key={item.facilityId}>
                <QueueCard item={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}