import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { openAuthDatabase } from "@/lib/db/sqlite";

const HASH_CONTEXT = "vidyagata:mfa-totp:v1";
const DEV_FALLBACK_KEY = "vidyagata-dev-only-mfa-guard";

function guardKey(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret !== undefined && secret.length > 0) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET wajib ada untuk guard kode MFA");
  }
  return DEV_FALLBACK_KEY;
}

export function totpCodeFingerprint(userId: string, code: string): string {
  return createHmac("sha256", guardKey())
    .update(`${HASH_CONTEXT}:${userId}:${code}`)
    .digest("hex");
}

export function wasTotpCodeUsed(userId: string, code: string): boolean {
  const row = openAuthDatabase()
    .prepare("SELECT totpLastCodeHash FROM user WHERE id = ?")
    .get(userId) as { totpLastCodeHash: string | null } | undefined;
  const stored = row?.totpLastCodeHash;
  if (stored === undefined || stored === null) return false;
  const candidate = Buffer.from(totpCodeFingerprint(userId, code), "hex");
  const known = Buffer.from(stored, "hex");
  return candidate.length === known.length && timingSafeEqual(candidate, known);
}

export function markTotpCodeUsed(userId: string, code: string): void {
  openAuthDatabase()
    .prepare("UPDATE user SET totpLastCodeHash = ? WHERE id = ?")
    .run(totpCodeFingerprint(userId, code), userId);
}
