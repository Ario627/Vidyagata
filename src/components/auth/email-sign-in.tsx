"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { EmailAddress } from "@/schemas/onboarding";

type EmailSignInProps = {
  readonly nextPath: string | null;
};

type AuthIssue = {
  readonly code?: string | undefined;
  readonly message?: string | undefined;
};

const GENERIC_MESSAGE = "Ada gangguan di sisi kami. Coba lagi sebentar lagi.";

function signInIssueMessage(issue: AuthIssue): string {
  switch (issue.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Email atau kata sandi tidak cocok.";
    case "EMAIL_NOT_VERIFIED":
      return "Email belum diverifikasi. Selesaikan verifikasi lewat email yang kami kirim saat pendaftaran.";
    case "TOO_MANY_REQUESTS":
      return "Terlalu banyak percobaan. Tunggu satu menit lalu coba lagi.";
    default:
      return issue.message ?? GENERIC_MESSAGE;
  }
}

function EmailSignIn({ nextPath }: EmailSignInProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formIssue, setFormIssue] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const emailParsed = EmailAddress.safeParse(email);
    setEmailError(
      emailParsed.success
        ? null
        : (emailParsed.error.issues[0]?.message ?? "Email tidak valid"),
    );
    setPasswordError(password.length === 0 ? "Kata sandi wajib diisi" : null);
    if (!emailParsed.success || password.length === 0) return;
    setFormIssue(null);
    setPending(true);
    const { error } = await authClient.signIn.email({
      email: emailParsed.data,
      password,
    });
    if (error) {
      setFormIssue(signInIssueMessage(error));
      setPending(false);
      return;
    }
    router.replace((nextPath ?? "/dashboard") as Route);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <TextField
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        placeholder="nama@email.com"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          if (emailError !== null) setEmailError(null);
        }}
        error={emailError ?? undefined}
      />
      <TextField
        label="Kata sandi"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Kata sandimu"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          if (passwordError !== null) setPasswordError(null);
        }}
        error={passwordError ?? undefined}
      />
      {formIssue === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {formIssue}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Masuk..." : "Masuk"}
      </Button>
    </form>
  );
}

export { EmailSignIn };