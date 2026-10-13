import { describe, expect, it } from "vitest";
import type { JobSearchDocument } from "./search";
import { matchesJobQuery, tokenizeJobQuery } from "./search";

const BARISTA: JobSearchDocument = {
  title: "Barista Part-time",
  city: "Depok",
  employerName: "Kopi Rakyat Indonesia",
  skills: ["Kerja tim", "Pelayanan pelanggan", "Pengolahan kopi"],
};

const WRITER: JobSearchDocument = {
  title: "Penulis Konten",
  city: "Bandung",
  employerName: "Studio Kreasi Nusantara",
  skills: ["Bahasa Indonesia", "Penulisan", "Riset kata kunci"],
};

describe("tokenizeJobQuery", () => {
  it("memecah kata, menurunkan huruf, dan membuang spasi berlebih", () => {
    expect(tokenizeJobQuery("  Barista   Kopi ")).toEqual(["barista", "kopi"]);
    expect(tokenizeJobQuery("")).toEqual([]);
    expect(tokenizeJobQuery("   ")).toEqual([]);
  });
});

describe("matchesJobQuery", () => {
  it("cocok tanpa kata kunci untuk semua dokumen", () => {
    expect(matchesJobQuery(BARISTA, [])).toBe(true);
    expect(matchesJobQuery(WRITER, [])).toBe(true);
  });

  it("mencocokkan judul, kota, nama mitra, dan keterampilan tanpa peduli huruf besar-kecil", () => {
    expect(matchesJobQuery(BARISTA, tokenizeJobQuery("barista"))).toBe(true);
    expect(matchesJobQuery(BARISTA, tokenizeJobQuery("DEPOK"))).toBe(true);
    expect(matchesJobQuery(BARISTA, tokenizeJobQuery("kopi rakyat"))).toBe(
      true,
    );
    expect(matchesJobQuery(BARISTA, tokenizeJobQuery("pengolahan kopi"))).toBe(
      true,
    );
    expect(matchesJobQuery(WRITER, tokenizeJobQuery("figma"))).toBe(false);
  });

  it("mewajibkan semua kata kunci terpenuhi", () => {
    expect(matchesJobQuery(BARISTA, tokenizeJobQuery("barista depok"))).toBe(
      true,
    );
    expect(matchesJobQuery(BARISTA, tokenizeJobQuery("barista bandung"))).toBe(
      false,
    );
  });

  it("deterministik untuk input identik", () => {
    const tokens = tokenizeJobQuery("kopi");
    expect(matchesJobQuery(BARISTA, tokens)).toBe(
      matchesJobQuery(BARISTA, tokens),
    );
  });
});
