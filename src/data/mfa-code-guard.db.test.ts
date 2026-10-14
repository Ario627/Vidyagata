import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { openAuthDatabase } from "@/lib/db/sqlite";
import {
  markTotpCodeUsed,
  totpCodeFingerprint,
  wasTotpCodeUsed,
} from "./mfa-code-guard";

const directory = mkdtempSync(join(tmpdir(), "vidyagata-mfa-guard-"));
process.env.VIDYAGATA_DB_FILE = join(directory, "guard.db");

const STAMP = "2026-10-01T00:00:00.000Z";

function insertUser(id: string) {
  openAuthDatabase()
    .prepare(
      "INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, 1, ?, ?)",
    )
    .run(id, `Petugas ${id}`, `${id}@example.com`, STAMP, STAMP);
}

beforeAll(() => {
  insertUser("guard-user-1");
  insertUser("guard-user-2");
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("totpCodeFingerprint", () => {
  it("deterministik untuk pasangan user dan kode yang sama", () => {
    expect(totpCodeFingerprint("guard-user-1", "123456")).toBe(
      totpCodeFingerprint("guard-user-1", "123456"),
    );
  });

  it("berbeda untuk kode yang berbeda", () => {
    expect(totpCodeFingerprint("guard-user-1", "123456")).not.toBe(
      totpCodeFingerprint("guard-user-1", "654321"),
    );
  });

  it("berbeda untuk pengguna yang berbeda", () => {
    expect(totpCodeFingerprint("guard-user-1", "123456")).not.toBe(
      totpCodeFingerprint("guard-user-2", "123456"),
    );
  });

  it("tidak menyimpan kode mentah", () => {
    expect(totpCodeFingerprint("guard-user-1", "123456")).not.toContain(
      "123456",
    );
  });
});

describe("wasTotpCodeUsed dan markTotpCodeUsed", () => {
  it("mengembalikan false saat belum ada kode yang dipakai", () => {
    expect(wasTotpCodeUsed("guard-user-1", "111111")).toBe(false);
  });

  it("mengembalikan true setelah kode ditandai dipakai", () => {
    markTotpCodeUsed("guard-user-1", "111111");
    expect(wasTotpCodeUsed("guard-user-1", "111111")).toBe(true);
  });

  it("hanya menyimpan kode terakhir sebagai yang terpakai", () => {
    markTotpCodeUsed("guard-user-1", "222222");
    expect(wasTotpCodeUsed("guard-user-1", "111111")).toBe(false);
    expect(wasTotpCodeUsed("guard-user-1", "222222")).toBe(true);
  });

  it("tidak membocorkan pemakaian ke pengguna lain", () => {
    expect(wasTotpCodeUsed("guard-user-2", "222222")).toBe(false);
  });

  it("mengembalikan false untuk pengguna yang tidak ada", () => {
    expect(wasTotpCodeUsed("guard-user-ghost", "222222")).toBe(false);
  });

  it("gagal tertutup di produksi tanpa BETTER_AUTH_SECRET", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");
    try {
      expect(() => totpCodeFingerprint("guard-user-1", "123456")).toThrow(
        /BETTER_AUTH_SECRET/,
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
