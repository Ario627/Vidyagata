import "server-only";
import { createHmac } from "node:crypto";
import { jakartaPlainDateOf } from "@/domain/account/age";
import { openAuthDatabase } from "@/lib/db/sqlite";
import { getServerEnv } from "@/lib/env";

export type AgeBanRecord = {
  readonly eligibleAt: string;
};

function clientIpFromHeaderList(headerList: Headers): string {
  const realIp = headerList.get("x-real-ip");
  if (realIp !== null && realIp !== "") return realIp;
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor !== null && forwardedFor !== "") {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first !== undefined && first !== "") return first;
  }
  return "unknown";
}

export function fingerprintFromHeaders(headerList: Headers): string {
  const ip = clientIpFromHeaderList(headerList);
  const userAgent = headerList.get("user-agent") ?? "unknown";
  return createHmac("sha256", getServerEnv().OTP_PEPPER)
    .update(`age-ban|${ip}|${userAgent}`)
    .digest("hex");
}

export function findActiveAgeBan(input: {
  readonly fingerprint: string;
  readonly today: string;
}): AgeBanRecord | null {
  const row = openAuthDatabase()
    .prepare(
      "SELECT eligible_at FROM age_ban WHERE fingerprint = ? AND eligible_at > ? LIMIT 1",
    )
    .get(input.fingerprint, input.today) as { eligible_at: string } | undefined;
  return row === undefined ? null : { eligibleAt: row.eligible_at };
}

export function hasActiveAgeBan(headerList: Headers): boolean {
  const today = jakartaPlainDateOf(new Date());
  if (today === null) return false;
  return (
    findActiveAgeBan({
      fingerprint: fingerprintFromHeaders(headerList),
      today,
    }) !== null
  );
}

export function recordAgeBan(input: {
  readonly fingerprint: string;
  readonly eligibleAt: string;
  readonly now: Date;
}): void {
  const stamp = input.now.toISOString();
  openAuthDatabase()
    .prepare(
      `INSERT INTO age_ban (fingerprint, eligible_at, created_at, updated_at, attempts)
       VALUES (?, ?, ?, ?, 1)
       ON CONFLICT(fingerprint) DO UPDATE SET
         eligible_at = MAX(eligible_at, excluded.eligible_at),
         updated_at = excluded.updated_at,
         attempts = attempts + 1`,
    )
    .run(input.fingerprint, input.eligibleAt, stamp, stamp);
}

export function purgeExpiredAgeBans(today: string): void {
  openAuthDatabase()
    .prepare("DELETE FROM age_ban WHERE eligible_at <= ?")
    .run(today);
}
