"use client";

import { OTPField } from "@base-ui/react/otp-field";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldRoot,
} from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { OTP_CODE_LENGTH } from "@/schemas/auth";

type StepEmailVerifyProps = {
  readonly email: string;
  readonly resendCooldownSeconds: number;
  readonly ttlMinutes: number;
  readonly onNext: () => void;
};

type AuthIssue = {
  readonly code?: string | undefined;
  readonly message?: string | undefined;
};

const OTP_FIELD_ID = "kode-email";
const GENERIC_MESSAGE = "Ada gangguan di sisi kami. Coba lagi sebentar lagi.";
const INVALID_CODE_MESSAGE = "Kode tidak valid atau sudah kedaluwarsa.";

const OTP_SLOTS = Array.from({ length: OTP_CODE_LENGTH }, (_, index) => index);

function verifyIssueMessage(issue: AuthIssue): string {
  switch (issue.code) {
    case "INVALID_OTP":
      return INVALID_CODE_MESSAGE;
    case "OTP_EXPIRED":
      return "Kode sudah kedaluwarsa. Minta kode baru.";
    case "TOO_MANY_ATTEMPTS":
      return "Percobaan terlalu sering. Minta kode baru untuk melanjutkan.";
    case "TOO_MANY_REQUESTS":
      return "Terlalu banyak percobaan. Tunggu satu menit lalu coba lagi.";
    default:
      return issue.message ?? GENERIC_MESSAGE;
  }
}

function sendIssueMessage(issue: AuthIssue): string {
  switch (issue.code) {
    case "EMAIL_SEND_FAILED":
      return "Kode tidak bisa dikirim ke email sekarang. Coba kirim ulang.";
    case "TOO_MANY_REQUESTS":
      return "Batas pengiriman tercapai. Tunggu satu menit lalu coba lagi.";
    default:
      return issue.message ?? GENERIC_MESSAGE;
  }
}

function StepEmailVerify({
  email,
  resendCooldownSeconds,
  ttlMinutes,
  onNext,
}: StepEmailVerifyProps) {
  const [code, setCode] = useState("");
  const [sendIssue, setSendIssue] = useState<string | null>(null);
  const [codeIssue, setCodeIssue] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const autoSent = useRef(false);

  useEffect(() => {
    if (autoSent.current) return;
    autoSent.current = true;
    void sendCode();
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) return;
    const timer = setTimeout(() => {
      setSecondsLeft(secondsLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function sendCode() {
    setSendIssue(null);
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
    if (error) {
      setSendIssue(sendIssueMessage(error));
      return;
    }
    setSecondsLeft(resendCooldownSeconds);
  }

  async function handleVerify(value: string) {
    if (pending || value.length !== OTP_CODE_LENGTH) return;
    setCodeIssue(null);
    setPending(true);
    const { error } = await authClient.emailOtp.verifyEmail({
      email,
      otp: value,
    });
    if (error) {
      setCodeIssue(verifyIssueMessage(error));
      setPending(false);
      return;
    }
    onNext();
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
            void handleVerify(value);
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
          Dikirim ke {email} dan berlaku {ttlMinutes} menit.
        </FieldDescription>
        {codeIssue === null ? null : <FieldError match>{codeIssue}</FieldError>}
      </FieldRoot>
      <Button
        size="lg"
        className="w-full"
        onClick={() => {
          void handleVerify(code);
        }}
        disabled={pending || code.length !== OTP_CODE_LENGTH}
      >
        {pending ? "Memverifikasi..." : "Verifikasi email"}
      </Button>
      {sendIssue === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {sendIssue}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void sendCode();
          }}
          disabled={pending || secondsLeft > 0}
        >
          {secondsLeft > 0
            ? `Kirim ulang dalam ${secondsLeft} detik`
            : "Kirim ulang kode"}
        </Button>
        <p className="text-2xs text-foreground-subtle">
          Tidak menerima? Periksa folder spam.
        </p>
      </div>
    </div>
  );
}

export { StepEmailVerify };
