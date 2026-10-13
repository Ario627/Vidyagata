import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { emailOTP, phoneNumber, username } from "better-auth/plugins";
import {
  clearOtpChallenge,
  getOtpChallenge,
  recordFailedOtpAttempt,
  saveOtpChallenge,
} from "@/data/otp";
import { createEmailGateway } from "@/integrations/email/gateway";

import {
  buildOtpEmailSubject,
  buildOtpEmailText,
} from "@/integrations/email/message";
import { buildOtpSmsText, createSmsGateway } from "@/integrations/sms/gateway";
import { evaluateSignUpAgeGate } from "@/lib/age-gate";
import {
  hashOtpCode,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  verifyOtpCode,
} from "@/lib/crypto/otp";
import { createAuthDatabase } from "@/lib/db/auth-adapter";
import { getServerEnv } from "@/lib/env";
import { OTP_CODE_LENGTH } from "@/schemas/auth";
import { isCanonicalPhoneNumber, type PhoneNumber } from "@/schemas/common";
import {
  BirthdateInput,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from "@/schemas/onboarding";

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
      "/phone-number/send-otp": { window: 60, max: 5 },
      "/phone-number/verify": { window: 60, max: 10 },
      "/sign-up/email": { window: 300, max: 10 },
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/email-otp/verify-email": { window: 60, max: 10 },
      "/sign-in/email": { window: 60, max: 10 },
    },
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
    phoneNumber({
      otpLength: OTP_CODE_LENGTH,
      expiresIn: Math.round(OTP_TTL_MS / 1000),
      phoneNumberValidator: isCanonicalPhoneNumber,
      signUpOnVerification: {
        getTempEmail: (phone) => `${phone.replace("+", "")}@phone.vidyagata.id`,
        getTempName: () => "Pengguna Vidyagata",
      },
      async sendOTP({ phoneNumber: phone, code }, ctx) {
        const now = Date.now();
        const existing = await getOtpChallenge(phone as PhoneNumber, now);
        if (
          existing !== null &&
          now - existing.issuedAt < OTP_RESEND_COOLDOWN_MS
        ) {
          throw APIError.from("TOO_MANY_REQUESTS", {
            code: "OTP_RESEND_COOLDOWN",
            message:
              "Kode baru bisa dikirim satu menit setelah permintaan terakhir.",
          });
        }
        const env = getServerEnv();
        await saveOtpChallenge({
          phoneNumber: phone as PhoneNumber,
          codeHash: hashOtpCode(code, env.OTP_PEPPER),
          now,
          ttlMs: OTP_TTL_MS,
        });
        if (ctx) {
          await ctx.context.internalAdapter.deleteVerificationByIdentifier(
            phone,
          );
        }
        const gateway = createSmsGateway({ provider: env.SMS_PROVIDER });
        const sent = await gateway.send({
          to: phone as PhoneNumber,
          text: buildOtpSmsText(code, OTP_TTL_MS),
        });
        if (!sent.ok) {
          await clearOtpChallenge(phone as PhoneNumber);
          throw APIError.from("BAD_GATEWAY", {
            code: "SMS_SEND_FAILED",
            message:
              "Kode tidak bisa dikirim sekarang. Coba lagi sebentar lagi.",
          });
        }
      },
      async verifyOTP({ phoneNumber: phone, code }) {
        const now = Date.now();
        const challenge = await getOtpChallenge(phone as PhoneNumber, now);
        if (challenge === null) return false;
        if (challenge.lockedUntil !== null && now < challenge.lockedUntil) {
          return false;
        }
        const matches = verifyOtpCode({
          code,
          expectedHash: challenge.codeHash,
          pepper: getServerEnv().OTP_PEPPER,
        });
        if (!matches) {
          await recordFailedOtpAttempt({
            phoneNumber: phone as PhoneNumber,
            now,
          });
          return false;
        }
        await clearOtpChallenge(phone as PhoneNumber);
        return true;
      },
    }),
  ],
});
