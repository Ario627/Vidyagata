import { err, ok, type Result } from "@/domain/shared/result";
import type { PhoneNumber } from "@/schemas/common";

export const SMS_PROVIDERS = ["console", "twilio"] as const;

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
const SMS_TIMEOUT_MS = 10_000;
const TWILIO_MESSAGING_SERVICE_PREFIX = "MG";

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

type TwilioConfig = {
  readonly accountSid: string;
  readonly authToken: string;
  readonly from: string;
};

function createTwilioGateway(config: TwilioConfig): SmsGateway {
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.accountSid)}/Messages.json`;
  const authorization = `Basic ${Buffer.from(
    `${config.accountSid}:${config.authToken}`,
  ).toString("base64")}`;

  return {
    id: "twilio",
    async send(message) {
      const body = new URLSearchParams({ To: message.to, Body: message.text });
      if (config.from.startsWith(TWILIO_MESSAGING_SERVICE_PREFIX)) {
        body.set("MessagingServiceSid", config.from);
      } else {
        body.set("From", config.from);
      }
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            authorization,
            "content-type": "application/x-www-form-urlencoded",
          },
          body,
          signal: AbortSignal.timeout(SMS_TIMEOUT_MS),
        });
        if (!response.ok) {
          const detail = (await response.text()).slice(0, 300);
          return err({ kind: "send_failed", provider: "twilio", detail });
        }
        return ok(undefined);
      } catch (error) {
        return err({
          kind: "send_failed",
          provider: "twilio",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}

export function createSmsGateway(config: {
  readonly provider: SmsProviderId;
  readonly twilio?: TwilioConfig | undefined;
}): SmsGateway {
  switch (config.provider) {
    case "console":
      return consoleGateway;
    case "twilio": {
      if (config.twilio === undefined) {
        throw new Error("Kredensial Twilio wajib diisi untuk provider twilio");
      }
      return createTwilioGateway(config.twilio);
    }
  }
}
