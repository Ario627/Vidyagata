import { ok, type Result } from "@/domain/shared/result";
import type { PhoneNumber } from "@/schemas/common";

export const SMS_PROVIDERS = ["console"] as const;

export type SmsProviderId = (typeof SMS_PROVIDERS)[number];

export type SmsMessage = {
  readonly to: PhoneNumber;
  readonly text: string;
};

export type SmsError = {
  readonly kind: "send_failed";
  readonly provider: SmsProviderId;
  readonly detail: string;
};

export type SmsGateway = {
  readonly id: SmsProviderId;
  send(message: SmsMessage): Promise<Result<void, SmsError>>;
};

const PHONE_VISIBLE_DIGITS = 3;

export function buildOtpSmsText(code: string, ttlMs: number): string {
  const minutes = Math.round(ttlMs / 60_000);
  return `Kode Vidyagata: ${code}. Jangan bagikan kode ini. Berlaku ${minutes} menit.`;
}

export function maskPhoneNumber(phone: PhoneNumber): string {
  const national = phone.slice(3);
  const visible = PHONE_VISIBLE_DIGITS;
  if (national.length <= visible * 2) {
    return `+62${"*".repeat(national.length)}`;
  }
  return `+62${national.slice(0, visible)}${"*".repeat(
    national.length - visible * 2,
  )}${national.slice(-visible)}`;
}

const consoleGateway: SmsGateway = {
  id: "console",
  async send(message) {
    process.stdout.write(
      `\n[SMS dev sink] -> ${maskPhoneNumber(message.to)}\n${message.text}\n(tidak dikirim ke jaringan)\n\n`,
    );
    return ok(undefined);
  },
};

export function createSmsGateway(config: {
  readonly provider: SmsProviderId;
}): SmsGateway {
  switch (config.provider) {
    case "console":
      return consoleGateway;
  }
}
