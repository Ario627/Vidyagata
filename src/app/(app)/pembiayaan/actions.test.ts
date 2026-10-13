import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { openAuthDatabase } from "@/lib/db/sqlite";
import {
  grantConsentAction,
  saveDraftAction,
  submitApplicationAction,
} from "./actions";

const session = vi.hoisted(() => ({ userId: "user-actions-1" }));

vi.mock("@/lib/session", () => ({
  getCurrentUser: async () => ({ id: session.userId }),
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

const directory = mkdtempSync(join(tmpdir(), "vidyagata-actions-"));
process.env.VIDYAGATA_DB_FILE = join(directory, "actions.db");

const INSTITUTION_ID = "01J8ZZZZZZZZZZZZZZZZZZZZZZ";

beforeAll(() => {
  const database = openAuthDatabase();
  const stamp = "2026-01-01T00:00:00.000Z";
  database
    .prepare(
      "INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (?, 'Sari Uji', 'sari-actions@example.com', 1, ?, ?)",
    )
    .run(session.userId, stamp, stamp);
  database
    .prepare(
      "INSERT INTO institutions (id, name, slug, type, city, province, verification_method, partnership_status, created_at, updated_at) VALUES (?, 'Kampus Aksi', 'kampus-aksi', 'university', 'Depok', 'Jawa Barat', 'manual_document', 'prospect', ?, ?)",
    )
    .run(INSTITUTION_ID, stamp, stamp);
  database
    .prepare(
      "INSERT INTO students (id, user_id, full_name, date_of_birth, academic_status, province, city, created_at, updated_at) VALUES ('student-actions-1', ?, 'Sari Uji', '2005-01-01', 'undergraduate', 'Jawa Barat', 'Depok', ?, ?)",
    )
    .run(session.userId, stamp, stamp);
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("saveDraftAction", () => {
  it("menyimpan nominal dan tujuan pada draft yang sama", async () => {
    const first = await saveDraftAction({ institutionId: INSTITUTION_ID });
    expect(first.ok).toBe(true);
    const second = await saveDraftAction({
      requestedAmount: 5_000_000,
      purpose: "tuition",
    });
    expect(second.ok).toBe(true);
    const row = openAuthDatabase()
      .prepare(
        "SELECT institution_id, requested_amount, academic_purpose FROM financing_facilities LIMIT 1",
      )
      .get() as {
      institution_id: string | null;
      requested_amount: number | null;
      academic_purpose: string | null;
    };
    expect(row.institution_id).toBe(INSTITUTION_ID);
    expect(row.requested_amount).toBe(5_000_000);
    expect(row.academic_purpose).toBe("tuition");
  });

  it("menolak field asing alih-alih membuangnya diam-diam", async () => {
    const result = await saveDraftAction({
      requestedAmount: 5_000_000,
      academicPurpose: "tuition",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("invalid_input");
  });

  it("menolak id kampus yang bukan ULID", async () => {
    const result = await saveDraftAction({ institutionId: "kampus-1" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("invalid_input");
  });
});

describe("grantConsentAction", () => {
  it("idempoten saat persetujuan sudah tercatat", async () => {
    const first = await grantConsentAction();
    const second = await grantConsentAction();
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    const count = openAuthDatabase()
      .prepare("SELECT COUNT(*) AS total FROM consent_records")
      .get() as { total: number };
    expect(count.total).toBe(1);
  });
});

describe("submitApplicationAction", () => {
  it("menolak id fasilitas yang bukan ULID", async () => {
    const result = await submitApplicationAction("bukan-ulid");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("invalid_input");
  });

  it("meneruskan kegagalan domain sebagai kode, bukan pesan mentah", async () => {
    const result = await submitApplicationAction("01J8ZZZZZZZZZZZZZZZZZZZZZY");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("facility_not_found");
  });
});
