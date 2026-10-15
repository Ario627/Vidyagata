import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { twoFactor, username } from "better-auth/plugins";
import { markTotpCodeUsed, wasTotpCodeUsed } from "@/data/mfa-code-guard";
import { evaluateSignUpAgeGate } from "@/lib/age-gate";
import { createAuthDatabase } from "@/lib/db/auth-adapter";
import {
  BirthdateInput,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from "@/schemas/onboarding";

const TOTP_VERIFY_PATH = "/two-factor/verify-totp";
const TWO_FACTOR_COOKIE = "two_factor";
const TOTP_REPLAY_ERROR_CODE = "TOTP_CODE_ALREADY_USED"

const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : undefined,
  ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
]
  .filter((origin): origin is string => Boolean(origin))
  .map((origin) => new URL(origin).origin);

export const auth = betterAuth({
  appName: "Vidyagata",
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins,
  database: createAuthDatabase(),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
  },
  user: {
    additionalFields: {
      birthdate: {
        type: "string",
        required: false,
        input: true,
        validator: { input: BirthdateInput },
      },
    },
    validateUserInfo({ user, source }) {
      if (source.action !== "create-user") return;
      const rejection = evaluateSignUpAgeGate({
        method: source.method,
        birthdate: user.birthdate,
        now: new Date(),
      });
      return rejection ?? undefined;
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return { data: { ...user, emailVerified: true } };
        },
      },
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: "database",
    customRules: {
      "/sign-up/email": { window: 300, max: 10 },
      "/sign-in/email": { window: 60, max: 10 },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== TOTP_VERIFY_PATH) return;
      const secret = ctx.context.secret;
      if (typeof secret !== "string") return;
      const cookie = ctx.context.createAuthCookie(TWO_FACTOR_COOKIE);
      const challenge = await ctx.getSignedCookie(cookie.name, secret);
      if (typeof challenge !== "string" || challenge.length === 0) return;
      const verification =
        await ctx.context.internalAdapter.findVerificationValue(challenge);
      const userId = verification?.value;
      if (typeof userId !== "string") return;
      const submitted = (ctx.body as { code?: unknown } | undefined)?.code;
      if (typeof submitted !== "string" || submitted.length === 0) return;
      if (await wasTotpCodeUsed(userId, submitted)) {
        throw APIError.from("TOO_MANY_REQUESTS", {
          message:
            "Kode ini sudah dipakai. Tunggu kode berikutnya lalu coba lagi.",
          code: TOTP_REPLAY_ERROR_CODE,
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== TOTP_VERIFY_PATH) return;
      const user = ctx.context.newSession?.user;
      if (user === null || user === undefined) return;
      const submitted = (ctx.body as { code?: unknown } | undefined)?.code;
      if (typeof submitted !== "string" || submitted.length === 0) return;
      await markTotpCodeUsed(user.id, submitted);
    }),
  },
  plugins: [
    username({
      minUsernameLength: USERNAME_MIN_LENGTH,
      maxUsernameLength: USERNAME_MAX_LENGTH,
      usernameValidator: (value) => USERNAME_PATTERN.test(value),
    }),
    twoFactor({
      issuer: "Vidyagata",
      totpOptions: {
        digits: 6,
        period: 30,
      },
      backupCodeOptions: {
        amount: 10,
        length: 10,
        storeBackupCodes: "encrypted",
      },
      accountLockout: {
        enabled: true,
        maxFailedAttempts: 5,
        durationSeconds: 900,
      },
      twoFactorCookieMaxAge: 600,
    }),
  ],
});
