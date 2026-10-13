import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { FacilityCard } from "@/components/financing/facility-card";
import { hasActiveFacility } from "@/components/financing/labels";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { listMyFacilities } from "@/data/financing";
import { listInstitutionOptions } from "@/data/institutions";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pembiayaan",
  description:
    "Pengajuan VidyaFund-mu — dari draf sampai lunas, semuanya terlihat.",
};

export const instant = false;

export default async function PembiayaanPage() {
  await requireUser();
  const facilities = await listMyFacilities();
  const institutions = listInstitutionOptions();
  const institutionNames = new Map(
    institutions.map((institution) => [institution.id, institution.name]),
  );
  const hasActive = facilities.some((facility) =>
    hasActiveFacility(facility.status),
  );

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        eyebrow="VidyaFund"
        title="Pembiayaan"
        description="Semua pengajuanmu di satu tempat — statusnya selalu jujur, tanpa istilah yang menyamarkan."
      />
      {hasActive ? null : (
        <Card className="mt-6">
          <CardContent>
            <CardTitle>Ajukan pembiayaan</CardTitle>
            <CardDescription className="mt-1">
              Tiga langkah singkat: pilih kampus, isi nominal, lalu tinjau.
              Progresmu tersimpan otomatis.
            </CardDescription>
          </CardContent>
          <CardContent>
            <Link
              href={"/pembiayaan/ajukan" as Route}
              className={cn(buttonVariants({ size: "md" }), "w-full")}
            >
              Mulai pengajuan
            </Link>
          </CardContent>
        </Card>
      )}
      {facilities.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Belum ada pengajuan"
          description="Pengajuan pertamamu akan muncul di sini bersama statusnya."
        />
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
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
    </main>
  );
}