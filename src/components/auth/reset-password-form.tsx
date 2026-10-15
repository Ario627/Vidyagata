"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/schemas/onboarding";

type ResetPasswordFormProps = {
  readonly token: string;
};

type AuthIssue = {
  readonly code?: string | undefined;
  readonly message?: string | undefined;
};

const GENERIC_MESSAGE = "Ada gangguan di sisi kami. Coba lagi sebentar lagi.";

function resetIssueMessage(issue: AuthIssue): string {
  switch (issue.code) {
    case "INVALID_TOKEN":
      return "Tautan ini tidak valid atau sudah kedaluwarsa. Minta tautan baru dari halaman lupa kata sandi.";
    case "PASSWORD_COMPROMISED":
      return "Kata sandi ini pernah bocor di kebocoran data lain. Pakai kata sandi lain yang belum pernah dipakai di layanan mana pun.";
    case "PASSWORD_TOO_SHORT":
      return `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter.`;
    case "PASSWORD_TOO_LONG":
      return `Kata sandi maksimal ${PASSWORD_MAX_LENGTH} karakter.`;
    case "TOO_MANY_REQUESTS":
      return "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.";
    default:
      return issue.message ?? GENERIC_MESSAGE;
  }
}

function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(
    null,
  );
  const [formIssue, setFormIssue] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || done) return;
    const shortPassword =
      password.length < PASSWORD_MIN_LENGTH
        ? `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter`
        : password.length > PASSWORD_MAX_LENGTH
          ? `Kata sandi maksimal ${PASSWORD_MAX_LENGTH} karakter`
          : null;
    const mismatch =
      confirmation === password ? null : "Ulangi kata sandi yang sama";
    setPasswordError(shortPassword);
    setConfirmationError(mismatch);
    if (shortPassword !== null || mismatch !== null) return;
    setFormIssue(null);
    setPending(true);
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setPending(false);
    if (error) {
      setFormIssue(resetIssueMessage(error));
      return;
    }
    setPassword("");
    setConfirmation("");
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <p className="text-sm font-semibold text-foreground">
          Kata sandi baru tersimpan
        </p>
        <p className="text-sm leading-6 text-foreground-muted">
          Semua sesi lama di perangkat lain sudah dicabut. Masuk lagi dengan
          kata sandi baru untuk melanjutkan.
        </p>
        <Button render={<Link href="/masuk" />} size="lg" className="w-full">
          Masuk sekarang
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <TextField
        label="Kata sandi baru"
        name="new-password"
        type="password"
        autoComplete="new-password"
        placeholder={`Minimal ${PASSWORD_MIN_LENGTH} karakter`}
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          if (passwordError !== null) setPasswordError(null);
        }}
        error={passwordError ?? undefined}
        description="Hindari kata sandi yang sudah pernah kamu pakai di layanan lain."
      />
      <TextField
        label="Ulangi kata sandi baru"
        name="confirm-password"
        type="password"
        autoComplete="new-password"
        placeholder="Ketik ulang kata sandi baru"
        value={confirmation}
        onChange={(event) => {
          setConfirmation(event.target.value);
          if (confirmationError !== null) setConfirmationError(null);
        }}
        error={confirmationError ?? undefined}
      />
      {formIssue === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {formIssue}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending}
      >
        {pending ? "Menyimpan..." : "Simpan kata sandi baru"}
      </Button>
    </form>
  );
}

export { ResetPasswordForm };