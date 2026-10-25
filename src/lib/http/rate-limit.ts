import "server-only";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export type RateLimitPolicy = {
  readonly name: string;
  readonly limit: number;
  readonly windowSeconds: number;
};

type RateLimitDecision = {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterSeconds: number;
};

const UPSERT_HIT = `INSERT INTO api_rate_limits (
  bucket, window_start, hits, expires_at
) VALUES (?, ?, 1, ?)
ON CONFLICT (bucket, window_start)
DO UPDATE SET hits = api_rate_limits.hits + 1`;

const READ_HITS = `SELECT hits FROM api_rate_limits
WHERE bucket = ? AND window_start = ?`;

const PURGE_EXPIRED = `DELETE FROM api_rate_limits WHERE expires_at < ?`;

function clientFingerprint(request: Request, subject: string | null): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    request.headers.get("x-real-ip") ??
    forwarded?.split(",")[0]?.trim() ??
    "unknown";
  const userAgent = request.headers.get("user-agent") ?? "";
  return createHash("sha256")
    .update(`${subject ?? ""}|${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return false;
  const host = request.headers.get("host");
  if (host === null) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function consumeRateLimit(
  request: Request,
  policy: RateLimitPolicy,
  subject: string | null = null,
): Promise<RateLimitDecision> {
  const now = Date.now();
  const windowMs = policy.windowSeconds * 1000;
  const windowStart = new Date(
    Math.floor(now / windowMs) * windowMs,
  ).toISOString();
  const expiresAt = new Date(
    Math.floor(now / windowMs) * windowMs + windowMs,
  ).toISOString();
  const bucket = `${policy.name}:${clientFingerprint(request, subject)}`;
  await db.prepare(UPSERT_HIT).run(bucket, windowStart, expiresAt);
  const row = (await db.prepare(READ_HITS).get(bucket, windowStart)) as
    | { hits: number }
    | undefined;
  const hits = row?.hits ?? 1;
  if (Math.random() < 0.02) {
    await db
      .prepare(PURGE_EXPIRED)
      .run(new Date(now - 86_400_000).toISOString());
  }
  return {
    allowed: hits <= policy.limit,
    remaining: Math.max(0, policy.limit - hits),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((Date.parse(expiresAt) - now) / 1000),
    ),
  };
}

export async function enforceRateLimit(
  request: Request,
  policy: RateLimitPolicy,
  subject: string | null = null,
): Promise<NextResponse | null> {
  const decision = await consumeRateLimit(request, policy, subject);
  if (decision.allowed) return null;
  return NextResponse.json(
    {
      ok: false,
      code: "rate_limited",
      message: `Terlalu banyak permintaan. Coba lagi dalam ${decision.retryAfterSeconds} detik.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(decision.retryAfterSeconds),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}
