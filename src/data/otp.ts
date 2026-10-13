import "server-only";
import { lockoutMsFor, OTP_MAX_ATTEMPTS } from "@/lib/crypto/otp";
import type { PhoneNumber } from "@/schemas/common";

export type OtpChallenge = {
  readonly phoneNumber: PhoneNumber;
  readonly codeHash: string;
  readonly issuedAt: number;
  readonly expiresAt: number;
  readonly attempts: number;
  readonly lockCount: number;
  readonly lockedUntil: number | null;
};

const challenges = new Map<PhoneNumber, OtpChallenge>();

function isStale(challenge: OtpChallenge, now: number): boolean {
  return challenge.expiresAt <= now && (challenge.lockedUntil ?? 0) <= now;
}

function sweepExpired(now: number): void {
  for (const [phoneNumber, challenge] of challenges) {
    if (isStale(challenge, now)) challenges.delete(phoneNumber);
  }
}

export async function getOtpChallenge(
  phoneNumber: PhoneNumber,
  now: number,
): Promise<OtpChallenge | null> {
  const challenge = challenges.get(phoneNumber);
  if (challenge === undefined || isStale(challenge, now)) {
    challenges.delete(phoneNumber);
    return null;
  }
  return challenge;
}

export async function saveOtpChallenge(input: {
  readonly phoneNumber: PhoneNumber;
  readonly codeHash: string;
  readonly now: number;
  readonly ttlMs: number;
}): Promise<OtpChallenge> {
  sweepExpired(input.now);
  const previous = challenges.get(input.phoneNumber);
  const challenge: OtpChallenge = {
    phoneNumber: input.phoneNumber,
    codeHash: input.codeHash,
    issuedAt: input.now,
    expiresAt: input.now + input.ttlMs,
    attempts: 0,
    lockCount: previous?.lockCount ?? 0,
    lockedUntil: previous?.lockedUntil ?? null,
  };
  challenges.set(input.phoneNumber, challenge);
  return challenge;
}

export async function recordFailedOtpAttempt(input: {
  readonly phoneNumber: PhoneNumber;
  readonly now: number;
}): Promise<OtpChallenge | null> {
  const challenge = await getOtpChallenge(input.phoneNumber, input.now);
  if (challenge === null) return null;
  const attempts = challenge.attempts + 1;
  if (attempts < OTP_MAX_ATTEMPTS) {
    const updated: OtpChallenge = { ...challenge, attempts };
    challenges.set(input.phoneNumber, updated);
    return updated;
  }
  const lockCount = challenge.lockCount + 1;
  const updated: OtpChallenge = {
    ...challenge,
    attempts: 0,
    lockCount,
    lockedUntil: input.now + lockoutMsFor(lockCount),
  };
  challenges.set(input.phoneNumber, updated);
  return updated;
}

export async function clearOtpChallenge(
  phoneNumber: PhoneNumber,
): Promise<void> {
  challenges.delete(phoneNumber);
}
