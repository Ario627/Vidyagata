import { ShieldCheck } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { signOutAction } from "@/app/(app)/session-actions";
import { ProfileDocuments } from "@/components/account/profile-documents";
import { PageShell } from "@/components/app/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { getMyDocuments, getMyStatement } from "@/data/documents";
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
    <Card className="gap-0 shadow-none">
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
    <Card className="gap-0 shadow-none">
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
    <Card className="gap-0 shadow-none">
      <CardContent>
        <CardTitle>Identitas akademik</CardTitle>
      </CardContent>
      {identity === null ? (
        <CardContent className="flex flex-col items-start gap-3">
          <p className="text-xs leading-5 text-foreground-muted">
            Profil akademikmu belum terisi. Lengkapi dulu — datanya dipakai
            untuk menilai kelayakan pembiayaan dan membuat surat pernyataan.
          </p>
          <Link
            href={"/profil/lengkapi" as Route}
            className={cn(buttonVariants({ size: "md" }))}
          >
            Lengkapi profil
          </Link>
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
            {identity.profile.hobby === null ? null : (
              <InfoRow label="Hobi" value={identity.profile.hobby} />
            )}
          </dl>
          {identity.profile.bio === null ? null : (
            <p className="mt-3 text-sm leading-6 text-foreground-muted">
              {identity.profile.bio}
            </p>
          )}
          <div className="mt-4">
            <Link
              href={"/profil/lengkapi" as Route}
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
              )}
            >
              Perbarui profil
            </Link>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

async function DocumentsCard() {
  const [documents, statement, identity] = await Promise.all([
    getMyDocuments(),
    getMyStatement(),
    getMyStudentIdentity(),
  ]);
  const statementSigned = statement !== null && statement.signedAt !== null;
  const canUpload = identity !== null;
  return (
    <Card className="gap-0 shadow-none">
      <CardContent>
        <CardTitle>Dokumen & surat</CardTitle>
      </CardContent>
      {canUpload ? (
        <CardContent>
          <ProfileDocuments documents={documents} />
        </CardContent>
      ) : (
        <CardContent>
          <p className="text-xs leading-5 text-foreground-muted">
            Lengkapi profil akademik dulu supaya bisa mengunggah dokumen.
          </p>
        </CardContent>
      )}
      <CardContent className="flex items-center justify-between gap-3 border-border border-t pt-4">
        <span className="text-sm text-foreground">Surat pernyataan</span>
        <Badge variant={statementSigned ? "success" : "warning"}>
          {statement === null
            ? "Belum dibuat"
            : statementSigned
              ? "Ditandatangani"
              : "Belum ditandatangani"}
        </Badge>
      </CardContent>
      <CardContent className="pt-0">
        <Link
          href={"/profil/surat-pernyataan" as Route}
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
        >
          Buka surat pernyataan
        </Link>
      </CardContent>
    </Card>
  );
}

function SignOutCard() {
  return (
    <Card className="gap-0 shadow-none">
      <CardContent className="pb-3">
        <CardTitle>Sesi perangkat</CardTitle>
      </CardContent>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs leading-5 text-foreground-muted">
          Keluar dari perangkat ini. Kalau kamu merasa pernah masuk dari
          perangkat lain, ganti kata sandi lewat halaman lupa akses.
        </p>
        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-lg border border-border-strong bg-surface px-3 text-sm font-medium text-foreground transition-colors duration-150 ease-out hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Keluar dari akun
          </button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ProfilPage() {
  return (
    <PageShell
      eyebrow="Akun"
      title="Profil"
      description="Identitas, keamanan, dan pengaturan datamu terkumpul di sini."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <IdentityCard />
          <DocumentsCard />
        </div>
        <aside className="flex min-w-0 flex-col gap-4">
          <SecurityCard />
          <DataRightsCard />
          <SignOutCard />
        </aside>
      </div>
    </PageShell>
  );
}
