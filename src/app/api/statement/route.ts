import { type NextRequest, NextResponse } from "next/server";
import {
  getMyStatement,
  type StatementState,
  signMyStatement,
} from "@/data/documents";
import { getCurrentUser } from "@/lib/session";

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
  let payload: { signedName?: unknown };
  try {
    payload = (await request.json()) as { signedName?: unknown };
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_body" },
      { status: 400 },
    );
  }
  const signedName =
    typeof payload.signedName === "string" ? payload.signedName.trim() : "";
  if (signedName.length < 3 || signedName.length > 80) {
    return NextResponse.json(
      { ok: false, fieldError: "Tulis nama lengkapmu (3–80 karakter)." },
      { status: 422 },
    );
  }
  const result = await signMyStatement({ signedName });
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
      case "name_mismatch":
        return NextResponse.json(
          {
            ok: false,
            fieldError:
              "Nama harus sama persis dengan nama lengkap di profilmu.",
          },
          { status: 422 },
        );
      case "already_signed":
        return NextResponse.json({ ok: true, alreadySigned: true });
    }
  }
  return NextResponse.json({ ok: true });
}
