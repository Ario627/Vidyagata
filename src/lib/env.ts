import "server-only";
import { z } from "zod";
import { err, ok, type Result } from "@/domain/shared/result";
import { SMS_PROVIDERS, type SmsProviderId } from "@/integrations/sms/gateway";

export type ServerEnv = {
  readonly NODE_ENV: "development" | "test" | "production";
  readonly VERCEL_ENV?: "development" | "preview" | "production" | undefined;
  readonly OTP_PEPPER: string;
  readonly SMS_PROVIDER: SmsProviderId;
};

export type ServerEnvIssue = string;

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  OTP_PEPPER: z.string().min(32, { error: "OTP_PEPPER minimal 32 karakter" }),
  SMS_PROVIDER: z.enum(SMS_PROVIDERS).default("console"),
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
