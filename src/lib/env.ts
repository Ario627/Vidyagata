import "server-only";
import { z } from "zod";
import { err, ok, type Result } from "@/domain/shared/result";
import {
  EMAIL_PROVIDERS,
  type EmailProviderId,
} from "@/integrations/email/gateway";
import { SMS_PROVIDERS, type SmsProviderId } from "@/integrations/sms/gateway";

export type ServerEnv = {
  readonly NODE_ENV: "development" | "test" | "production";
  readonly VERCEL_ENV?: "development" | "preview" | "production" | undefined;
  readonly OTP_PEPPER: string;
  readonly SMS_PROVIDER: SmsProviderId;
  readonly EMAIL_PROVIDER: EmailProviderId;
  readonly SMTP_URL?: string | undefined;
  readonly EMAIL_FROM: string;
  readonly TWILIO_ACCOUNT_SID?: string | undefined;
  readonly TWILIO_AUTH_TOKEN?: string | undefined;
  readonly TWILIO_FROM?: string | undefined;
};

export type ServerEnvIssue = string;

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  OTP_PEPPER: z.string().min(32, { error: "OTP_PEPPER minimal 32 karakter" }),
  SMS_PROVIDER: z.enum(SMS_PROVIDERS).default("console"),
  EMAIL_PROVIDER: z.enum(EMAIL_PROVIDERS).default("console"),
  SMTP_URL: z
    .string()
    .regex(/^smtps?:\/\//, {
      error: "SMTP_URL harus diawali smtp:// atau smtps://",
    })
    .optional(),
  EMAIL_FROM: z
    .string()
    .min(3, { error: "EMAIL_FROM minimal 3 karakter" })
    .default("Vidyagata <no-reply@vidyagata.id>"),
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_FROM: z.string().min(1).optional(),
});

function toIssueMessages(error: z.ZodError): string[] {
  return error.issues.map(
    (issue) => `${issue.path.join(".") || "env"}: ${issue.message}`,
  );
}

export function parseServerEnv(
  input: Record<string, string | undefined>,
): Result<ServerEnv, readonly ServerEnvIssue[]> {
  const parsed = serverEnvSchema.safeParse(input);
  if (!parsed.success) return err(toIssueMessages(parsed.error));
  if (
    parsed.data.VERCEL_ENV === "production" &&
    parsed.data.SMS_PROVIDER === "console"
  ) {
    return err(["SMS_PROVIDER: sink console dilarang di produksi Vercel"]);
  }
  if (
    parsed.data.VERCEL_ENV === "production" &&
    parsed.data.EMAIL_PROVIDER === "console"
  ) {
    return err(["EMAIL_PROVIDER: sink console dilarang di produksi Vercel"]);
  }
  if (
    parsed.data.EMAIL_PROVIDER === "smtp" &&
    parsed.data.SMTP_URL === undefined
  ) {
    return err(["SMTP_URL: wajib diisi kalau EMAIL_PROVIDER=smtp"]);
  }
  if (parsed.data.SMS_PROVIDER === "twilio") {
    const missing = (
      [
        ["TWILIO_ACCOUNT_SID", parsed.data.TWILIO_ACCOUNT_SID],
        ["TWILIO_AUTH_TOKEN", parsed.data.TWILIO_AUTH_TOKEN],
        ["TWILIO_FROM", parsed.data.TWILIO_FROM],
      ] as const
    )
      .filter(([, value]) => value === undefined)
      .map(([name]) => `${name}: wajib diisi kalau SMS_PROVIDER=twilio`);
    if (missing.length > 0) return err(missing);
  }
  return ok(parsed.data);
}

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedEnv !== null) return cachedEnv;
  const parsed = parseServerEnv(process.env);
  if (!parsed.ok) {
    throw new Error(
      `Konfigurasi lingkungan tidak valid:\n- ${parsed.error.join("\n- ")}`,
    );
  }
  cachedEnv = parsed.value;
  return cachedEnv;
}
