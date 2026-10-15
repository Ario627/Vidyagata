import "server-only";
import { createHmac } from "node:crypto";
import { jakartaPlainDateOf } from "@/domain/account/age";
import { db } from "@/lib/db/client";
import { getServerEnv } from "@/lib/env";

export type AgeBanRecord = {
  readonly eligibleAt: string;
};

const BAN_WINDOW_DAYS = [1, 7, 30] as const;
const BAN_HISTORY_DAYS = 180;
const DAY_MS = 86_400_000;

function windowDaysForAttempt(attempt: number): number {
  const index = Math.min(Math.max(attempt, 1), BAN_WINDOW_DAYS.length) - 1;
  return BAN_WINDOW_DAYS[index] ?? 30;
}

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

export async function findActiveAgeBan(input: {
  readonly fingerprint: string;
  readonly today: string;
}): Promise<AgeBanRecord | null> {
  const row = (await db
    .prepare(
      "SELECT eligible_at FROM age_ban WHERE fingerprint = ? AND eligible_at > ? LIMIT 1",
    )
    .get(input.fingerprint, input.today)) as
    | { eligible_at: string }
    | undefined;
  return row === undefined ? null : { eligibleAt: row.eligible_at };
}

export async function hasActiveAgeBan(headerList: Headers): Promise<boolean> {
  const today = jakartaPlainDateOf(new Date());
  if (today === null) return false;
  const record = await findActiveAgeBan({
    fingerprint: fingerprintFromHeaders(headerList),
    today,
  });
  return record !== null;
}

export async function recordAgeBan(input: {
  readonly fingerprint: string;
  readonly now: Date;
}): Promise<string | null> {
  const row = (await db
    .prepare("SELECT attempts FROM age_ban WHERE fingerprint = ? LIMIT 1")
    .get(input.fingerprint)) as { attempts: number } | undefined;
  const attempt = (row?.attempts ?? 0) + 1;
  const eligibleAt = jakartaPlainDateOf(
    new Date(input.now.getTime() + windowDaysForAttempt(attempt) * DAY_MS),
  );
  if (eligibleAt === null) return null;
  const stamp = input.now.toISOString();
  await db
    .prepare(
      `INSERT INTO age_ban (fingerprint, eligible_at, created_at, updated_at, attempts)
       VALUES (?, ?, ?, ?, 1)
       ON CONFLICT(fingerprint) DO UPDATE SET
         eligible_at = CASE
           WHEN excluded.eligible_at > age_ban.eligible_at THEN excluded.eligible_at
           ELSE age_ban.eligible_at
         END,
         updated_at = excluded.updated_at,
         attempts = age_ban.attempts + 1`,
    )
    .run(input.fingerprint, eligibleAt, stamp, stamp);
  return eligibleAt;
}

export async function purgeStaleAgeBans(now: Date): Promise<void> {
  const cutoff = new Date(now.getTime() - BAN_HISTORY_DAYS * DAY_MS);
  await db
    .prepare("DELETE FROM age_ban WHERE updated_at < ?")
    .run(cutoff.toISOString());
}
