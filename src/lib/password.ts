import "server-only";
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { verifyPassword } from "better-auth/crypto";

const HASH_PREFIX = "vg2";
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const MAX_MEMORY_BYTES = 134_217_728;
const SCRYPT_PARAMS = {
  N: 65_536,
  r: 8,
  p: 2,
} as const;

type ScryptParams = {
  readonly N: number;
  readonly r: number;
  readonly p: number;
};

type ParsedPasswordHash = {
  readonly params: ScryptParams;
  readonly salt: Buffer;
  readonly key: Buffer;
};

function deriveKey(
  password: string,
  salt: Buffer,
  params: ScryptParams,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      KEY_LENGTH,
      { ...params, maxmem: MAX_MEMORY_BYTES },
      (error, derived) => {
        if (error !== null) {
          reject(error);
          return;
        }
        resolve(derived);
      },
    );
  });
}

function isSafeParam(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 2 && value <= 1_048_576;
}

function parsePasswordHash(hash: string): ParsedPasswordHash | null {
  const parts = hash.split("$");
  if (parts.length !== 6) return null;
  const [prefix, nText, rText, pText, saltText, keyText] = parts;
  if (
    prefix !== HASH_PREFIX ||
    nText === undefined ||
    rText === undefined ||
    pText === undefined ||
    saltText === undefined ||
    keyText === undefined
  ) {
    return null;
  }
  const N = Number(nText);
  const r = Number(rText);
  const p = Number(pText);
  if (!isSafeParam(N) || !isSafeParam(r) || !isSafeParam(p)) return null;
  const salt = Buffer.from(saltText, "base64url");
  const key = Buffer.from(keyText, "base64url");
  if (salt.length === 0 || key.length !== KEY_LENGTH) return null;
  return { params: { N, r, p }, salt, key };
}

export function isModernPasswordHash(hash: string): boolean {
  return parsePasswordHash(hash) !== null;
}

export function needsPasswordRehash(hash: string): boolean {
  const parsed = parsePasswordHash(hash);
  if (parsed === null) return true;
  return (
    parsed.params.N !== SCRYPT_PARAMS.N ||
    parsed.params.r !== SCRYPT_PARAMS.r ||
    parsed.params.p !== SCRYPT_PARAMS.p
  );
}

export async function hashPasswordSecurely(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt, SCRYPT_PARAMS);
  return [
    HASH_PREFIX,
    SCRYPT_PARAMS.N,
    SCRYPT_PARAMS.r,
    SCRYPT_PARAMS.p,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyStoredPassword(input: {
  readonly hash: string;
  readonly password: string;
}): Promise<boolean> {
  const parsed = parsePasswordHash(input.hash);
  if (parsed === null) {
    try {
      return await verifyPassword({
        hash: input.hash,
        password: input.password,
      });
    } catch {
      return false;
    }
  }
  const derived = await deriveKey(input.password, parsed.salt, parsed.params);
  if (derived.length !== parsed.key.length) return false;
  return timingSafeEqual(derived, parsed.key);
}
