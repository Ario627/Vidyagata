import { Banknote, Briefcase, History, Landmark } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Riwayat",
  description:
    "Catatan pencairan, pembayaran cicilan, dan potongan penghasilanmu.",
};

const ENTRY_TYPES = [
  {
    icon: Landmark,
    title: "Pencairan ke kampus",
    description:
      "Dana VidyaFund dikirim langsung ke rekening institusi, bukan ke rekening pribadi.",
  },
  {
    icon: Banknote,
    title: "Pembayaran cicilan",
    description:
      "Setiap cicilan yang kamu bayar, lengkap dengan waktu dan buktinya.",
  },
  {
    icon: Briefcase,
    title: "Potongan penghasilan",
    description:
      "Cicilan yang dipotong dari penghasilan kerja part-time-mu, sesuai mandat yang kamu tanda tangani.",
  },
] as const;

function EntriesInfoCard() {
  return (
    <Card className="mt-6">
      <CardContent>
        <CardTitle>Yang akan tercatat di sini</CardTitle>
      </CardContent>
      <CardContent>
        <ul className="flex flex-col">
          {ENTRY_TYPES.map((entry) => (
            <li
              key={entry.title}
              className="flex items-start gap-3 border-border border-t py-3 first:border-t-0 first:pt-0 last:pb-0"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-raised">
                <entry.icon
                  aria-hidden="true"
                  strokeWidth={1.8}
                  className="size-4 text-foreground-muted"
                />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {entry.title}
                </span>
                <span className="text-xs text-foreground-muted">
                  {entry.description}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardContent className="border-border border-t pt-4">
        <p className="text-2xs text-foreground-subtle">
          Sekali tercatat, baris di sini tidak bisa diubah atau dihapus — kamu
          selalu bisa menelusuri setiap rupiah.
        </p>
      </CardContent>
    </Card>
  );
}

export default function RiwayatPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        title="Riwayat"
        description="Semua pergerakan uang dalam pembiayaanmu — berurutan, tanpa yang disembunyikan."
      />
      <EmptyState
        className="mt-6"
        icon={History}
        title="Belum ada catatan"
        description="Riwayat terisi begitu pembiayaanmu dicairkan ke kampus. Setiap baris muncul dengan waktu dan nilainya."
      />
      <EntriesInfoCard />
    </main>
  );
}
