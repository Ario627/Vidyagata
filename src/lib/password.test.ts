import { hashPassword } from "better-auth/crypto";
import { describe, expect, it } from "vitest";
import {
  hashPasswordSecurely,
  isModernPasswordHash,
  needsPasswordRehash,
  verifyStoredPassword,
} from "./password";

const PASSWORD = "RahasiaKuat!2026x";

describe("password", () => {
  it("hash modern bisa diverifikasi", async () => {
    const hash = await hashPasswordSecurely(PASSWORD);
    expect(isModernPasswordHash(hash)).toBe(true);
    expect(await verifyStoredPassword({ hash, password: PASSWORD })).toBe(true);
  });

  it("menolak kata sandi salah pada hash modern", async () => {
    const hash = await hashPasswordSecurely(PASSWORD);
    expect(
      await verifyStoredPassword({ hash, password: "SalahBanget!2026" }),
    ).toBe(false);
  });

  it("menghasilkan salt berbeda tiap hash", async () => {
    const first = await hashPasswordSecurely(PASSWORD);
    const second = await hashPasswordSecurely(PASSWORD);
    expect(first).not.toBe(second);
  });

  it("hash modern terbaru tidak perlu rehash", async () => {
    const hash = await hashPasswordSecurely(PASSWORD);
    expect(needsPasswordRehash(hash)).toBe(false);
  });

  it("mendukung hash lama better-auth dan menandainya perlu rehash", async () => {
    const legacy = await hashPassword(PASSWORD);
    expect(isModernPasswordHash(legacy)).toBe(false);
    expect(needsPasswordRehash(legacy)).toBe(true);
    expect(
      await verifyStoredPassword({ hash: legacy, password: PASSWORD }),
    ).toBe(true);
    expect(
      await verifyStoredPassword({
        hash: legacy,
        password: "SalahBanget!2026",
      }),
    ).toBe(false);
  });

  it("hash rusak ditolak tanpa melempar", async () => {
    expect(
      await verifyStoredPassword({ hash: "vg2$rusak", password: PASSWORD }),
    ).toBe(false);
    expect(isModernPasswordHash("vg2$rusak")).toBe(false);
    expect(needsPasswordRehash("vg2$rusak")).toBe(true);
  });
});
