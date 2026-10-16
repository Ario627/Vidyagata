import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  buildStatusTimeline,
  mergeOccurredAt,
} from "@/domain/financing/timeline";
import { rupiah } from "@/domain/money/money";
import type { PlainDate } from "@/domain/time/plain-date";
import { openAuthDatabase } from "@/lib/db/sqlite";
import { recordConsent } from "./consents";
import {
  cancelMyFacility,
  getMyFacilityTimeline,
  listMyFacilities,
  saveMyDraft,
  submitMyFacility,
} from "./financing";
import { saveStudentProfile } from "./students";

const session = vi.hoisted(() => ({ userId: "user-timeline-1" }));

vi.mock("@/lib/session", () => ({
  getCurrentUser: async () => ({ id: session.userId }),
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

const directory = mkdtempSync(join(tmpdir(), "vidyagata-timeline-"));
process.env.VIDYAGATA_DB_FILE = join(directory, "timeline.db");

const INSTITUTION_ID = "inst-timeline-1";

beforeAll(async () => {
  const database = openAuthDatabase();
  const stamp = "2026-01-01T00:00:00.000Z";
  const insertUser = database.prepare(
    "INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, 1, ?, ?)",
  );
  insertUser.run(
    session.userId,
    "Sari Timeline",
    "sari-timeline@example.com",
    stamp,
    stamp,
  );
  insertUser.run(
    "user-timeline-2",
    "Budi Timeline",
    "budi-timeline@example.com",
    stamp,
    stamp,
  );
  database
    .prepare(
      `INSERT INTO institutions (id, name, slug, type, city, province, verification_method, partnership_status, created_at, updated_at)
       VALUES (?, 'Kampus Timeline', 'kampus-timeline', 'university', 'Depok', 'Jawa Barat', 'manual_document', 'prospect', ?, ?)`,
    )
    .run(INSTITUTION_ID, stamp, stamp);
  await saveStudentProfile({
    fullName: "Sari Timeline",
    dateOfBirth: "2005-01-01" as PlainDate,
    academicStatus: "undergraduate",
    province: "Jawa Barat",
    city: "Depok",
  });
  await recordConsent({ key: "data_processing", grantedVia: "checkbox" });
  const student = database
    .prepare("SELECT id FROM students WHERE user_id = ?")
    .get(session.userId) as { id: string };
  database
    .prepare(
      `INSERT INTO student_documents (
        id, student_id, kind, mime, byte_size, sha256, data, created_at, updated_at
      ) VALUES ('doc-timeline-proof', ?, 'purpose_proof', 'application/pdf', 4, ?, ?, ?, ?)`,
    )
    .run(
      student.id,
      "b".repeat(64),
      new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      stamp,
      stamp,
    );
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("getMyFacilityTimeline", () => {
  it("mengembalikan fasilitas dan transisi yang tercatat", async () => {
    const draft = await saveMyDraft({
      institutionId: INSTITUTION_ID,
      requestedAmount: rupiah(4_000_000),
      academicPurpose: "tuition",
      purposeNote:
        "Dana dipakai untuk melunasi UKT semester berjalan sesuai tagihan kampus.",
    });
    await submitMyFacility(draft.id);
    const detail = await getMyFacilityTimeline(draft.id);
    expect(detail?.facility.id).toBe(draft.id);
    expect(detail?.transitions.map((transition) => transition.status)).toEqual([
      "submitted",
    ]);
    const occurredAt = mergeOccurredAt([
      { status: "draft", occurredAt: detail?.facility.createdAt ?? null },
      {
        status: "submitted",
        occurredAt: detail?.facility.submittedAt ?? null,
      },
      ...(detail?.transitions ?? []),
    ]);
    const steps = buildStatusTimeline({
      current: detail?.facility.status ?? "draft",
      occurredAt,
    });
    expect(steps[0]?.status).toBe("draft");
    expect(steps[0]?.state).toBe("done");
    expect(steps[1]?.status).toBe("submitted");
    expect(steps[1]?.state).toBe("current");
    expect(steps[1]?.occurredAt).toBe(detail?.facility.submittedAt);
  });

  it("mencatat pembatalan dan mengakhiri timeline", async () => {
    const list = await listMyFacilities();
    const submitted = list.find((facility) => facility.status === "submitted");
    if (submitted === undefined) throw new Error("fasilitas uji tidak ada");
    await cancelMyFacility(submitted.id);
    const detail = await getMyFacilityTimeline(submitted.id);
    const statuses = detail?.transitions.map((transition) => transition.status);
    expect(statuses).toContain("submitted");
    expect(statuses).toContain("cancelled");
    const occurredAt = mergeOccurredAt([
      { status: "draft", occurredAt: detail?.facility.createdAt ?? null },
      {
        status: "submitted",
        occurredAt: detail?.facility.submittedAt ?? null,
      },
      ...(detail?.transitions ?? []),
    ]);
    const steps = buildStatusTimeline({
      current: "cancelled",
      occurredAt,
    });
    expect(steps.at(-1)?.status).toBe("cancelled");
    expect(steps.at(-1)?.state).toBe("stopped");
    expect(steps.some((step) => step.state === "upcoming")).toBe(false);
  });

  it("mengembalikan null untuk pengguna lain dan id yang tidak ada", async () => {
    const list = await listMyFacilities();
    const target = list[0];
    if (target === undefined) throw new Error("fasilitas uji tidak ada");
    session.userId = "user-timeline-2";
    expect(await getMyFacilityTimeline(target.id)).toBeNull();
    session.userId = "user-timeline-1";
    expect(
      await getMyFacilityTimeline("01J8ZZZZZZZZZZZZZZZZZZZZZY"),
    ).toBeNull();
  });
});
