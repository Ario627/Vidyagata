import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateAgeGate, jakartaPlainDateOf } from "@/domain/account/age";
import {
  fingerprintFromHeaders,
  purgeStaleAgeBans,
  recordAgeBan,
} from "@/lib/age-ban";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { BirthdateInput } from "@/schemas/onboarding";

const MAX_BODY_BYTES = 1024;

const requestSchema = z.object({ birthdate: BirthdateInput });

function normalizeOrigin(value: string | undefined): string | null {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isSameOrigin(request: Request): boolean {
  const originHeader = request.headers.get("origin");

  if (originHeader === null) return true;

  const origin = normalizeOrigin(originHeader);
  if (origin === null) return false;

  const allowedOrigins = [
    process.env.APP_ORIGIN,
    process.env.URL,
    process.env.BETTER_AUTH_URL,
    ...(process.env.NODE_ENV === "development"
      ? ["http://localhost:3000"]
      : []),
  ]
    .map(normalizeOrigin)
    .filter((value): value is string => value !== null);

  if (allowedOrigins.includes(origin)) return true;

  const host = request.headers.get("host");
  if (host === null) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: "origin_tidak_diizinkan" },
      { status: 403 },
    );
  }
  const limited = await enforceRateLimit(request, {
    name: "age-gate",
    limit: 15,
    windowSeconds: 600,
  });
  if (limited !== null) return limited;
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "muatan_terlalu_besar" },
      { status: 413 },
    );
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "muatan_tidak_valid" }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "tanggal_lahir_tidak_valid" },
      { status: 400 },
    );
  }
  const today = jakartaPlainDateOf(new Date());
  if (today === null) {
    return NextResponse.json(
      { error: "pemeriksaan_tidak_tersedia" },
      { status: 503 },
    );
  }
  const decision = evaluateAgeGate(parsed.data.birthdate, today);
  if (decision.kind === "eligible") {
    return NextResponse.json({ eligible: true, age: decision.age });
  }
  const now = new Date();
  const eligibleAt = await recordAgeBan({
    fingerprint: fingerprintFromHeaders(request.headers),
    now,
  });
  await purgeStaleAgeBans(now);
  return NextResponse.json({ eligible: false, eligibleAt });
}
