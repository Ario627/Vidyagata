import {
  ArrowRight,
  ClipboardCheck,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageShell } from "@/components/app/page-shell";
import { FacilityCard } from "@/components/financing/facility-card";
import { hasActiveFacility } from "@/components/financing/labels";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { listMyFacilities } from "@/data/financing";
import { listInstitutionOptions } from "@/data/institutions";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Pembiayaan",
  description:
    "Pengajuan VidyaFund-mu — dari draf sampai lunas, semuanya terlihat.",
};

export const instant = false;

const STEPS = [
  {
    icon: ClipboardCheck,
    title: "Ajukan",
    description:
      "Pilih kampus, isi nominal dan tujuan. Progres tersimpan otomatis.",
  },
  {
    icon: ShieldCheck,
    title: "Ditinjau",
    description:
      "Petugas memeriksa kelengkapan dan kelayakan. Kamu bisa melihat setiap tahap.",
  },
  {
    icon: FileCheck2,
    title: "Cair ke kampus",
    description:
      "Dana dikirim ke rekening institusi, lalu jadwal cicilan aktif otomatis.",
  },
] as const;

export default async function PembiayaanPage() {
  await requireUser();
  const facilities = await listMyFacilities();
  const institutions = await listInstitutionOptions();
  const institutionNames = new Map(
    institutions.map((institution) => [institution.id, institution.name]),
  );
  const hasActive = facilities.some((facility) =>
    hasActiveFacility(facility.status),
  );
  const activeCount = facilities.filter((facility) =>
    hasActiveFacility(facility.status),
  ).length;

  return (
    <PageShell
      eyebrow="VidyaFund"
      title="Pembiayaan"
      description="Semua pengajuanmu di satu tempat — statusnya selalu jujur, tanpa istilah yang menyamarkan."
      actions={
        hasActive ? null : (
          <Link
            href={"/pembiayaan/ajukan" as Route}
            className={buttonVariants({ size: "md" })}
          >
            Ajukan pembiayaan
          </Link>
        )
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-2xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
              Daftar pengajuan
            </h2>
            <span className="text-2xs text-foreground-subtle">
              {facilities.length} total
              {activeCount === 0 ? "" : ` · ${activeCount} aktif`}
            </span>
          </div>
          {facilities.length === 0 ? (
            <EmptyState
              className="rounded-xl border border-border border-dashed bg-surface"
              title="Belum ada pengajuan"
              description="Pengajuan pertamamu akan muncul di sini bersama statusnya."
              action={
                <Link
                  href={"/pembiayaan/ajukan" as Route}
                  className={buttonVariants({ size: "md" })}
                >
                  Mulai pengajuan
                </Link>
              }
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {facilities.map((facility) => (
                <li key={facility.id}>
                  <FacilityCard
                    facility={facility}
                    institutionName={
                      facility.institutionId === null
                        ? null
                        : (institutionNames.get(facility.institutionId) ?? null)
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-4">
          <Card className="gap-0 shadow-none">
            <CardContent className="pb-3">
              <CardTitle>Alur pengajuan</CardTitle>
            </CardContent>
            <CardContent>
              <ol className="flex flex-col">
                {STEPS.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex gap-3 border-border border-t py-3 first:border-t-0 first:pt-0 last:pb-0"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                      <step.icon
                        aria-hidden="true"
                        strokeWidth={1.8}
                        className="size-4"
                      />
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-xs font-semibold text-foreground">
                        {index + 1}. {step.title}
                      </span>
                      <span className="text-xs leading-5 text-foreground-muted">
                        {step.description}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
          <Card className="gap-0 border-primary/20 bg-primary-subtle shadow-none">
            <CardContent className="flex flex-col gap-1 pb-3">
              <CardTitle className="text-brand-900">
                Belum yakin nominalnya?
              </CardTitle>
              <p className="text-xs leading-5 text-brand-800">
                Simulasi tanpa daftar: lihat cicilan bulanan dan total biaya
                sebelum mengajukan.
              </p>
            </CardContent>
            <CardContent>
              <Link
                href={"/cek-kelayakan" as Route}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                Hitung estimasi
                <ArrowRight
                  aria-hidden="true"
                  strokeWidth={2}
                  className="size-3.5"
                />
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
