"use client";

import { type FormEvent, useState } from "react";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { CAPTCHA_ACTION } from "@/lib/captcha-action";
import { EmailAddress } from "@/schemas/onboarding";

type RequestResetFormProps = {
  readonly captchaSiteKey: string | null;
};

type AuthIssue = {
  readonly code?: string | undefined;
  readonly message?: string | undefined;
};

const GENERIC_MESSAGE = "Ada gangguan di sisi kami. Coba lagi sebentar lagi.";

function requestIssueMessage(issue: AuthIssue): string {
  switch (issue.code) {
    case "TOO_MANY_REQUESTS":
      return "Terlalu banyak permintaan. Tunggu beberapa menit lalu coba lagi.";
    case "VERIFICATION_FAILED":
    case "MISSING_RESPONSE":
      return "Verifikasi keamanan gagal. Selesaikan ulang verifikasi di bawah lalu coba lagi.";
    default:
      return issue.message ?? GENERIC_MESSAGE;
  }
}

function RequestResetForm({ captchaSiteKey }: RequestResetFormProps) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formIssue, setFormIssue] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  const captchaRequired = captchaSiteKey !== null;
  const captchaBlocked = captchaRequired && captchaToken === null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || sent) return;
    const parsed = EmailAddress.safeParse(email);
    setEmailError(
      parsed.success
        ? null
        : (parsed.error.issues[0]?.message ?? "Email tidak valid"),
    );
    if (!parsed.success) return;
    if (captchaBlocked) {
      setFormIssue("Selesaikan verifikasi keamanan dulu, lalu coba lagi.");
      return;
    }
    setFormIssue(null);
    setPending(true);
    const { error } = await authClient.requestPasswordReset(
      {
        email: parsed.data,
        redirectTo: `${window.location.origin}/lupa-akses/sandi-baru`,
      },
      captchaToken === null
        ? undefined
        : { headers: { "x-captcha-response": captchaToken } },
    );
    setPending(false);
    if (error) {
      setFormIssue(requestIssueMessage(error));
      if (captchaRequired) setCaptchaReset((value) => value + 1);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <p className="text-sm font-semibold text-foreground">
          Periksa emailmu
        </p>
        <p className="text-sm leading-6 text-foreground-muted">
          Kalau email itu terdaftar di Vidyagata, kami sudah mengirim tautan
          untuk membuat kata sandi baru. Tautan berlaku 30 menit dan hanya bisa
          dipakai sekali.
        </p>
        <p className="text-sm leading-6 text-foreground-muted">
          Tidak menerimanya? Tunggu satu menit lalu coba lagi, dan cek folder
          spam.
        </p>
      </div>
    );
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
        description="Masukkan email yang kamu pakai saat mendaftar."
      />
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
        {pending ? "Mengirim..." : "Kirim tautan atur ulang"}
      </Button>
    </form>
  );
}

export { RequestResetForm };