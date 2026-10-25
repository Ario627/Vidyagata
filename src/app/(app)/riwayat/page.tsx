import { ArrowDownLeft, ArrowUpRight, BookOpen, Landmark } from "lucide-react";
import type { Metadata } from "next";
import { PageShell } from "@/components/app/page-shell";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getMyLedgerHistory, type LedgerHistoryEntry } from "@/data/ledger";
import { sum } from "@/domain/money/money";
import { formatIDR } from "@/lib/format/currency";
import { formatDayWib, formatMonthWib } from "@/lib/format/date";

export const metadata: Metadata = {
  title: "Riwayat",
  description:
    "Catatan pencairan dan pembayaran cicilan pembiayaan pendidikanmu.",
};

export const instant = false;

const ENTRY_META: Readonly<
  Record<
    LedgerHistoryEntry["entryType"],
    {
      readonly title: string;
      readonly description: string;
    }
  >
> = {
  disbursement: {
    title: "Pencairan ke kampus",
    description: "Dana dikirim langsung ke rekening institusi.",
  },
  repayment: {
    title: "Pembayaran cicilan",
    description: "Pembayaran yang sudah diverifikasi petugas.",
  },
  payroll_deduction: {
    title: "Potongan penghasilan",
    description: "Cicilan yang dipotong dari penghasilan kerjamu.",
  },
  adjustment: {
    title: "Penyesuaian",
    description: "Koreksi tercatat dengan alasan dan persetujuan.",
  },
  refund: {
    title: "Pengembalian dana",
    description: "Dana yang dikembalikan ke pihak yang berhak.",
  },
};

function groupByMonth(entries: readonly LedgerHistoryEntry[]): readonly {
  readonly month: string;
  readonly entries: readonly LedgerHistoryEntry[];
}[] {
  const groups: { month: string; entries: LedgerHistoryEntry[] }[] = [];
  for (const entry of entries) {
    const month = formatMonthWib(entry.occurredAt);
    const last = groups[groups.length - 1];
    if (last !== undefined && last.month === month) {
      last.entries.push(entry);
    } else {
      groups.push({ month, entries: [entry] });
    }
  }
  return groups;
}

function SummaryCard({ entries }: { entries: readonly LedgerHistoryEntry[] }) {
  const disbursed = sum(
    entries
      .filter((entry) => entry.direction === "debit")
      .map((entry) => entry.amount),
  );
  const repaid = sum(
    entries
      .filter((entry) => entry.direction === "credit")
      .map((entry) => entry.amount),
  );
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-2xs uppercase tracking-[0.14em] text-foreground-subtle">
          Dana dicairkan
        </p>
        <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-foreground tabular-nums">
          {formatIDR(disbursed)}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-2xs uppercase tracking-[0.14em] text-foreground-subtle">
          Total dibayar
        </p>
        <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-success tabular-nums">
          {formatIDR(repaid)}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-2xs uppercase tracking-[0.14em] text-foreground-subtle">
          Baris tercatat
        </p>
        <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-foreground tabular-nums">
          {entries.length}
        </p>
      </div>
    </div>
  );
}

function EntryRow({ entry }: { entry: LedgerHistoryEntry }) {
  const meta = ENTRY_META[entry.entryType];
  const isDebit = entry.direction === "debit";
  return (
    <li className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-surface-raised">
        {isDebit ? (
          <Landmark
            aria-hidden="true"
            strokeWidth={1.8}
            className="size-4 text-foreground-muted"
          />
        ) : (
          <ArrowDownLeft
            aria-hidden="true"
            strokeWidth={1.8}
            className="size-4 text-success"
          />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-sm font-medium text-foreground">
            {meta.title}
          </span>
          <span
            className={
              isDebit
                ? "text-sm font-semibold tabular-nums text-foreground"
                : "text-sm font-semibold tabular-nums text-success"
            }
          >
            {isDebit ? "+" : "−"}
            {formatIDR(entry.amount)}
          </span>
        </span>
        <span className="text-xs text-foreground-muted">
          {entry.memo ?? meta.description}
        </span>
        <span className="text-2xs text-foreground-subtle">
          {formatDayWib(entry.occurredAt)} ·{" "}
          <span className="font-mono">{entry.facilityPublicRef}</span>
        </span>
      </span>
    </li>
  );
}

function LedgerNotesCard() {
  return (
    <Card className="gap-0 shadow-none">
      <CardContent className="flex items-center gap-2 pb-3">
        <BookOpen
          aria-hidden="true"
          strokeWidth={1.8}
          className="size-4 text-foreground-muted"
        />
        <CardTitle>Cara membaca riwayat</CardTitle>
      </CardContent>
      <CardContent>
        <dl className="flex flex-col divide-y divide-border">
          <div className="flex items-start gap-2.5 py-2.5 first:pt-0">
            <ArrowUpRight
              aria-hidden="true"
              strokeWidth={2}
              className="mt-1 size-3.5 shrink-0 text-foreground-muted"
            />
            <div>
              <dt className="text-xs font-medium text-foreground">Tanda +</dt>
              <dd className="text-xs leading-5 text-foreground-muted">
                Kewajiban bertambah, misalnya dana yang dicairkan ke kampus.
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2.5 py-2.5 last:pb-0">
            <ArrowDownLeft
              aria-hidden="true"
              strokeWidth={2}
              className="mt-1 size-3.5 shrink-0 text-success"
            />
            <div>
              <dt className="text-xs font-medium text-foreground">Tanda −</dt>
              <dd className="text-xs leading-5 text-foreground-muted">
                Kewajiban berkurang karena pembayaran yang sudah diverifikasi.
              </dd>
            </div>
          </div>
        </dl>
      </CardContent>
      <CardContent className="border-border border-t pt-3">
        <p className="text-2xs leading-4 text-foreground-subtle">
          Catatan ini tidak bisa diubah atau dihapus. Kalau ada angka yang
          terasa janggal, hubungi kami lewat halaman pengaduan.
        </p>
      </CardContent>
    </Card>
  );
}

export default async function RiwayatPage() {
  const entries = await getMyLedgerHistory();
  const groups = groupByMonth(entries);

  return (
    <PageShell
      title="Riwayat"
      description="Semua pergerakan uang dalam pembiayaanmu — berurutan, tanpa yang disembunyikan."
    >
      {entries.length === 0 ? (
        <EmptyState
          className="rounded-xl border border-border border-dashed bg-surface"
          icon={Landmark}
          title="Belum ada catatan"
          description="Riwayat terisi begitu pembiayaanmu dicairkan ke kampus. Setiap baris muncul dengan waktu dan nilainya."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <section className="flex min-w-0 flex-col gap-5">
            <SummaryCard entries={entries} />
            {groups.map((group) => (
              <section key={group.month} className="flex flex-col gap-2">
                <h2 className="text-2xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
                  {group.month}
                </h2>
                <Card className="gap-0 shadow-none">
                  <CardContent>
                    <ul className="divide-y divide-border">
                      {group.entries.map((entry) => (
                        <EntryRow key={entry.id} entry={entry} />
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>
            ))}
          </section>
          <aside className="flex flex-col gap-4">
            <LedgerNotesCard />
          </aside>
        </div>
      )}
    </PageShell>
  );
}
