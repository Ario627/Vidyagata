"use client";

import { OTPField } from "@base-ui/react/otp-field";
import { type FormEvent, useState } from "react";
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
import { FullNameInput } from "@/schemas/onboarding";

type StepProfileProps = {
  readonly onNext: () => void;
};

type AuthIssue = {
  readonly code?: string | undefined;
  readonly message?: string | undefined;
};

const OTP_FIELD_ID = "kode-hp";
const GENERIC_MESSAGE = "Ada gangguan di sisi kami. Coba lagi sebentar lagi.";
const INVALID_CODE_MESSAGE = "Kode tidak valid atau sudah kedaluwarsa.";

const OTP_SLOTS = Array.from({ length: OTP_CODE_LENGTH }, (_, index) => index);

function displayPhoneNumber(phone: PhoneNumber): string {
  return `0${phone.slice(3)}`.replace(/(\d{4})(?=\d)/g, "$1-");
}

function sendIssueMessage(issue: AuthIssue): string {
  switch (issue.code) {
    case "OTP_RESEND_COOLDOWN":
      return issue.message ?? "Tunggu sebentar sebelum minta kode baru.";
    case "SMS_SEND_FAILED":
      return "Kode tidak bisa dikirim sekarang. Coba lagi sebentar lagi.";
    case "INVALID_PHONE_NUMBER":
      return "Nomor HP Indonesia tidak valid, contoh 081234567890.";
    case "TOO_MANY_REQUESTS":
      return "Terlalu banyak permintaan dari jaringan ini. Coba lagi nanti.";
    default:
      return issue.message ?? GENERIC_MESSAGE;
  }
}

function verifyIssueMessage(issue: AuthIssue): string {
  switch (issue.code) {
    case "INVALID_OTP":
      return INVALID_CODE_MESSAGE;
    case "TOO_MANY_ATTEMPTS":
      return "Percobaan terlalu sering. Minta kode baru untuk melanjutkan.";
    case "PHONE_NUMBER_EXIST":
      return "Nomor ini sudah terhubung ke akun lain.";
    case "TOO_MANY_REQUESTS":
      return "Terlalu banyak percobaan. Tunggu satu menit lalu coba lagi.";
    default:
      return issue.message ?? GENERIC_MESSAGE;
  }
}

function StepProfile({ onNext }: StepProfileProps) {
  const [fullName, setFullName] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [phoneNumber, setPhoneNumber] = useState<PhoneNumber | null>(null);
  const [code, setCode] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [sendIssue, setSendIssue] = useState<string | null>(null);
  const [codeIssue, setCodeIssue] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const parsed = PhoneNumberID.safeParse(phoneDraft);
    setPhoneError(
      parsed.success
        ? null
        : (parsed.error.issues[0]?.message ?? "Nomor HP tidak valid"),
    );
    if (!parsed.success) return;
    setSendIssue(null);
    setPending(true);
    const { error } = await authClient.phoneNumber.sendOtp({
      phoneNumber: parsed.data,
    });
    setPending(false);
    if (error) {
      setSendIssue(sendIssueMessage(error));
      return;
    }
    setPhoneNumber(parsed.data);
    setCode("");
    setCodeIssue(null);
  }

  async function handleVerify(value: string) {
    if (phoneNumber === null || pending || value.length !== OTP_CODE_LENGTH) {
      return;
    }
    const nameParsed = FullNameInput.safeParse(fullName);
    setNameError(
      nameParsed.success
        ? null
        : (nameParsed.error.issues[0]?.message ?? "Nama tidak valid"),
    );
    if (!nameParsed.success) return;
    setCodeIssue(null);
    setPending(true);
    const { error } = await authClient.phoneNumber.verify({
      phoneNumber,
      code: value,
      updatePhoneNumber: true,
    });
    if (error) {
      setCodeIssue(verifyIssueMessage(error));
      setPending(false);
      return;
    }
    const updated = await authClient.updateUser({ name: nameParsed.data });
    if (updated.error) {
      setCodeIssue(
        updated.error.message ??
          "Nomor tersimpan, tapi nama gagal disimpan. Coba lagi.",
      );
      setPending(false);
      return;
    }
    onNext();
  }

  return (
    <div className="flex flex-col gap-5">
      <TextField
        label="Nama lengkap"
        name="fullName"
        autoComplete="name"
        placeholder="Nama sesuai KTP"
        value={fullName}
        onChange={(event) => {
          setFullName(event.target.value);
          if (nameError !== null) setNameError(null);
        }}
        error={nameError ?? undefined}
        description="Dipakai di perjanjian dan dokumen resmi."
      />
      {phoneNumber === null ? (
        <form noValidate onSubmit={requestCode} className="flex flex-col gap-5">
          <TextField
            label="Nomor HP"
            name="phoneNumber"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="081234567890"
            value={phoneDraft}
            onChange={(event) => {
              setPhoneDraft(event.target.value);
              if (phoneError !== null) setPhoneError(null);
            }}
            error={phoneError ?? undefined}
            description="Nomor HP jadi identitas akun dan kanal pengingat cicilan."
          />
          {sendIssue === null ? null : (
            <p role="alert" className="text-sm text-danger">
              {sendIssue}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            variant="secondary"
            className="w-full"
            disabled={pending}
          >
            {pending ? "Mengirim kode..." : "Kirim kode verifikasi"}
          </Button>
        </form>
      ) : (
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
              Dikirim ke {displayPhoneNumber(phoneNumber)} lewat SMS.
            </FieldDescription>
            {codeIssue === null ? null : (
              <FieldError match>{codeIssue}</FieldError>
            )}
          </FieldRoot>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              void handleVerify(code);
            }}
            disabled={pending || code.length !== OTP_CODE_LENGTH}
          >
            {pending ? "Memverifikasi..." : "Verifikasi & lanjut"}
          </Button>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setPhoneNumber(null);
                setCode("");
                setCodeIssue(null);
              }}
              disabled={pending}
              className="rounded-sm text-2xs font-medium text-foreground-muted transition-colors duration-150 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-60"
            >
              Ganti nomor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { StepProfile };