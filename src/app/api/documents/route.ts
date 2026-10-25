import { type NextRequest, NextResponse } from "next/server";
import { saveStudentDocument } from "@/data/documents";
import { enforceRateLimit, isSameOrigin } from "@/lib/http/rate-limit";
import { getCurrentUser } from "@/lib/session";

const ERROR_STATUS: Readonly<Record<string, number>> = {
  invalid_kind: 400,
  invalid_type: 415,
  too_large: 413,
  profile_incomplete: 409,
};

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  invalid_kind: "Jenis dokumen tidak dikenal.",
  invalid_type: "Format file tidak didukung. Pakai JPG, PNG, atau PDF.",
  too_large: "Ukuran file melebihi 4 MB. Kompres dulu lalu coba lagi.",
  profile_incomplete:
    "Lengkapi profil akademik dulu sebelum mengunggah dokumen.",
};

function sameOrigin(request: NextRequest): boolean {
  return isSameOrigin(request);
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
      { ok: false, code: "unauthorized" },
      { status: 401 },
    );
  }
  const limited = await enforceRateLimit(
    request,
    { name: "document-upload", limit: 30, windowSeconds: 3600 },
    user.id,
  );
  if (limited !== null) return limited;
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_body" },
      { status: 400 },
    );
  }
  const kind = form.get("kind");
  const file = form.get("file");
  if (typeof kind !== "string" || !(file instanceof File)) {
    return NextResponse.json(
      { ok: false, code: "invalid_body" },
      { status: 400 },
    );
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await saveStudentDocument({ kind, bytes });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: result.code, message: ERROR_MESSAGES[result.code] },
      { status: ERROR_STATUS[result.code] ?? 400 },
    );
  }
  return NextResponse.json({ ok: true, document: result.document });
}
