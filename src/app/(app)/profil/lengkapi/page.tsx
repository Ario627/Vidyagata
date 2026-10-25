import type { Metadata, Route } from "next";
import Link from "next/link";
import {
  type StudentProfileDefaults,
  StudentProfileForm,
} from "@/components/account/student-profile-form";
import { PageShell } from "@/components/app/page-shell";
import { listInstitutionOptions } from "@/data/institutions";
import { getMyStudentIdentity } from "@/data/students";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Lengkapi profil",
  description:
    "Lengkapi data akademik dan data dirimu supaya pengajuan pembiayaan bisa diproses.",
};

export const instant = false;

function defaultsOf(
  identity: Awaited<ReturnType<typeof getMyStudentIdentity>>,
): StudentProfileDefaults | undefined {
  if (identity === null) return undefined;
  const profile = identity.profile;
  return {
    fullName: profile.fullName,
    academicStatus: profile.academicStatus,
    institutionId: profile.institutionId,
    currentSemester: profile.currentSemester,
    gpaHundredths: profile.gpaHundredths,
    province: profile.province,
    city: profile.city,
    addressLine: profile.addressLine ?? null,
    hobby: profile.hobby ?? null,
    bio: profile.bio ?? null,
  };
}

export default async function LengkapiProfilPage() {
  await requireUser();
  const identity = await getMyStudentIdentity();
  const institutions = await listInstitutionOptions();

  return (
    <PageShell
      eyebrow="Profil"
      title={identity === null ? "Lengkapi profil" : "Perbarui profil"}
      description="Data ini dipakai untuk menilai kelayakan pembiayaan, membuat surat pernyataan, dan mencocokkan lowongan kerja yang cocok untukmu."
      className="max-w-3xl"
    >
      <StudentProfileForm
        institutions={institutions}
        defaults={defaultsOf(identity)}
        afterSavePath={"/profil" as Route}
        submitLabel="Simpan profil"
      />
      <p className="mt-6 text-sm text-foreground-muted">
        <Link
          href={"/profil" as Route}
          className="font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
        >
          Kembali ke profil
        </Link>
      </p>
    </PageShell>
  );
}
