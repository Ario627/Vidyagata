import { Bell } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { PageShell } from "@/components/app/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  type AppNotification,
  getMyNotifications,
  type NotificationTone,
} from "@/data/notifications";
import { formatInstantWib } from "@/lib/format/date";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Notifikasi",
  description:
    "Pengingat jatuh tempo, kabar pembayaran, dan hasil seleksi kerjamu.",
};

export const instant = false;

const TONE_META: Readonly<
  Record<
    NotificationTone,
    {
      readonly label: string;
      readonly variant: "neutral" | "info" | "success" | "warning" | "danger";
      readonly dot: string;
    }
  >
> = {
  info: { label: "Info", variant: "info", dot: "bg-info-500" },
  success: { label: "Selesai", variant: "success", dot: "bg-success-500" },
  warning: { label: "Pengingat", variant: "warning", dot: "bg-warning-500" },
  danger: { label: "Perlu tindakan", variant: "danger", dot: "bg-danger-500" },
};

const FILTERS = [
  { key: "semua", label: "Semua" },
  { key: "danger", label: "Perlu tindakan" },
  { key: "warning", label: "Pengingat" },
  { key: "success", label: "Selesai" },
  { key: "info", label: "Info" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function isFilterKey(value: string): value is FilterKey {
  return FILTERS.some((filter) => filter.key === value);
}

function NotificationCard({ item }: { readonly item: AppNotification }) {
  const meta = TONE_META[item.tone];
  return (
    <div className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
      <span
        aria-hidden="true"
        className={cn("mt-1.5 size-2 shrink-0 rounded-full", meta.dot)}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold leading-5 text-foreground">
            {item.title}
          </p>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
        <p className="text-sm leading-6 text-foreground-muted">
          {item.description}
        </p>
        <p className="text-2xs text-foreground-subtle">
          {formatInstantWib(item.occurredAt)}
        </p>
      </div>
    </div>
  );
}

export default async function NotifikasiPage({
  searchParams,
}: PageProps<"/notifikasi">) {
  const params = await searchParams;
  const raw = Array.isArray(params.tone) ? params.tone[0] : params.tone;
  const active: FilterKey =
    raw !== undefined && isFilterKey(raw) ? raw : "semua";
  const notifications = await getMyNotifications();
  const filtered =
    active === "semua"
      ? notifications
      : notifications.filter((item) => item.tone === active);

  return (
    <PageShell
      title="Notifikasi"
      description="Pengingat jatuh tempo, kabar pembayaran, dan hasil seleksi kerjamu terkumpul di sini."
    >
      <AutoRefresh />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <section className="flex min-w-0 flex-col gap-4">
          <fieldset className="min-w-0">
            <legend className="sr-only">Filter notifikasi</legend>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {FILTERS.map((filter) => {
                const selected = filter.key === active;
                return (
                  <Link
                    key={filter.key}
                    href={
                      filter.key === "semua"
                        ? ("/notifikasi" as const)
                        : (`/notifikasi?tone=${filter.key}` as const)
                    }
                    aria-current={selected ? "page" : undefined}
                    className={cn(
                      "inline-flex h-8 shrink-0 items-center rounded-lg border px-3 text-xs font-medium transition-colors duration-150 ease-out",
                      selected
                        ? "border-primary bg-primary-subtle text-primary-hover"
                        : "border-border bg-surface text-foreground-muted hover:border-border-strong",
                    )}
                  >
                    {filter.label}
                  </Link>
                );
              })}
            </div>
          </fieldset>
          {filtered.length === 0 ? (
            <EmptyState
              className="rounded-xl border border-border border-dashed bg-surface"
              icon={Bell}
              title={
                notifications.length === 0
                  ? "Belum ada notifikasi"
                  : "Tidak ada notifikasi di kategori ini"
              }
              description={
                notifications.length === 0
                  ? "Pengingat jatuh tempo, keputusan pengajuan, dan kabar lamaran kerja akan muncul di halaman ini."
                  : "Pilih kategori lain atau kembali ke semua notifikasi."
              }
            />
          ) : (
            <Card className="gap-0 shadow-none">
              <CardContent>
                <div className="divide-y divide-border">
                  {filtered.map((item) => (
                    <NotificationCard key={item.id} item={item} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>
        <aside className="flex flex-col gap-4">
          <Card className="gap-0 shadow-none">
            <CardContent className="pb-3">
              <h2 className="text-sm font-semibold text-foreground">
                Cara kerja notifikasi
              </h2>
            </CardContent>
            <CardContent className="flex flex-col gap-2 text-xs leading-5 text-foreground-muted">
              <p>
                Notifikasi diturunkan dari data pembiayaan dan lamaranmu, bukan
                dari pesan yang bisa dihapus. Selama datanya berubah, kabarnya
                ikut menyesuaikan.
              </p>
              <p>
                Kategori “Perlu tindakan” berarti ada pembayaran ditolak atau
                cicilan lewat jatuh tempo. Buka halaman Tagihan untuk
                menyelesaikannya.
              </p>
              <p className="text-2xs text-foreground-subtle">
                Halaman ini menyegarkan diri saat kamu kembali ke tab ini.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
