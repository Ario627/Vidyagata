import { Bell } from "lucide-react";
import type { Metadata } from "next";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  type AppNotification,
  getMyNotifications,
  type NotificationTone,
} from "@/data/notifications";
import { formatInstantWib } from "@/lib/format/date";

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
    }
  >
> = {
  info: { label: "Info", variant: "info" },
  success: { label: "Selesai", variant: "success" },
  warning: { label: "Pengingat", variant: "warning" },
  danger: { label: "Perlu tindakan", variant: "danger" },
};

function NotificationCard({ item }: { readonly item: AppNotification }) {
  const meta = TONE_META[item.tone];
  return (
    <Card>
      <CardContent className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">{item.title}</p>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
        <p className="text-sm leading-6 text-foreground-muted">
          {item.description}
        </p>
        <p className="text-2xs text-foreground-subtle">
          {formatInstantWib(item.occurredAt)}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function NotifikasiPage() {
  const notifications = await getMyNotifications();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <AutoRefresh />
      <PageHeader
        title="Notifikasi"
        description="Pengingat jatuh tempo, kabar pembayaran, dan hasil seleksi kerjamu terkumpul di sini."
      />
      {notifications.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={Bell}
          title="Belum ada notifikasi"
          description="Pengingat jatuh tempo, keputusan pengajuan, dan kabar lamaran kerja akan muncul di halaman ini."
        />
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {notifications.map((item) => (
            <NotificationCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
