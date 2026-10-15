import type { Metadata, Route } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/auth/onboarding/onboarding-flow";
import { hasActiveAgeBan } from "@/lib/age-ban";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Daftar",
  description:
    "Buat akun Vidyagata dengan email, username, dan kata sandi, lalu lengkapi data dirimu.",
};

export const instant = false;

export default async function DaftarPage() {
  const user = await getCurrentUser();
  if (user !== null) {
    redirect("/dashboard");
  }
  if (await hasActiveAgeBan(await headers())) {
    redirect("/daftar/usia-belum-cukup" as Route);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Buat akun Vidyagata
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Datamu hanya dipakai untuk memverifikasi kelayakan dan kamu selalu
          bisa melihat sedang di tahap mana.
        </p>
      </header>
      <OnboardingFlow />
      <p className="text-sm text-foreground-muted">
        Sudah punya akun?{" "}
        <Link
          href="/masuk"
          className="font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
        >
          Masuk
        </Link>
      </p>
    </div>
  );
}
