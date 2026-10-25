import { ArrowRight, Clock3, ScrollText } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageShell } from "@/components/app/page-shell";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/data/dal";
import {
  type AuditTrailItem,
  getOperatorOverview,
  listAuditTrail,
} from "@/data/operator";
import { formatIDR } from "@/lib/format/currency";
import { formatInstantWib } from "@/lib/format/date";

export const metadata: Metadata = {
  title: "Konsol operator",
  robots: { index: false, follow: false },
};

export const instant = false;

function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
  readonly tone?: "neutral" | "warning" | "success";
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-2xs font-medium uppercase tracking-[0.14em] text-foreground-subtle">
        {label}
      </p>
      <p
        className={
          tone === "warning"
            ? "mt-1.5 text-2xl font-semibold tracking-[-0.03em] tabular-nums text-warning"
            : tone === "success"
              ? "mt-1.5 text-2xl font-semibold tracking-[-0.03em] tabular-nums text-foreground"
              : "mt-1.5 text-2xl font-semibold tracking-[-0.03em] tabular-nums text-foreground"
        }
      >
        {value}
      </p>
      {hint === undefined ? null : (
        <p className="mt-1 text-2xs text-foreground-subtle">{hint}</p>
      )}
    </div>
  );
}

function AuditList({ items }: { items: readonly AuditTrailItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm leading-6 text-foreground-muted">
        Belum ada aktivitas tercatat.
      </p>
    );
  }
  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0"
        >
          <span className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="font-mono text-2xs text-foreground">
              {item.action}
            </span>
            <span className="text-2xs text-foreground-subtle">
              {formatInstantWib(item.occurredAt)}
            </span>
          </span>
          <span className="text-2xs text-foreground-muted">
            {item.actorName ?? item.actorType} · {item.entityType}
          </span>
          {item.reason === null ? null : (
            <span className="text-2xs text-foreground-subtle">
              {item.reason}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default async function OperatorHomePage() {
  await requireRole("operator");
  const [overview, audit] = await Promise.all([
    getOperatorOverview(),
    listAuditTrail({ limit: 6 }),
  ]);

  return (
    <PageShell
      title="Ringkasan"
      description="Kondisi antrian, nominal yang menunggu, dan aktivitas terakhir di konsol."
      actions={
        <Link
          href={"/operator/antrian" as Route}
          className={buttonVariants({ size: "md" })}
        >
          Buka antrian
        </Link>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Menunggu ditinjau"
          value={String(overview.pendingCount)}
          hint="Belum diklaim petugas"
          tone={overview.pendingCount > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Sedang ditinjau"
          value={String(overview.inReviewCount)}
          hint={`${overview.claimedByMeCount} ditangani kamu`}
        />
        <StatCard
          label="Nominal antrian"
          value={formatIDR(overview.queuedAmount)}
          hint="Total pengajuan yang menunggu"
        />
        <StatCard
          label="Paling lama menunggu"
          value={
            overview.oldestWaitingSince === null
              ? "—"
              : formatInstantWib(overview.oldestWaitingSince)
          }
          hint="Sejak pengajuan dikirim"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="gap-0 shadow-none">
            <CardContent className="flex items-start gap-3 pb-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-warning-soft">
                <Clock3
                  aria-hidden="true"
                  strokeWidth={1.8}
                  className="size-4 text-warning"
                />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <CardTitle>Yang perlu dikerjakan</CardTitle>
                <p className="text-xs leading-5 text-foreground-muted">
                  {overview.pendingCount === 0
                    ? "Tidak ada pengajuan baru. Antrian bersih."
                    : `${overview.pendingCount} pengajuan menunggu klaim. Klaim satu per satu supaya tidak ada dua petugas meninjau dokumen yang sama.`}
                </p>
              </div>
            </CardContent>
            <CardContent className="border-border border-t pt-3">
              <Link
                href={"/operator/antrian" as Route}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
              >
                Lihat antrian
                <ArrowRight
                  aria-hidden="true"
                  strokeWidth={2}
                  className="size-3.5"
                />
              </Link>
            </CardContent>
          </Card>
          <Card className="gap-0 shadow-none">
            <CardContent className="pb-3">
              <CardTitle>Pintasan</CardTitle>
            </CardContent>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                <li>
                  <Link
                    href={"/operator/pencairan" as Route}
                    className="flex h-full flex-col gap-1 rounded-lg border border-border p-3 text-xs hover:border-border-strong hover:bg-surface-raised"
                  >
                    <span className="font-semibold text-foreground">
                      Pencairan
                    </span>
                    <span className="text-2xs leading-4 text-foreground-muted">
                      Keputusan mitra, perjanjian, dan four-eyes.
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href={"/operator/pembayaran" as Route}
                    className="flex h-full flex-col gap-1 rounded-lg border border-border p-3 text-xs hover:border-border-strong hover:bg-surface-raised"
                  >
                    <span className="font-semibold text-foreground">
                      Pembayaran
                    </span>
                    <span className="text-2xs leading-4 text-foreground-muted">
                      Verifikasi bukti transfer cicilan.
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href={"/operator/audit" as Route}
                    className="flex h-full flex-col gap-1 rounded-lg border border-border p-3 text-xs hover:border-border-strong hover:bg-surface-raised"
                  >
                    <span className="font-semibold text-foreground">Audit</span>
                    <span className="text-2xs leading-4 text-foreground-muted">
                      Telusuri aksi operator dan sistem.
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href={"/operator/keamanan" as Route}
                    className="flex h-full flex-col gap-1 rounded-lg border border-border p-3 text-xs hover:border-border-strong hover:bg-surface-raised"
                  >
                    <span className="font-semibold text-foreground">
                      Keamanan
                    </span>
                    <span className="text-2xs leading-4 text-foreground-muted">
                      2FA opsional untuk akun konsol.
                    </span>
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <aside className="flex min-w-0 flex-col gap-4">
          <Card className="gap-0 shadow-none">
            <CardContent className="flex items-baseline justify-between gap-3 pb-3">
              <CardTitle className="flex items-center gap-2">
                <ScrollText
                  aria-hidden="true"
                  strokeWidth={1.8}
                  className="size-4 text-foreground-muted"
                />
                Aktivitas terakhir
              </CardTitle>
              <Link
                href={"/operator/audit" as Route}
                className="text-xs font-semibold text-primary hover:text-primary-hover"
              >
                Semua
              </Link>
            </CardContent>
            <CardContent>
              <AuditList items={audit} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
