"use client";

import { OTPField } from "@base-ui/react/otp-field";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldRoot,
  TextField,
} from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";

const TOTP_CODE_LENGTH = 6;
const TOTP_FIELD_ID = "kode-dua-faktor";
const TOTP_SLOTS = Array.from(
  { length: TOTP_CODE_LENGTH },
  (_, index) => index,
);

type AuthIssue = {
  readonly code?: string | undefined;
  readonly message?: string | undefined;
};

type TwoFactorFormProps = {
  readonly nextPath: string | null;
};

const GENERIC_MESSAGE = "Ada gangguan di sisi kami. Coba lagi sebentar lagi.";

function verifyIssueMessage(issue: AuthIssue): string {
  switch (issue.code) {
    case "INVALID_CODE":
      return "Kode tidak cocok. Pastikan jam perangkatmu akurat lalu coba lagi.";
    case "ACCOUNT_TEMPORARILY_LOCKED":
      return "Terlalu banyak kode salah. Akun terkunci sementara, coba lagi 15 menit kemudian.";
    case "TOO_MANY_REQUESTS":
      return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
    case "INVALID_TWO_FACTOR_COOKIE":
      return "Waktu verifikasi habis. Masuk ulang dari awal.";
    default:
      return issue.message ?? GENERIC_MESSAGE;
  }
}

function backupIssueMessage(issue: AuthIssue): string {
  switch (issue.code) {
    case "INVALID_BACKUP_CODE":
      return "Kode pemulihan tidak cocok atau sudah pernah terpakai.";
    case "ACCOUNT_TEMPORARILY_LOCKED":
      return "Terlalu banyak kode salah. Akun terkunci sementara, coba lagi 15 menit kemudian.";
    case "TOO_MANY_REQUESTS":
      return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
    case "INVALID_TWO_FACTOR_COOKIE":
      return "Waktu verifikasi habis. Masuk ulang dari awal.";
    default:
      return issue.message ?? GENERIC_MESSAGE;
  }
}

function TwoFactorForm({ nextPath }: TwoFactorFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [issue, setIssue] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submitTotp(value: string) {
    if (pending || value.length !== TOTP_CODE_LENGTH) return;
    setIssue(null);
    setPending(true);
    const { error } = await authClient.twoFactor.verifyTotp({ code: value });
    if (error) {
      setIssue(verifyIssueMessage(error));
      setPending(false);
      setCode("");
      return;
    }
    router.replace((nextPath ?? "/dashboard") as Route);
  }

  async function submitBackup() {
    const trimmed = backupCode.trim();
    if (pending || trimmed.length === 0) return;
    setIssue(null);
    setPending(true);
    const { error } = await authClient.twoFactor.verifyBackupCode({
      code: trimmed,
    });
    if (error) {
      setIssue(backupIssueMessage(error));
      setPending(false);
      return;
    }
    router.replace((nextPath ?? "/dashboard") as Route);
  }

  if (mode === "backup") {
    return (
      <div className="flex flex-col gap-5">
        <TextField
          label="Kode pemulihan"
          name="backup-code"
          autoComplete="one-time-code"
          placeholder="Kode pemulihanmu"
          description="Satu kode pemulihan hanya bisa dipakai sekali."
          value={backupCode}
          onChange={(event) => {
            setBackupCode(event.target.value);
            if (issue !== null) setIssue(null);
          }}
        />
        {issue === null ? null : (
          <p role="alert" className="text-sm text-danger">
            {issue}
          </p>
        )}
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            void submitBackup();
          }}
          disabled={pending || backupCode.trim().length === 0}
        >
          {pending ? "Memverifikasi..." : "Pakai kode pemulihan"}
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            setMode("totp");
            setIssue(null);
          }}
        >
          Kembali ke kode aplikasi
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FieldRoot invalid={issue !== null}>
        <FieldLabel htmlFor={TOTP_FIELD_ID}>Kode dari aplikasi</FieldLabel>
        <OTPField.Root
          id={TOTP_FIELD_ID}
          length={TOTP_CODE_LENGTH}
          value={code}
          disabled={pending}
          onValueChange={(value) => {
            setCode(value);
            if (issue !== null) setIssue(null);
          }}
          onValueComplete={(value) => {
            void submitTotp(value);
          }}
          className="flex items-center gap-2"
        >
          {TOTP_SLOTS.map((index) => (
            <OTPField.Input
              key={index}
              autoFocus={index === 0}
              className="h-11 w-10 rounded-md border border-border-strong bg-surface text-center text-lg font-medium text-foreground data-disabled:bg-surface-raised data-invalid:border-danger"
            />
          ))}
        </OTPField.Root>
        <FieldDescription>
          Kode berganti setiap 30 detik. Punya waktu sekitar 10 menit untuk
          menyelesaikan langkah ini.
        </FieldDescription>
        {issue === null ? null : <FieldError match>{issue}</FieldError>}
      </FieldRoot>
      <Button
        size="lg"
        className="w-full"
        onClick={() => {
          void submitTotp(code);
        }}
        disabled={pending || code.length !== TOTP_CODE_LENGTH}
      >
        {pending ? "Memverifikasi..." : "Verifikasi dan masuk"}
      </Button>
      <Button
        variant="ghost"
        className="w-full"
        onClick={() => {
          setMode("backup");
          setIssue(null);
        }}
      >
        Pakai kode pemulihan
      </Button>
    </div>
  );
}

export { TwoFactorForm };
