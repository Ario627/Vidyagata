import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Atur ulang kata sandi",
  description: "Buat kata sandi baru untuk akun Vidyagata-mu.",
};

export const instant = false;

const MINIMUM_TOKEN_LENGTH = 16;

export default async function SandiBaruPage({
  searchParams,
}: PageProps<"/lupa-akses/sandi-baru">) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;

  if (
    params.error !== undefined ||
    token === null ||
    token.length < MINIMUM_TOKEN_LENGTH
  ) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Tautan tidak berlaku
          </h1>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Tautan atur ulang ini sudah kedaluwarsa atau sudah pernah dipakai.
            Minta tautan baru supaya bisa membuat kata sandi baru.
          </p>
        </header>
        <Link
          href="/lupa-akses"
          className="text-sm font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
        >
          Minta tautan atur ulang baru
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Buat kata sandi baru
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Setelah disimpan, semua sesi lama di perangkat lain otomatis dicabut.
        </p>
      </header>
      <ResetPasswordForm token={token} />
    </div>
  );
}