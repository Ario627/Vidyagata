import "server-only";
import { lockoutMsFor, OTP_MAX_ATTEMPTS } from "@/lib/crypto/otp";
import { openAuthDatabase } from "@/lib/db/sqlite";
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

type OtpChallengeRow = {
  phoneNumber: string;
  codeHash: string;
  issuedAt: number;
  expiresAt: number;
  attempts: number;
  lockCount: number;
  lockedUntil: number | null;
};

const COLUMNS =
  "phoneNumber, codeHash, issuedAt, expiresAt, attempts, lockCount, lockedUntil";

const SELECT_ONE = `SELECT ${COLUMNS} FROM otp_challenge WHERE phoneNumber = ?`;

const UPSERT = `INSERT INTO otp_challenge (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(phoneNumber) DO UPDATE SET
  codeHash = excluded.codeHash,
  issuedAt = excluded.issuedAt,
  expiresAt = excluded.expiresAt,
  attempts = excluded.attempts,
  lockCount = excluded.lockCount,
  lockedUntil = excluded.lockedUntil`;

const UPDATE_STATE =
  "UPDATE otp_challenge SET attempts = ?, lockCount = ?, lockedUntil = ? WHERE phoneNumber = ?";

const DELETE_ONE = "DELETE FROM otp_challenge WHERE phoneNumber = ?";

const SWEEP =
  "DELETE FROM otp_challenge WHERE expiresAt <= ? AND (lockedUntil IS NULL OR lockedUntil <= ?)";

function toChallenge(row: OtpChallengeRow): OtpChallenge {
  return {
    phoneNumber: row.phoneNumber as PhoneNumber,
    codeHash: row.codeHash,
    issuedAt: row.issuedAt,
    expiresAt: row.expiresAt,
    attempts: row.attempts,
    lockCount: row.lockCount,
    lockedUntil: row.lockedUntil,
  };
}

function isStale(challenge: OtpChallenge, now: number): boolean {
  return challenge.expiresAt <= now && (challenge.lockedUntil ?? 0) <= now;
}

function sweepExpired(now: number): void {
  openAuthDatabase().prepare(SWEEP).run(now, now);
}

export async function getOtpChallenge(
  phoneNumber: PhoneNumber,
  now: number,
): Promise<OtpChallenge | null> {
  const row = openAuthDatabase().prepare(SELECT_ONE).get(phoneNumber) as
    | OtpChallengeRow
    | undefined;
  if (row === undefined) return null;
  const challenge = toChallenge(row);
  if (!isStale(challenge, now)) return challenge;
  openAuthDatabase().prepare(DELETE_ONE).run(phoneNumber);
  return null;
}

export async function saveOtpChallenge(input: {
  readonly phoneNumber: PhoneNumber;
  readonly codeHash: string;
  readonly now: number;
  readonly ttlMs: number;
}): Promise<OtpChallenge> {
  sweepExpired(input.now);
  const previous = await getOtpChallenge(input.phoneNumber, input.now);
  const challenge: OtpChallenge = {
    phoneNumber: input.phoneNumber,
    codeHash: input.codeHash,
    issuedAt: input.now,
    expiresAt: input.now + input.ttlMs,
    attempts: 0,
    lockCount: previous?.lockCount ?? 0,
    lockedUntil: previous?.lockedUntil ?? null,
  };
  openAuthDatabase()
    .prepare(UPSERT)
    .run(
      challenge.phoneNumber,
      challenge.codeHash,
      challenge.issuedAt,
      challenge.expiresAt,
      challenge.attempts,
      challenge.lockCount,
      challenge.lockedUntil,
    );
  return challenge;
}

export async function recordFailedOtpAttempt(input: {
  readonly phoneNumber: PhoneNumber;
  readonly now: number;
}): Promise<OtpChallenge | null> {
  const challenge = await getOtpChallenge(input.phoneNumber, input.now);
  if (challenge === null) return null;
  const attempts = challenge.attempts + 1;
  const updated =
    attempts < OTP_MAX_ATTEMPTS
      ? { ...challenge, attempts }
      : {
          ...challenge,
          attempts: 0,
          lockCount: challenge.lockCount + 1,
          lockedUntil: input.now + lockoutMsFor(challenge.lockCount + 1),
        };
  openAuthDatabase()
    .prepare(UPDATE_STATE)
    .run(
      updated.attempts,
      updated.lockCount,
      updated.lockedUntil,
      updated.phoneNumber,
    );
  return updated;
}

export async function clearOtpChallenge(
  phoneNumber: PhoneNumber,
): Promise<void> {
  openAuthDatabase().prepare(DELETE_ONE).run(phoneNumber);
}
