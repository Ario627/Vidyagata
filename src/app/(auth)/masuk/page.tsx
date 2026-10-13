import type { Metadata } from "next";
import Link from "next/link";
import { PhoneOtpFlow } from "@/components/auth/phone-otp-flow";
import { OTP_RESEND_COOLDOWN_MS, OTP_TTL_MS } from "@/lib/crypto/otp";

export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: "Masuk",
  description:
    "Masuk ke Vidyagata dengan nomor HP. Kode verifikasi dikirim lewat SMS dan berlaku lima menit.",
};

export default function MasukPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Masuk ke Vidyagata
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Masukkan nomor HP kamu. Kalau nomor itu belum pernah dipakai, akun
          baru langsung dibuat dan kamu masuk ke dashboard.
        </p>
      </header>
      <PhoneOtpFlow
        mode="masuk"
        resendCooldownSeconds={OTP_RESEND_COOLDOWN_MS / 1000}
        ttlMinutes={OTP_TTL_MS / 60_000}
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