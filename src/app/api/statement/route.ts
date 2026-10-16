import { type NextRequest, NextResponse } from "next/server";
import {
  getMyStatement,
  type StatementState,
  signMyStatement,
} from "@/data/documents";
import { getCurrentUser } from "@/lib/session";

const SIGNATURE_PREFIX = "data:image/png;base64,";
const MAX_SIGNATURE_DATA_URL = 200_000;

function sameOrigin(request: NextRequest): boolean {
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

function decodeSignatureImage(value: unknown): Uint8Array | null {
  if (typeof value !== "string") return null;
  if (value.length === 0 || value.length > MAX_SIGNATURE_DATA_URL) return null;
  if (!value.startsWith(SIGNATURE_PREFIX)) return null;
  const base64 = value.slice(SIGNATURE_PREFIX.length);
  if (base64.length === 0 || !/^[A-Za-z0-9+/=]+$/.test(base64)) return null;
  try {
    return new Uint8Array(Buffer.from(base64, "base64"));
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (user === null) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const statement: StatementState | null = await getMyStatement();
  return NextResponse.json({ ok: true, statement });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { ok: false, code: "forbidden_origin" },
      { status: 403 },
    );
  }
  const user = await getCurrentUser();
  if (user === null) {
    return NextResponse.json(
      { ok: false, message: "Sesimu berakhir. Masuk lagi lalu ulangi." },
      { status: 401 },
    );
  }
  let payload: { signatureImage?: unknown };
  try {
    payload = (await request.json()) as { signatureImage?: unknown };
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_body" },
      { status: 400 },
    );
  }
  const signaturePng = decodeSignatureImage(payload.signatureImage);
  if (signaturePng === null) {
    return NextResponse.json(
      {
        ok: false,
        fieldError: "Gambar tanda tangan tidak dikenali. Coba gambar ulang.",
      },
      { status: 422 },
    );
  }
  const result = await signMyStatement({ signaturePng });
  if (!result.ok) {
    switch (result.code) {
      case "profile_incomplete":
        return NextResponse.json(
          {
            ok: false,
            message: "Lengkapi profil akademik dulu sebelum menandatangani.",
          },
          { status: 409 },
        );
      case "invalid_signature":
        return NextResponse.json(
          {
            ok: false,
            fieldError: "Gambar tanda tangan tidak valid. Coba gambar ulang.",
          },
          { status: 422 },
        );
      case "already_signed":
        return NextResponse.json({ ok: true, alreadySigned: true });
    }
  }
  return NextResponse.json({ ok: true });
}
