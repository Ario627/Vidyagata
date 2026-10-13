import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { APIError } from "better-auth/api";
import { phoneNumber } from "better-auth/plugins";
import {
  clearOtpChallenge,
  getOtpChallenge,
  recordFailedOtpAttempt,
  saveOtpChallenge,
} from "@/data/otp";
import { buildOtpSmsText, createSmsGateway } from "@/integrations/sms/gateway";
import {
  hashOtpCode,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  verifyOtpCode,
} from "@/lib/crypto/otp";
import { getServerEnv } from "@/lib/env";
import { OTP_CODE_LENGTH } from "@/schemas/auth";
import type { PhoneNumber } from "@/schemas/common";

const authDatabase = {
  user: [],
  session: [],
  account: [],
  verification: [],
};

export const auth = betterAuth({
  appName: "Vidyagata",
  trustedOrigins: process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : undefined,
  database: memoryAdapter(authDatabase),
  plugins: [
    phoneNumber({
      otpLength: OTP_CODE_LENGTH,
      expiresIn: Math.round(OTP_TTL_MS / 1000),
      phoneNumberValidator: (value) => /^\+[1-9]\d{1,14}$/.test(value),
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
