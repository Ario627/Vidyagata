import type { Metadata, Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/app/page-header";
import { ApplyFlow } from "@/components/financing/apply-flow";
import { hasActiveFacility } from "@/components/financing/labels";
import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/ui/empty-state";
import { activeConsentDefinition, hasActiveConsent } from "@/data/consents";
import { getMyDraft, listMyFacilities } from "@/data/financing";
import { listInstitutionOptions } from "@/data/institutions";
import { getPilotLenderTerms } from "@/data/lenders";
import { getMyStudentProfile } from "@/data/students";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ajukan pembiayaan",
  description:
    "Ajukan VidyaFund dalam tiga langkah. Progresmu tersimpan otomatis.",
};

export const instant = false;

function Shell({ children }: { readonly children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      {children}
    </main>
  );
}

function Notice({
  title,
  description,
  action,
}: {
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
}) {
  return (
    <Shell>
      <PageHeader eyebrow="VidyaFund" title="Ajukan pembiayaan" />
      <EmptyState
        className="mt-6"
        title={title}
        description={description}
        action={action}
      />
    </Shell>
  );
}

export default async function AjukanPembiayaanPage() {
  await requireUser();
  const profile = await getMyStudentProfile();
  if (profile === null) {
    return (
      <Notice
        title="Lengkapi profil dulu"
        description="Kami butuh nama lengkap dan data akademikmu sebelum pengajuan bisa dimulai."
        action={
          <Link
            href={"/profil" as Route}
            className={cn(buttonVariants({ size: "md" }))}
          >
            Lengkapi profil
          </Link>
        }
      />
    );
  }
  const facilities = await listMyFacilities();
  if (facilities.some((facility) => hasActiveFacility(facility.status))) {
    return (
      <Notice
        title="Pengajuanmu sedang berjalan"
        description="Satu mahasiswa hanya bisa punya satu pengajuan aktif. Kamu bisa memantau statusnya di halaman pembiayaan."
        action={
          <Link
            href={"/pembiayaan" as Route}
            className={cn(buttonVariants({ size: "md" }))}
          >
            Lihat status pengajuan
          </Link>
        }
      />
    );
  }
  const terms = getPilotLenderTerms();
  const consent = activeConsentDefinition(
    "data_processing",
    new Date().toISOString(),
  );
  if (terms === null || consent === null) {
    return (
      <Notice
        title="Layanan pembiayaan belum siap"
        description="Konfigurasi mitra atau naskah persetujuan belum tersedia. Coba lagi nanti."
      />
    );
  }
  const institutions = listInstitutionOptions();
  const draft = await getMyDraft();
  const consentGranted = await hasActiveConsent("data_processing");

  return (
    <Shell>
      <PageHeader
        eyebrow="VidyaFund"
        title="Ajukan pembiayaan"
        description="Tiga langkah singkat. Progresmu tersimpan otomatis — kamu bisa lanjut kapan saja."
      />
      <ApplyFlow
        institutions={institutions}
        terms={terms}
        consent={consent}
        consentGranted={consentGranted}
        draft={
          draft === null
            ? null
            : {
                facilityId: draft.id,
                institutionId: draft.institutionId,
                requestedAmount: draft.requestedAmount,
                purpose: draft.academicPurpose,
              }
        }
      />
    </Shell>
  );
}