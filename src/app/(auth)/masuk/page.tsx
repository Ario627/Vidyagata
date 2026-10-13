import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { OTP_RESEND_COOLDOWN_MS, OTP_TTL_MS } from "@/lib/crypto/otp";
import { safeNextPath } from "@/lib/next-path";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Masuk",
  description:
    "Masuk ke Vidyagata dengan nomor HP. Kode verifikasi dikirim lewat SMS dan berlaku lima menit.",
};

export const instant = false;

export default async function MasukPage({ searchParams }: PageProps<"/masuk">) {
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
          Masuk ke Vidyagata
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Masuk dengan nomor HP atau email. Nomor yang belum pernah dipakai
          langsung membuat akun baru dan membawamu ke dashboard.
        </p>
      </header>
      <SignInPanel
        resendCooldownSeconds={OTP_RESEND_COOLDOWN_MS / 1000}
        ttlMinutes={OTP_TTL_MS / 60_000}
        nextPath={nextPath}
      />
      <p className="text-sm text-foreground-muted">
        Mau mengisi nama lengkap dulu?{" "}
        <Link
          href={{ pathname: "/daftar" }}
          className="font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
        >
          Daftar akun baru
        </Link>
      </p>
    </div>
  );
}
