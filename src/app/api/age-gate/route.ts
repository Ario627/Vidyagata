import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateAgeGate, jakartaPlainDateOf } from "@/domain/account/age";
import {
  fingerprintFromHeaders,
  purgeStaleAgeBans,
  recordAgeBan,
} from "@/lib/age-ban";
import { BirthdateInput } from "@/schemas/onboarding";

const MAX_BODY_BYTES = 1024;

const requestSchema = z.object({ birthdate: BirthdateInput });

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
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
