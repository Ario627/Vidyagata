import type { Metadata } from "next";
import { ClockSkewNotice } from "@/components/account/clock-skew-notice";
import { PageHeader } from "@/components/app/page-header";
import { TwoFactorSetup } from "@/components/operator/two-factor-setup";
import { requireRole } from "@/data/dal";
import { isTwoFactorEnabled } from "@/data/two-factor";

export const metadata: Metadata = {
  title: "Keamanan akun",
  description: "Aktifkan verifikasi dua langkah untuk akun operator Vidyagata.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function OperatorSecurityPage() {
  const actor = await requireRole("operator");
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-6">
      <PageHeader
        eyebrow="Operator"
        title="Keamanan akun"
        description="Verifikasi dua langkah opsional sepenuhnya: nyalakan kalau kamu mau lapisan ekstra, dan matikan lagi kapan saja tanpa izin siapa pun."
      />
      <ClockSkewNotice serverNow={new Date().toISOString()} />
      <TwoFactorSetup
        enabled={await isTwoFactorEnabled(actor.id)}
        scope="operator"
      />
    </main>
  );
}
