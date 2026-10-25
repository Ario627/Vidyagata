import { Briefcase, CalendarClock, Compass } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/app/page-shell";
import { Mascot } from "@/components/brand/brand";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Mbak Vidya",
  description: "Pembimbing AI yang siap membantumu job-matching.",
};

const CAPABILITIES = [
  {
    icon: CalendarClock,
    title: "Cocokkan kerja dengan jadwal kuliahmu",
    description:
      "Lowongan yang jam kerjanya tidak bentrok dengan kelas dan ujianmu.",
  },
  {
    icon: Compass,
    title: "Tunjukkan skill yang perlu ditingkatkan",
    description: "Berdasarkan lowongan yang benar-benar kamu incar.",
  },
  {
    icon: Briefcase,
    title: "Antarkan sampai kerja pertamamu",
    description: "Dari rekomendasi sampai lamaran — langkah demi langkah.",
  },
] as const;

function WelcomeCard() {
  return (
    <Card className="mt-6">
      <CardContent className="flex items-start gap-3">
        <Mascot
          name="sapa"
          sizes="56px"
          className="mascot-float h-12 w-auto shrink-0"
        />
        <p className="text-sm leading-6 text-foreground">
          Halo! Aku Mbak Vidya. Nanti aku bantu kamu menemukan kerja part-time
          yang cocok dengan jadwal dan skill-mu.
        </p>
      </CardContent>
    </Card>
  );
}

function CapabilityCard() {
  return (
    <Card className="mt-4">
      <CardContent>
        <CardTitle>Yang bisa Mbak Vidya bantu</CardTitle>
      </CardContent>
      <CardContent>
        <ul className="flex flex-col">
          {CAPABILITIES.map((capability) => (
            <li
              key={capability.title}
              className="flex items-start gap-3 border-border border-t py-3 first:border-t-0 first:pt-0 last:pb-0"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-raised">
                <capability.icon
                  aria-hidden="true"
                  strokeWidth={1.8}
                  className="size-4 text-foreground-muted"
                />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {capability.title}
                </span>
                <span className="text-xs text-foreground-muted">
                  {capability.description}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function MbakVidyaPage() {
  return (
    <PageShell
      title="Mbak Vidya"
      description="Pembimbing AI yang siap membantumu job-matching."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <WelcomeCard />
          <CapabilityCard />
          <div className="flex flex-wrap gap-2">
            <Link href="/kerja" className={buttonVariants()}>
              Lihat katalog kerja
            </Link>
            <Link
              href="/cek-kelayakan"
              className={buttonVariants({ variant: "secondary" })}
            >
              Hitung cicilan
            </Link>
          </div>
          <p className="px-1 text-2xs text-foreground-subtle">
            Mbak Vidya masih disiapkan. Saat aktif, halaman ini menjadi ruang
            percakapanmu.
          </p>
        </div>
        <aside className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6">
          <Mascot
            name="sapa"
            sizes="(min-width: 1024px) 240px, 180px"
            className="mascot-float h-48 w-auto"
          />
          <p className="text-center text-xs leading-5 text-foreground-muted">
            Nanti di sini kamu bisa ngobrol langsung, minta rekomendasi
            lowongan, dan menyusun rencana cicilan.
          </p>
        </aside>
      </div>
    </PageShell>
  );
}
