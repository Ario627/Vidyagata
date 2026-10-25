import { type NextRequest, NextResponse } from "next/server";
import { recordAudit } from "@/data/audit";
import { saveStudentProfile } from "@/data/students";
import { parsePlainDate } from "@/domain/time/plain-date";
import { db } from "@/lib/db/client";
import { enforceRateLimit, isSameOrigin } from "@/lib/http/rate-limit";
import { getCurrentUser } from "@/lib/session";
import {
  ProfilePayload,
  parseGpaHundredths,
  profileFieldErrors,
} from "@/schemas/profile";

function sameOrigin(request: NextRequest): boolean {
  return isSameOrigin(request);
}

async function updateUserName(userId: string, name: string): Promise<void> {
  const row = (await db
    .prepare('SELECT "name" FROM "user" WHERE "id" = ?')
    .get(userId)) as { name: string } | undefined;
  if (row === undefined || row.name === name) return;
  await db
    .prepare('UPDATE "user" SET "name" = ? WHERE "id" = ?')
    .run(name, userId);
  await recordAudit({
    actorType: "user",
    actorId: userId,
    action: "user.name_updated",
    entityType: "user",
    entityId: userId,
    before: { name: row.name },
    after: { name },
  });
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
  const limited = await enforceRateLimit(
    request,
    { name: "profile-update", limit: 20, windowSeconds: 600 },
    user.id,
  );
  if (limited !== null) return limited;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_body" },
      { status: 400 },
    );
  }
  const parsed = ProfilePayload.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: profileFieldErrors(parsed.error) },
      { status: 422 },
    );
  }
  const birthdate = (user as { birthdate?: unknown }).birthdate;
  if (typeof birthdate !== "string" || birthdate.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Tanggal lahir belum tercatat di akunmu. Hubungi kami lewat halaman pengaduan supaya bisa dilengkapi.",
      },
      { status: 409 },
    );
  }
  const parsedBirthdate = parsePlainDate(birthdate);
  if (!parsedBirthdate.ok) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Tanggal lahir di akunmu tidak dikenali. Hubungi kami lewat halaman pengaduan supaya bisa dilengkapi.",
      },
      { status: 409 },
    );
  }
  const data = parsed.data;
  try {
    await saveStudentProfile({
      fullName: data.fullName,
      dateOfBirth: parsedBirthdate.value,
      academicStatus: data.academicStatus,
      currentSemester: data.currentSemester,
      gpaHundredths: parseGpaHundredths(data.gpa),
      institutionId: data.institutionId,
      province: data.province,
      city: data.city,
      addressLine: data.addressLine,
      hobby: data.hobby,
      bio: data.bio,
    });
    await updateUserName(user.id, data.fullName);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("institution_not_found")) {
      return NextResponse.json(
        { ok: false, errors: { institutionId: "Kampus tidak dikenal." } },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { ok: false, message: "Profil gagal disimpan. Coba lagi sebentar lagi." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
