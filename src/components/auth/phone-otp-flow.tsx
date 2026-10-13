"use client";

import { OTPField } from "@base-ui/react/otp-field";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldRoot,
  TextField,
} from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { OTP_CODE_LENGTH } from "@/schemas/auth";
import { type PhoneNumber, PhoneNumberID } from "@/schemas/common";

type AuthMode = "masuk" | "daftar";

type PhoneOtpFlowProps = {
  mode: AuthMode;
  resendCooldownSeconds: number;
  ttlMinutes: number;
};

type AuthError = {
  readonly code?: string | undefined;
  readonly message?: string | undefined;
};

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 80;
const OTP_FIELD_ID = "kode-verifikasi";
const GENERIC_MESSAGE = "Ada gangguan di sisi kami. Coba lagi sebentar lagi.";
const INVALID_CODE_MESSAGE = "Kode tidak valid atau sudah kedaluwarsa.";

const OTP_SLOTS = Array.from({ length: OTP_CODE_LENGTH }, (_, index) => index);

function nameIssue(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < NAME_MIN_LENGTH) {
    return `Nama minimal ${NAME_MIN_LENGTH} karakter`;
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `Nama maksimal ${NAME_MAX_LENGTH} karakter`;
  }
  return null;
}

function displayPhoneNumber(phone: PhoneNumber): string {
  return `0${phone.slice(3)}`.replace(/(\d{4})(?=\d)/g, "$1-");
}

function sendIssueMessage(error: AuthError): string {
  switch (error.code) {
    case "OTP_RESEND_COOLDOWN":
      return error.message ?? "Tunggu sebentar sebelum minta kode baru.";
    case "SMS_SEND_FAILED":
      return "Kode tidak bisa dikirim sekarang. Coba lagi sebentar lagi.";
    case "TOO_MANY_REQUESTS":
      return "Terlalu banyak permintaan dari jaringan ini. Coba lagi nanti.";
    default:
      return GENERIC_MESSAGE;
  }
}

function verifyIssueMessage(error: AuthError): string {
  switch (error.code) {
    case "INVALID_OTP":
    case "INVALID_OTP_CODE":
      return INVALID_CODE_MESSAGE;
    case "TOO_MANY_ATTEMPTS":
      return "Percobaan terlalu sering. Minta kode baru untuk melanjutkan.";
    case "TOO_MANY_REQUESTS":
      return "Terlalu banyak percobaan. Tunggu satu menit lalu coba lagi.";
    default:
      return GENERIC_MESSAGE;
  }
}

function PhoneOtpFlow({
  mode,
  resendCooldownSeconds,
  ttlMinutes,
}: PhoneOtpFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [name, setName] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [phoneNumber, setPhoneNumber] = useState<PhoneNumber | null>(null);
  const [code, setCode] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [sendIssue, setSendIssue] = useState<string | null>(null);
  const [codeIssue, setCodeIssue] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft === 0) return;
    const timer = setTimeout(() => {
      setSecondsLeft(secondsLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function requestCode(target: PhoneNumber) {
    setSendIssue(null);
    setPending(true);
    const { error } = await authClient.phoneNumber.sendOtp({
      phoneNumber: target,
    });
    setPending(false);
    if (error) {
      setSendIssue(sendIssueMessage(error));
      return;
    }
    setPhoneNumber(target);
    setCode("");
    setCodeIssue(null);
    setStep("code");
    setSecondsLeft(resendCooldownSeconds);
  }

  async function handlePhoneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const parsed = PhoneNumberID.safeParse(phoneDraft);
    const nextNameError = mode === "daftar" ? nameIssue(name) : null;
    setNameError(nextNameError);
    setPhoneError(
      parsed.success
        ? null
        : (parsed.error.issues[0]?.message ?? "Nomor HP tidak valid"),
    );
    if (!parsed.success || nextNameError !== null) return;
    await requestCode(parsed.data);
  }

  async function handleResend() {
    if (phoneNumber === null || pending || secondsLeft > 0) return;
    await requestCode(phoneNumber);
  }

  async function handleCodeSubmit(value: string) {
    if (phoneNumber === null || pending || value.length !== OTP_CODE_LENGTH) {
      return;
    }
    setCodeIssue(null);
    setPending(true);
    const { error } = await authClient.phoneNumber.verify({
      phoneNumber,
      code: value,
    });
    if (error) {
      setCodeIssue(verifyIssueMessage(error));
      setPending(false);
      return;
    }
    const trimmedName = name.trim();
    if (mode === "daftar" && trimmedName.length > 0) {
      await authClient.updateUser({ name: trimmedName });
    }
    router.replace("/dashboard");
    router.refresh();
  }

  function handleChangePhone() {
    setStep("phone");
    setCode("");
    setCodeIssue(null);
    setSendIssue(null);
    setSecondsLeft(0);
  }

  if (step === "phone" || phoneNumber === null) {
    return (
      <form
        noValidate
        onSubmit={handlePhoneSubmit}
        className="flex flex-col gap-5"
      >
        {mode === "daftar" ? (
          <TextField
            label="Nama lengkap"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            enterKeyHint="next"
            placeholder="Nama sesuai KTP"
            error={nameError ?? undefined}
          />
        ) : null}
        <TextField
          label="Nomor HP"
          name="phoneNumber"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint="send"
          placeholder="081234567890"
          description="Kode 6 digit dikirim lewat SMS ke nomor ini."
          value={phoneDraft}
          onChange={(event) => setPhoneDraft(event.target.value)}
          error={phoneError ?? undefined}
        />
        {sendIssue === null ? null : (
          <p role="alert" className="text-sm text-danger">
            {sendIssue}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Mengirim kode..." : "Kirim kode verifikasi"}
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FieldRoot invalid={codeIssue !== null}>
        <FieldLabel htmlFor={OTP_FIELD_ID}>Kode verifikasi</FieldLabel>
        <OTPField.Root
          id={OTP_FIELD_ID}
          length={OTP_CODE_LENGTH}
          value={code}
          disabled={pending}
          onValueChange={(value) => {
            setCode(value);
            if (codeIssue !== null) setCodeIssue(null);
          }}
          onValueComplete={(value) => {
            void handleCodeSubmit(value);
          }}
          className="flex items-center gap-2"
        >
          {OTP_SLOTS.map((index) => (
            <OTPField.Input
              key={index}
              autoFocus={index === 0}
              className="h-11 w-10 rounded-md border border-border-strong bg-surface text-center text-lg font-medium text-foreground data-disabled:bg-surface-raised data-invalid:border-danger"
            />
          ))}
        </OTPField.Root>
        <FieldDescription>
          Dikirim ke {displayPhoneNumber(phoneNumber)} dan berlaku {ttlMinutes}{" "}
          menit.
        </FieldDescription>
        {codeIssue === null ? null : <FieldError match>{codeIssue}</FieldError>}
      </FieldRoot>
      <Button
        size="lg"
        className="w-full"
        onClick={() => {
          void handleCodeSubmit(code);
        }}
        disabled={pending || code.length !== OTP_CODE_LENGTH}
      >
        {pending ? "Memverifikasi..." : "Verifikasi"}
      </Button>
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void handleResend();
          }}
          disabled={pending || secondsLeft > 0}
        >
          {secondsLeft > 0
            ? `Kirim ulang dalam ${secondsLeft} detik`
            : "Kirim ulang kode"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleChangePhone}
          disabled={pending}
        >
          Ganti nomor
        </Button>
      </div>
      {sendIssue === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {sendIssue}
        </p>
      )}
    </div>
  );
}

export { PhoneOtpFlow };
export type { PhoneOtpFlowProps };