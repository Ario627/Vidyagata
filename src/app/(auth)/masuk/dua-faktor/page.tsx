import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { TwoFactorForm } from "@/components/auth/two-factor-form";
import { safeNextPath } from "@/lib/next-path";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Verifikasi dua langkah",
  description:
    "Masukkan kode 6 digit dari aplikasi autentikator untuk melanjutkan masuk ke Vidyagata.",
};

export const instant = false;

export default async function DuaFaktorPage({
  searchParams,
}: PageProps<"/masuk/dua-faktor">) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const user = await getCurrentUser();
  if (user !== null) {
    redirect((nextPath ?? "/dashboard") as Route);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Verifikasi dua langkah
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Akun ini memakai verifikasi dua langkah. Buka aplikasi autentikatormu
          dan masukkan kode 6 digit yang tampil sekarang.
        </p>
      </header>
      <TwoFactorForm nextPath={nextPath} />
    </div>
  );
}
