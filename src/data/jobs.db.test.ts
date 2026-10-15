import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { matchesJobQuery, tokenizeJobQuery } from "@/domain/work/search";
import { openAuthDatabase } from "@/lib/db/sqlite";
import { selectJobCatalog, selectJobPostingDetail } from "./jobs";

const directory = mkdtempSync(join(tmpdir(), "vidyagata-jobs-"));
process.env.VIDYAGATA_DB_FILE = join(directory, "jobs.db");

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("selectJobCatalog", () => {
  it("menyemai katalog aktif terurut dari yang terbaru", () => {
    return selectJobCatalog().then((catalog) => {
      expect(catalog).toHaveLength(30);
      const published = catalog.map((posting) => posting.publishedAt);
      for (let index = 1; index < published.length; index += 1) {
        const previous = published[index - 1];
        const current = published[index];
        if (previous === null || previous === undefined) continue;
        if (current === null || current === undefined) continue;
        expect(previous >= current).toBe(true);
      }
      const barista = catalog.find(
        (posting) => posting.title === "Barista Part-time",
      );
      expect(barista?.employerName).toBe("Kopi Rakyat Indonesia");
      expect(barista?.employerSector).toBe("Makanan dan minuman");
      expect(barista?.weeklyHours).toBe(16);
      expect(barista?.skills).toEqual([
        "Kerja tim",
        "Pelayanan pelanggan",
        "Pengolahan kopi",
      ]);
    });
  });

  it("menghormati penyaring pencarian di atas katalog", async () => {
    const catalog = await selectJobCatalog();
    const kopi = catalog.filter((posting) =>
      matchesJobQuery(posting, tokenizeJobQuery("kopi")),
    );
    expect(kopi.map((posting) => posting.title).sort()).toEqual([
      "Admin Media Sosial",
      "Barista Part-time",
      "Barista Shift Sore",
      "Penjaga Kios Malam",
    ]);
    const remote = catalog.filter((posting) =>
      matchesJobQuery(posting, tokenizeJobQuery("remote")),
    );
    expect(remote).toHaveLength(0);
    const data = catalog.filter((posting) =>
      matchesJobQuery(posting, tokenizeJobQuery("analisis data")),
    );
    expect(data.map((posting) => posting.title).sort()).toEqual([
      "Analis Data Junior",
      "Asisten Riset Data",
      "Verifikator Data Survei",
    ]);
  });

  it("menyembunyikan lowongan yang tidak lagi aktif", async () => {
    const database = openAuthDatabase();
    database
      .prepare("UPDATE job_postings SET status = 'paused' WHERE title = ?")
      .run("Barista Part-time");
    const catalog = await selectJobCatalog();
    expect(catalog).toHaveLength(29);
    expect(catalog.map((posting) => posting.title)).not.toContain(
      "Barista Part-time",
    );
    database
      .prepare("UPDATE job_postings SET status = 'active' WHERE title = ?")
      .run("Barista Part-time");
    expect(await selectJobCatalog()).toHaveLength(30);
  });
});

describe("selectJobPostingDetail", () => {
  it("mengembalikan detail lengkap dengan deskripsi dan keterampilan", async () => {
    const catalog = await selectJobCatalog();
    const target = catalog.find(
      (posting) => posting.title === "Desainer Grafis Proyek",
    );
    if (target === undefined) throw new Error("lowongan uji tidak ada");
    const detail = await selectJobPostingDetail(target.id);
    expect(detail?.id).toBe(target.id);
    expect(detail?.description).toContain("identitas visual");
    expect(detail?.closesAt).toBeNull();
    expect(detail?.skills).toEqual(["Branding", "Desain grafis", "Figma"]);
  });

  it("mengembalikan null untuk id yang tidak ada atau tidak aktif", async () => {
    expect(await selectJobPostingDetail("tidak-ada")).toBeNull();
    const database = openAuthDatabase();
    database
      .prepare("UPDATE job_postings SET status = 'closed' WHERE title = ?")
      .run("Tutor Matematika SMA");
    const catalog = await selectJobCatalog();
    const closed = catalog.find(
      (posting) => posting.title === "Tutor Matematika SMA",
    );
    expect(closed).toBeUndefined();
    const anyOther = catalog[0];
    if (anyOther === undefined) throw new Error("katalog kosong");
    expect(await selectJobPostingDetail(anyOther.id)).not.toBeNull();
  });
});
