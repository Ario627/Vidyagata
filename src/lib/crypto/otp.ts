import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { OTP_CODE_LENGTH } from "@/schemas/auth";

export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LOCKOUT_BASE_MS = 60 * 1000;
export const OTP_LOCKOUT_MAX_MS = 15 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export function generateOtpCode(): string {
  return String(randomInt(0, 10 ** OTP_CODE_LENGTH)).padStart(
    OTP_CODE_LENGTH,
    "0",
  );
}

export function hashOtpCode(code: string, pepper: string): string {
  return createHmac("sha256", pepper).update(code).digest("hex");
}

export function verifyOtpCode(input: {
  readonly code: string;
  readonly expectedHash: string;
  readonly pepper: string;
}): boolean {
  const actual = Buffer.from(hashOtpCode(input.code, input.pepper), "hex");
  const expected = Buffer.from(input.expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function lockoutMsFor(violations: number): number {
  if (violations <= 0) return 0;
  return Math.min(
    OTP_LOCKOUT_BASE_MS * 2 ** (violations - 1),
    OTP_LOCKOUT_MAX_MS,
  );
}
