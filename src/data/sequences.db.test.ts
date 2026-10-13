import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { buildPublicRef, isPublicRef } from "@/domain/financing/public-ref";
import { openAuthDatabase } from "@/lib/db/sqlite";
import { nextSequenceValue } from "./sequences";

const directory = mkdtempSync(join(tmpdir(), "vidyagata-sequences-"));
process.env.VIDYAGATA_DB_FILE = join(directory, "sequences.db");

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("nextSequenceValue", () => {
  it("mulai dari 1 lalu naik satu per pemanggilan", () => {
    const database = openAuthDatabase();
    const scope = { scope: "financing_facility", period: "2026" };
    expect(nextSequenceValue(database, scope)).toBe(1);
    expect(nextSequenceValue(database, scope)).toBe(2);
    expect(nextSequenceValue(database, scope)).toBe(3);
  });

  it("memisahkan urutan per periode dan per scope", () => {
    const database = openAuthDatabase();
    expect(
      nextSequenceValue(database, {
        scope: "financing_facility",
        period: "2027",
      }),
    ).toBe(1);
    expect(
      nextSequenceValue(database, { scope: "payment_receipt", period: "2026" }),
    ).toBe(1);
    expect(
      nextSequenceValue(database, {
        scope: "financing_facility",
        period: "2026",
      }),
    ).toBe(4);
  });

  it("menolak scope dan periode yang tidak valid", () => {
    const database = openAuthDatabase();
    expect(() =>
      nextSequenceValue(database, { scope: "Upper", period: "2026" }),
    ).toThrow(RangeError);
    expect(() =>
      nextSequenceValue(database, { scope: "ab", period: "2026" }),
    ).toThrow(RangeError);
    expect(() =>
      nextSequenceValue(database, { scope: "valid_scope", period: "26" }),
    ).toThrow(RangeError);
  });
});

describe("buildPublicRef", () => {
  it("membangun referensi berformat VG-FIN", () => {
    expect(buildPublicRef({ year: 2026, value: 1 })).toBe("VG-FIN-2026-000001");
    expect(buildPublicRef({ year: 2026, value: 999_999 })).toBe(
      "VG-FIN-2026-999999",
    );
    expect(isPublicRef(buildPublicRef({ year: 2026, value: 42 }))).toBe(true);
    expect(isPublicRef("VG-2026-1")).toBe(false);
    expect(isPublicRef(123)).toBe(false);
  });

  it("menolak nilai di luar batas", () => {
    expect(() => buildPublicRef({ year: 1999, value: 1 })).toThrow(RangeError);
    expect(() => buildPublicRef({ year: 2026, value: 0 })).toThrow(RangeError);
    expect(() => buildPublicRef({ year: 2026, value: 1_000_000 })).toThrow(
      RangeError,
    );
  });
});
