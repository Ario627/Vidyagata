"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { resolveLandingAction } from "@/app/(auth)/masuk/landing";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { CAPTCHA_ACTION } from "@/lib/captcha-action";
import { EmailAddress } from "@/schemas/onboarding";

type EmailSignInProps = {
  readonly nextPath: string | null;
  readonly captchaSiteKey: string | null;
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
    case "VERIFICATION_FAILED":
    case "MISSING_RESPONSE":
      return "Verifikasi keamanan gagal. Selesaikan ulang verifikasi di bawah lalu coba lagi.";
    default:
      return issue.message ?? GENERIC_MESSAGE;
  }
}

function EmailSignIn({ nextPath, captchaSiteKey }: EmailSignInProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formIssue, setFormIssue] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  const captchaRequired = captchaSiteKey !== null;
  const captchaBlocked = captchaRequired && captchaToken === null;

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
    if (captchaBlocked) {
      setFormIssue("Selesaikan verifikasi keamanan dulu, lalu coba lagi.");
      return;
    }
    setFormIssue(null);
    setPending(true);
    const { data, error } = await authClient.signIn.email(
      {
        email: emailParsed.data,
        password,
      },
      captchaToken === null
        ? undefined
        : { headers: { "x-captcha-response": captchaToken } },
    );
    if (error) {
      setFormIssue(signInIssueMessage(error));
      setPending(false);
      if (captchaRequired) setCaptchaReset((value) => value + 1);
      return;
    }
    if (data && "twoFactorRedirect" in data) {
      const params = new URLSearchParams();
      if (nextPath !== null) params.set("next", nextPath);
      const query = params.toString();
      router.replace(
        (query === ""
          ? "/masuk/dua-faktor"
          : `/masuk/dua-faktor?${query}`) as Route,
      );
      return;
    }
    if (nextPath !== null) {
      router.replace(nextPath as Route);
      return;
    }
    const landing = await resolveLandingAction().catch(
      () => "/dashboard" as Route,
    );
    router.replace(landing);
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
      <div className="-mt-2 flex justify-end">
        <Link
          href={"/lupa-akses" as Route}
          className="text-xs font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
        >
          Lupa kata sandi?
        </Link>
      </div>
      {formIssue === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {formIssue}
        </p>
      )}
      {captchaSiteKey === null ? null : (
        <div className="flex flex-col gap-2">
          <TurnstileWidget
            siteKey={captchaSiteKey}
            action={CAPTCHA_ACTION}
            resetSignal={captchaReset}
            onToken={setCaptchaToken}
          />
          {captchaToken === null ? (
            <p className="text-2xs leading-4 text-foreground-subtle">
              Menunggu verifikasi keamanan selesai — kalau kotaknya tidak
              muncul, muat ulang halaman ini.
            </p>
          ) : null}
        </div>
      )}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending || captchaBlocked}
      >
        {pending ? "Masuk..." : "Masuk"}
      </Button>
    </form>
  );
}

export { EmailSignIn };
