import type { Metadata } from "next";
import { ClockSkewNotice } from "@/components/account/clock-skew-notice";
import { PageHeader } from "@/components/app/page-header";
import { TwoFactorSetup } from "@/components/operator/two-factor-setup";
import { isTwoFactorEnabled, requireOperatorMfa } from "@/data/two-factor";

export const metadata: Metadata = {
  title: "Keamanan akun",
  description: "Aktifkan verifikasi dua langkah untuk akun operator Vidyagata.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function OperatorSecurityPage() {
  const { actor } = await requireOperatorMfa();
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-6">
      <PageHeader
        eyebrow="Operator"
        title="Keamanan akun"
        description="Semua akun operator wajib memakai verifikasi dua langkah. Antrian pengajuan hanya terbuka setelah verifikasi aktif."
      />
      <ClockSkewNotice serverNow={new Date().toISOString()} />
      <TwoFactorSetup enabled={isTwoFactorEnabled(actor.id)} scope="operator" />
    </main>
  );
}
