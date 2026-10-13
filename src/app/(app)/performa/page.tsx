import { GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Performa",
  description:
    "IPK dan prestasi akademikmu — dasar diskon cicilan VidyAppreciate.",
};

const STEPS = [
  {
    title: "Nilai diverifikasi",
    description:
      "Tim kampus memverifikasi IPK dan prestasimu. Di tahap awal, verifikasi berjalan manual.",
  },
  {
    title: "Ambang terpenuhi",
    description:
      "Diskon berlaku saat performamu melewati ambang yang ditetapkan. Ambangnya selalu ditampilkan terbuka, tanpa syarat tersembunyi.",
  },
  {
    title: "Diskon masuk cicilan",
    description:
      "Pengurangannya tercatat sebagai baris tersendiri di tagihanmu — bukan janji lisan.",
  },
] as const;

function HowItWorksCard() {
  return (
    <Card className="mt-6">
      <CardContent className="flex items-start justify-between gap-3">
        <CardTitle>Cara kerja VidyAppreciate</CardTitle>
        <Badge variant="neutral">Belum aktif</Badge>
      </CardContent>
      <CardContent>
        <ol className="flex flex-col">
          {STEPS.map((step) => (
            <li
              key={step.title}
              className="flex flex-col gap-0.5 border-border border-t py-3 first:border-t-0 first:pt-0 last:pb-0"
            >
              <span className="text-sm font-medium text-foreground">
                {step.title}
              </span>
              <span className="text-xs text-foreground-muted">
                {step.description}
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export default function PerformaPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        eyebrow="VidyAppreciate"
        title="Performa"
        description="IPK dan prestasi akademikmu menentukan diskon cicilan. Tidak ada potongan lain yang bergantung padanya."
      />
      <EmptyState
        className="mt-6"
        icon={GraduationCap}
        title="Belum ada data performa"
        description="Data akademikmu muncul setelah kamu terdaftar dan verifikasi dibuka untuk kampusmu."
      />
      <HowItWorksCard />
    </main>
  );
}
