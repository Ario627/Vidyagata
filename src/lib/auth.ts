import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { emailOTP, twoFactor, username } from "better-auth/plugins";
import { markTotpCodeUsed, wasTotpCodeUsed } from "@/data/mfa-code-guard";
import { createEmailGateway } from "@/integrations/email/gateway";
import {
  buildOtpEmailSubject,
  buildOtpEmailText,
} from "@/integrations/email/message";
import { evaluateSignUpAgeGate } from "@/lib/age-gate";
import { OTP_MAX_ATTEMPTS, OTP_TTL_MS } from "@/lib/crypto/otp";
import { createAuthDatabase } from "@/lib/db/auth-adapter";
import { getServerEnv } from "@/lib/env";
import { OTP_CODE_LENGTH } from "@/schemas/auth";
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
const TOTP_REPLAY_ERROR_CODE = "TOTP_CODE_ALREADY_USED";

export const auth = betterAuth({
  appName: "Vidyagata",
  trustedOrigins: process.env.VERCEL_URL
    ? [`https://${process.env.VERCEL_URL}`]
    : undefined,
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
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: "database",
    customRules: {
      "/sign-up/email": { window: 300, max: 10 },
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/email-otp/verify-email": { window: 60, max: 10 },
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
      if (wasTotpCodeUsed(userId, submitted)) {
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
      markTotpCodeUsed(user.id, submitted);
    }),
  },
  plugins: [
    username({
      minUsernameLength: USERNAME_MIN_LENGTH,
      maxUsernameLength: USERNAME_MAX_LENGTH,
      usernameValidator: (value) => USERNAME_PATTERN.test(value),
    }),
    emailOTP({
      otpLength: OTP_CODE_LENGTH,
      expiresIn: Math.round(OTP_TTL_MS / 1000),
      allowedAttempts: OTP_MAX_ATTEMPTS,
      storeOTP: "hashed",
      async sendVerificationOTP({ email, otp, type }) {
        const env = getServerEnv();
        const gateway = createEmailGateway({
          provider: env.EMAIL_PROVIDER,
          smtpUrl: env.SMTP_URL,
          from: env.EMAIL_FROM,
        });
        const sent = await gateway.send({
          to: email,
          subject: buildOtpEmailSubject(type),
          text: buildOtpEmailText(otp, OTP_TTL_MS),
        });
        if (!sent.ok) {
          throw APIError.from("BAD_GATEWAY", {
            code: "EMAIL_SEND_FAILED",
            message:
              "Kode tidak bisa dikirim ke email sekarang. Coba lagi sebentar lagi.",
          });
        }
      },
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
