import type { Metadata } from "next";
import Link from "next/link";
import { PhoneOtpFlow } from "@/components/auth/phone-otp-flow";
import { OTP_RESEND_COOLDOWN_MS, OTP_TTL_MS } from "@/lib/crypto/otp";

export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: "Daftar",
  description:
    "Buat akun Vidyagata dengan nama dan nomor HP. Kode verifikasi dikirim lewat SMS.",
};

export default function DaftarPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Daftar akun Vidyagata
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Cukup nama dan nomor HP. Verifikasi lewat SMS, tanpa kata sandi dan
          tanpa email.
        </p>
      </header>
      <PhoneOtpFlow
        mode="daftar"
        resendCooldownSeconds={OTP_RESEND_COOLDOWN_MS / 1000}
        ttlMinutes={OTP_TTL_MS / 60_000}
      />
      <p className="text-sm text-foreground-muted">
        Sudah punya akun?{" "}
        <Link
          href="/masuk"
          className="font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
        >
          Masuk saja
        </Link>
      </p>
    </div>
  );
}