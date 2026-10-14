import { ShieldCheck } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { getMyStudentIdentity } from "@/data/students";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Profil",
  description:
    "Profil, verifikasi identitas, dan pengaturan data pribadimu di Vidyagata.",
};

const DATA_RIGHTS = [
  {
    title: "Unduh data pribadimu",
    description:
      "Kamu bisa meminta salinan data pribadi yang kami simpan, kapan saja.",
  },
  {
    title: "Hapus data pribadimu",
    description:
      "Kamu bisa meminta penghapusan data pribadi. Catatan keuangan tetap kami simpan sesuai kewajiban hukum, tetapi tidak lagi terhubung ke identitasmu.",
  },
] as const;

function DataRightsCard() {
  return (
    <Card className="mt-6">
      <CardContent className="flex items-center gap-2">
        <ShieldCheck
          aria-hidden="true"
          strokeWidth={1.8}
          className="size-4 shrink-0 text-foreground-muted"
        />
        <CardTitle>Hakmu atas data pribadi</CardTitle>
      </CardContent>
      <CardContent>
        <dl className="flex flex-col">
          {DATA_RIGHTS.map((right) => (
            <div
              key={right.title}
              className="flex flex-col gap-0.5 border-border border-t py-3 first:border-t-0 first:pt-0 last:pb-0"
            >
              <dt className="text-sm font-medium text-foreground">
                {right.title}
              </dt>
              <dd className="text-xs text-foreground-muted">
                {right.description}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function SecurityCard() {
  return (
    <Card className="mt-6">
      <CardContent>
        <CardTitle>Keamanan akun</CardTitle>
      </CardContent>
      <CardContent className="flex items-center justify-between gap-3">
        <p className="text-xs leading-5 text-foreground-muted">
          Aktifkan verifikasi dua langkah supaya kata sandi saja tidak cukup
          untuk masuk.
        </p>
        <Link
          href={"/profil/keamanan" as Route}
          className={cn(buttonVariants({ variant: "secondary" }), "shrink-0")}
        >
          Buka
        </Link>
      </CardContent>
    </Card>
  );
}

const ACADEMIC_STATUS_LABELS: Readonly<Record<string, string>> = {
  high_school: "SMA/SMK",
  undergraduate: "Mahasiswa aktif",
  graduated: "Sudah lulus",
  dropout: "Berhenti kuliah",
};

function InfoRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-sm text-foreground-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

function formatGpa(hundredths: number): string {
  return (hundredths / 100).toFixed(2).replace(".", ",");
}

async function IdentityCard() {
  const identity = await getMyStudentIdentity();
  return (
    <Card className="mt-6">
      <CardContent>
        <CardTitle>Identitas akademik</CardTitle>
      </CardContent>
      {identity === null ? (
        <CardContent>
          <p className="text-xs leading-5 text-foreground-muted">
            Profil akademikmu dibuat otomatis saat kamu mengajukan pembiayaan —
            nama, kampus, semester, dan IPK ikut terisi dari sana.
          </p>
        </CardContent>
      ) : (
        <CardContent>
          <dl className="flex flex-col divide-y divide-border">
            <InfoRow label="Nama" value={identity.profile.fullName} />
            <InfoRow
              label="Kampus"
              value={identity.institutionName ?? "Belum dipilih"}
            />
            <InfoRow
              label="Status"
              value={
                ACADEMIC_STATUS_LABELS[identity.profile.academicStatus] ??
                identity.profile.academicStatus
              }
            />
            <InfoRow
              label="Semester"
              value={
                identity.profile.currentSemester === null
                  ? "Belum diisi"
                  : String(identity.profile.currentSemester)
              }
            />
            <InfoRow
              label="IPK"
              value={
                identity.profile.gpaHundredths === null
                  ? "Belum diisi"
                  : formatGpa(identity.profile.gpaHundredths)
              }
            />
            <InfoRow
              label="Domisili"
              value={`${identity.profile.city}, ${identity.profile.province}`}
            />
          </dl>
        </CardContent>
      )}
    </Card>
  );
}

export default function ProfilPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        eyebrow="Akun"
        title="Profil"
        description="Identitas, keamanan, dan pengaturan datamu terkumpul di sini."
      />
      <IdentityCard />
      <SecurityCard />
      <DataRightsCard />
    </main>
  );
}
