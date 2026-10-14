import type { Metadata } from "next";
import { ClockSkewNotice } from "@/components/account/clock-skew-notice";
import { MfaExplainer } from "@/components/account/mfa-explainer";
import { PageHeader } from "@/components/app/page-header";
import { TwoFactorSetup } from "@/components/operator/two-factor-setup";
import { isTwoFactorEnabled } from "@/data/two-factor";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Keamanan akun",
  description: "Aktifkan verifikasi dua langkah supaya akunmu lebih aman.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function ProfilKeamananPage() {
  const user = await requireUser();
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        eyebrow="Akun"
        title="Keamanan akun"
        description="Tambahkan lapisan kedua: kode 6 digit dari aplikasi autentikator."
      />
      <div className="mt-2">
        <MfaExplainer />
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <ClockSkewNotice serverNow={new Date().toISOString()} />
        <TwoFactorSetup
          enabled={isTwoFactorEnabled(user.id)}
          scope="personal"
        />
      </div>
    </main>
  );
}
