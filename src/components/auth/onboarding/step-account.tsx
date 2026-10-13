"use client";

import { type FormEvent, useState } from "react";
import { AuthHelp } from "@/components/auth/auth-help";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import type { PlainDate } from "@/domain/time/plain-date";
import { authClient } from "@/lib/auth-client";
import {
  EmailAddress,
  PASSWORD_MIN_LENGTH,
  PasswordInput,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  UsernameInput,
} from "@/schemas/onboarding";

type AccountDraft = {
  readonly email: string;
  readonly username: string;
};

type StepAccountProps = {
  readonly birthdate: PlainDate;
  readonly onNext: (draft: AccountDraft) => void;
};

type AuthIssue = {
  readonly code?: string | undefined;
  readonly message?: string | undefined;
};

const GENERIC_MESSAGE = "Ada gangguan di sisi kami. Coba lagi sebentar lagi.";

function issueOf(result: {
  success: false;
  error: { issues: { message?: string }[] };
}): string {
  return result.error.issues[0]?.message ?? "Periksa kembali isianmu";
}

function signUpIssueMessage(issue: AuthIssue): string {
  switch (issue.code) {
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Email ini sudah terdaftar. Masuk saja lewat halaman masuk.";
    case "USERNAME_IS_ALREADY_TAKEN":
      return "Username ini sudah dipakai. Coba yang lain.";
    case "UNDERAGE":
      return "Pendaftaran untuk usia di bawah 18 tahun belum tersedia.";
    case "TOO_MANY_REQUESTS":
      return "Terlalu banyak percobaan dari jaringan ini. Tunggu sebentar.";
    default:
      return issue.message ?? GENERIC_MESSAGE;
  }
}

function StepAccount({ birthdate, onNext }: StepAccountProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formIssue, setFormIssue] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const emailParsed = EmailAddress.safeParse(email);
    const usernameParsed = UsernameInput.safeParse(username);
    const passwordParsed = PasswordInput.safeParse(password);
    setEmailError(emailParsed.success ? null : issueOf(emailParsed));
    setUsernameError(usernameParsed.success ? null : issueOf(usernameParsed));
    setPasswordError(passwordParsed.success ? null : issueOf(passwordParsed));
    if (
      !emailParsed.success ||
      !usernameParsed.success ||
      !passwordParsed.success
    ) {
      return;
    }
    setFormIssue(null);
    setPending(true);
    const { error } = await authClient.signUp.email({
      email: emailParsed.data,
      password: passwordParsed.data,
      username: usernameParsed.data,
      name: usernameParsed.data,
      birthdate,
    });
    if (error) {
      setFormIssue(signUpIssueMessage(error));
      setPending(false);
      return;
    }
    onNext({
      email: emailParsed.data,
      username: usernameParsed.data,
    });
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
        description="Untuk masuk kembali dan menerima pemberitahuan penting."
      />
      <div className="flex flex-col gap-2">
        <TextField
          label="Username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          placeholder="nama_kamu"
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            if (usernameError !== null) setUsernameError(null);
          }}
          error={usernameError ?? undefined}
        />
        <div className="flex justify-end">
          <AuthHelp label="Aturan username" title="Aturan username Vidyagata">
            <p>
              {USERNAME_MIN_LENGTH} sampai {USERNAME_MAX_LENGTH} karakter, hanya
              huruf kecil, angka, dan garis bawah. Contoh:{" "}
              <span className="font-medium text-foreground">nathania_03</span>.
            </p>
            <p>
              Username unik — kalau sudah dipakai, kamu akan diminta memilih
              yang lain. Username dipakai untuk masuk ke akunmu nanti.
            </p>
          </AuthHelp>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <TextField
          label="Kata sandi"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder={`Minimal ${PASSWORD_MIN_LENGTH} karakter`}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (passwordError !== null) setPasswordError(null);
          }}
          error={passwordError ?? undefined}
        />
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="rounded-sm text-2xs font-medium text-foreground-muted transition-colors duration-150 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          </button>
          <AuthHelp label="Syarat kata sandi" title="Syarat kata sandi">
            <p>
              Minimal {PASSWORD_MIN_LENGTH} karakter, memuat huruf kecil dan
              angka. Hindari tanggal lahir, nama sendiri, atau kata sandi yang
              sama dengan akun lain.
            </p>
            <p>
              Kata sandi disimpan dalam bentuk hash satu arah — tidak bisa
              dibaca siapa pun, termasuk tim kami.
            </p>
          </AuthHelp>
        </div>
      </div>
      {formIssue === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {formIssue}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Membuat akun..." : "Buat akun"}
      </Button>
    </form>
  );
}

export { StepAccount };
export type { AccountDraft };