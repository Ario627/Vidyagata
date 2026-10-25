import { GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import { PageShell } from "@/components/app/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getMyStudentIdentity } from "@/data/students";

export const metadata: Metadata = {
  title: "Performa",
  description:
    "IPK dan prestasi akademikmu — dasar diskon cicilan VidyAppreciate.",
};

export const instant = false;

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

function formatGpa(hundredths: number): string {
  return (hundredths / 100).toFixed(2).replace(".", ",");
}

function HowItWorksCard() {
  return (
    <Card className="gap-0 shadow-none">
      <CardContent className="flex items-start justify-between gap-3 pb-3">
        <CardTitle>Cara kerja VidyAppreciate</CardTitle>
        <Badge variant="neutral">Belum aktif</Badge>
      </CardContent>
      <CardContent>
        <ol className="flex flex-col">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-3 border-border border-t py-3 first:border-t-0 first:pt-0 last:pb-0"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-surface-raised text-2xs font-semibold text-foreground-muted">
                {index + 1}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {step.title}
                </span>
                <span className="text-xs leading-5 text-foreground-muted">
                  {step.description}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
      <CardContent className="border-border border-t pt-3">
        <p className="text-2xs leading-4 text-foreground-subtle">
          Tidak ada potongan atau kenaikan biaya yang bergantung pada performa
          akademik. Diskon hanya bisa mengurangi, tidak pernah menambah.
        </p>
      </CardContent>
    </Card>
  );
}

export default async function PerformaPage() {
  const identity = await getMyStudentIdentity();
  const gpa =
    identity?.profile.gpaHundredths === null ||
    identity?.profile.gpaHundredths === undefined
      ? null
      : identity.profile.gpaHundredths;

  return (
    <PageShell
      eyebrow="VidyAppreciate"
      title="Performa"
      description="IPK dan prestasi akademikmu menentukan diskon cicilan. Tidak ada potongan lain yang bergantung padanya."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          {gpa === null ? (
            <EmptyState
              className="rounded-xl border border-border border-dashed bg-surface"
              icon={GraduationCap}
              title="Belum ada data performa"
              description="Lengkapi profil akademikmu dulu. Setelah kampus memverifikasi, IPK dan prestasimu muncul di sini."
            />
          ) : (
            <Card className="gap-0 shadow-none">
              <CardContent className="pb-2">
                <CardTitle>IPK tercatat</CardTitle>
              </CardContent>
              <CardContent className="flex flex-wrap items-end justify-between gap-4">
                <p className="text-[2.5rem] font-semibold leading-none tracking-[-0.04em] text-foreground tabular-nums">
                  {formatGpa(gpa)}
                </p>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="neutral">Menunggu ambang</Badge>
                  <p className="text-2xs text-foreground-subtle">
                    {identity?.institutionName ?? "Kampus belum dipilih"}
                  </p>
                </div>
              </CardContent>
              <CardContent className="border-border border-t pt-3">
                <p className="text-xs leading-5 text-foreground-muted">
                  Ambang diskon untuk angkatanmu belum ditetapkan. Kalau sudah,
                  angkanya akan tampil di sini sebelum berlaku — kamu tidak
                  perlu menebak.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        <aside className="flex flex-col gap-4">
          <HowItWorksCard />
        </aside>
      </div>
    </PageShell>
  );
}
