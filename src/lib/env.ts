import "server-only";
import { z } from "zod";
import { err, ok, type Result } from "@/domain/shared/result";

export type ServerEnv = {
  readonly NODE_ENV: "development" | "test" | "production";
  readonly VERCEL_ENV?: "development" | "preview" | "production" | undefined;
  readonly OTP_PEPPER: string;
  readonly DATABASE_URL?: string | undefined;
  readonly TURNSTILE_SITE_KEY?: string | undefined;
  readonly TURNSTILE_SECRET_KEY?: string | undefined;
  readonly HIBP_ENABLED: boolean;
  readonly EMAIL_PROVIDER: "console" | "smtp";
  readonly SMTP_URL?: string | undefined;
  readonly EMAIL_FROM?: string | undefined;
};

export type ServerEnvIssue = string;

function blankToUndefined(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  OTP_PEPPER: z.string().min(32, { error: "OTP_PEPPER minimal 32 karakter" }),
  DATABASE_URL: z.preprocess(
    blankToUndefined,
    z
      .string()
      .regex(/^postgres(ql)?:\/\//, {
        error: "DATABASE_URL harus diawali postgres:// atau postgresql://",
      })
      .optional(),
  ),
  TURNSTILE_SITE_KEY: z.preprocess(
    blankToUndefined,
    z.string().min(1).optional(),
  ),
  TURNSTILE_SECRET_KEY: z.preprocess(
    blankToUndefined,
    z.string().min(1).optional(),
  ),
  HIBP_ENABLED: z.preprocess(
    blankToUndefined,
    z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
  ),
  EMAIL_PROVIDER: z
    .preprocess(blankToUndefined, z.enum(["console", "smtp"]))
    .default("console"),
  SMTP_URL: z.preprocess(
    blankToUndefined,
    z
      .string()
      .regex(/^smtps?:\/\//, {
        error: "SMTP_URL harus diawali smtp:// atau smtps://",
      })
      .optional(),
  ),
  EMAIL_FROM: z.preprocess(blankToUndefined, z.string().min(3).optional()),
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
  const env = parsed.data;
  const issues: ServerEnvIssue[] = [];
  const hasSiteKey = env.TURNSTILE_SITE_KEY !== undefined;
  const hasSecretKey = env.TURNSTILE_SECRET_KEY !== undefined;
  if (hasSiteKey !== hasSecretKey) {
    issues.push(
      hasSiteKey
        ? "TURNSTILE_SECRET_KEY: wajib diisi kalau TURNSTILE_SITE_KEY ada"
        : "TURNSTILE_SITE_KEY: wajib diisi kalau TURNSTILE_SECRET_KEY ada",
    );
  }
  if (env.VERCEL_ENV === "production") {
    if (!hasSecretKey) {
      issues.push(
        "TURNSTILE_SECRET_KEY: wajib diisi di produksi — captcha melindungi endpoint autentikasi",
      );
    }
    if (!env.HIBP_ENABLED) {
      issues.push(
        "HIBP_ENABLED: tidak boleh dimatikan di produksi — cek kata sandi bocor wajib aktif",
      );
    }
  }
  if (env.EMAIL_PROVIDER === "smtp") {
    if (env.SMTP_URL === undefined) {
      issues.push(
        "SMTP_URL: wajib diisi kalau EMAIL_PROVIDER=smtp — tanpa itu email pemulihan akun tidak terkirim",
      );
    }
    if (env.EMAIL_FROM === undefined) {
      issues.push(
        "EMAIL_FROM: wajib diisi kalau EMAIL_PROVIDER=smtp — alamat pengirim email Vidyagata",
      );
    }
  }
  if (issues.length > 0) return err(issues);
  return ok(env);
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
