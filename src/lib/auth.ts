import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import {
  captcha,
  haveIBeenPwned,
  twoFactor,
  username,
} from "better-auth/plugins";
import { recordAudit } from "@/data/audit";
import { markTotpCodeUsed, wasTotpCodeUsed } from "@/data/mfa-code-guard";
import {
  buildPasswordResetEmailSubject,
  buildPasswordResetEmailText,
} from "@/integrations/email/message";
import { evaluateSignUpAgeGate } from "@/lib/age-gate";
import { captchaSettings } from "@/lib/captcha";
import { createAuthDatabase } from "@/lib/db/auth-adapter";
import { sendTransactionalEmail } from "@/lib/mailer";
import {
  hashPasswordSecurely,
  needsPasswordRehash,
  verifyStoredPassword,
} from "@/lib/password";
import {
  BirthdateInput,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from "@/schemas/onboarding";

const TOTP_VERIFY_PATH = "/two-factor/verify-totp";
const SIGN_IN_EMAIL_PATH = "/sign-in/email";
const TWO_FACTOR_COOKIE = "two_factor";
const TOTP_REPLAY_ERROR_CODE = "TOTP_CODE_ALREADY_USED";
const RESET_TOKEN_TTL_SECONDS = 1800;
const RESET_TOKEN_TTL_MS = RESET_TOKEN_TTL_SECONDS * 1000;

const captchaConfig = captchaSettings();
const captchaPlugin =
  captchaConfig.enabled && captchaConfig.secretKey !== null
    ? captcha({
        provider: "cloudflare-turnstile",
        secretKey: captchaConfig.secretKey,
        endpoints: [
          "/sign-up/email",
          "/sign-in/email",
          "/request-password-reset",
        ],
      })
    : null;

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
    password: {
      hash: hashPasswordSecurely,
      verify: verifyStoredPassword,
    },
    resetPasswordTokenExpiresIn: RESET_TOKEN_TTL_SECONDS,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendTransactionalEmail({
        to: user.email,
        subject: buildPasswordResetEmailSubject(),
        text: buildPasswordResetEmailText(url, RESET_TOKEN_TTL_MS),
      });
    },
    onPasswordReset: async ({ user }) => {
      await recordAudit({
        actorType: "user",
        actorId: user.id,
        action: "auth.password_reset",
        entityType: "user",
        entityId: user.id,
      });
    },
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
      "/request-password-reset": { window: 300, max: 5 },
      "/reset-password": { window: 600, max: 10 },
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
      if (ctx.path === TOTP_VERIFY_PATH) {
        const user = ctx.context.newSession?.user;
        if (user === null || user === undefined) return;
        const submitted = (ctx.body as { code?: unknown } | undefined)?.code;
        if (typeof submitted !== "string" || submitted.length === 0) return;
        await markTotpCodeUsed(user.id, submitted);
        return;
      }
      if (ctx.path !== SIGN_IN_EMAIL_PATH) return;
      const signedIn = ctx.context.newSession?.user;
      if (signedIn === null || signedIn === undefined) return;
      const password = (ctx.body as { password?: unknown } | undefined)
        ?.password;
      if (typeof password !== "string" || password.length === 0) return;
      try {
        const account = await ctx.context.internalAdapter.findCredentialAccount(
          signedIn.id,
        );
        const stored = account?.password;
        if (typeof stored !== "string" || !needsPasswordRehash(stored)) return;
        await ctx.context.internalAdapter.updatePassword(
          signedIn.id,
          await hashPasswordSecurely(password),
        );
      } catch (error) {
        ctx.context.logger.error("rehash kata sandi gagal", {
          message: error,
        });
      }
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
    haveIBeenPwned({
      enabled: process.env.HIBP_ENABLED !== "false",
      customPasswordCompromisedMessage:
        "Kata sandi ini pernah bocor di kebocoran data lain. Pakai kata sandi lain yang belum pernah dipakai di layanan mana pun.",
    }),
    ...(captchaPlugin === null ? [] : [captchaPlugin]),
  ],
});
