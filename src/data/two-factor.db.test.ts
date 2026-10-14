import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { openAuthDatabase } from "@/lib/db/sqlite";
import { isTwoFactorEnabled, requireOperatorMfa } from "./two-factor";

const session = vi.hoisted(() => ({ userId: "user-mfa-1" }));

vi.mock("@/lib/session", () => ({
  getCurrentUser: async () => ({ id: session.userId }),
}));

const directory = mkdtempSync(join(tmpdir(), "vidyagata-mfa-"));
process.env.VIDYAGATA_DB_FILE = join(directory, "mfa.db");

const STAMP = "2026-10-01T00:00:00.000Z";

function insertUser(id: string): void {
  openAuthDatabase()
    .prepare(
      "INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, 1, ?, ?)",
    )
    .run(id, `Petugas ${id}`, `${id}@example.com`, STAMP, STAMP);
}

function grantOperator(userId: string): void {
  openAuthDatabase()
    .prepare(
      "INSERT INTO user_roles (id, user_id, role, granted_by_user_id, granted_at, revoked_at, reason) VALUES (?, ?, 'operator', NULL, ?, NULL, NULL)",
    )
    .run(`role-${userId}`, userId, STAMP);
}

beforeAll(() => {
  insertUser("user-mfa-1");
  grantOperator("user-mfa-1");
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("isTwoFactorEnabled", () => {
  it("mengembalikan false untuk akun yang belum mengaktifkan", () => {
    expect(isTwoFactorEnabled("user-mfa-1")).toBe(false);
  });

  it("mengembalikan true setelah kolom diaktifkan", () => {
    openAuthDatabase()
      .prepare("UPDATE user SET twoFactorEnabled = 1 WHERE id = ?")
      .run("user-mfa-1");
    expect(isTwoFactorEnabled("user-mfa-1")).toBe(true);
  });

  it("mengembalikan false untuk akun yang tidak ada", () => {
    expect(isTwoFactorEnabled("user-ghost")).toBe(false);
  });
});

describe("requireOperatorMfa", () => {
  it("membiarkan operator dengan dua langkah aktif melewati gate", async () => {
    openAuthDatabase()
      .prepare("UPDATE user SET twoFactorEnabled = 1 WHERE id = ?")
      .run("user-mfa-1");
    const { actor, mfaRequired } = await requireOperatorMfa();
    expect(actor.id).toBe("user-mfa-1");
    expect(mfaRequired).toBe(false);
  });

  it("menandai operator tanpa dua langkah sebagai wajib mendaftar", async () => {
    openAuthDatabase()
      .prepare("UPDATE user SET twoFactorEnabled = 0 WHERE id = ?")
      .run("user-mfa-1");
    const { actor, mfaRequired } = await requireOperatorMfa();
    expect(actor.id).toBe("user-mfa-1");
    expect(mfaRequired).toBe(true);
  });
});
