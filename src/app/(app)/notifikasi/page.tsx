import { Bell } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Notifikasi",
  description:
    "Pengingat jatuh tempo, kabar pengajuan, dan hasil seleksi kerjamu.",
};

export default function NotifikasiPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        title="Notifikasi"
        description="Kabar penting soal pembiayaan dan kerjamu terkumpul di sini."
      />
      <EmptyState
        className="mt-6"
        icon={Bell}
        title="Belum ada notifikasi"
        description="Pengingat jatuh tempo, keputusan pengajuan, dan kabar lamaran kerja akan muncul di halaman ini."
      />
    </main>
  );
}