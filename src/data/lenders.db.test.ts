import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { getDb } from "@/lib/db/client";
import { applyIdentitySeeds } from "@/lib/db/seed/identity";
import { getPilotLenderTerms } from "./lenders";

const directory = mkdtempSync(join(tmpdir(), "vidyagata-lenders-"));
process.env.VIDYAGATA_DB_FILE = join(directory, "lenders.db");

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("getPilotLenderTerms", () => {
  it("menyemai satu mitra pilot saat database dibuka", async () => {
    const database = await getDb();
    const count = (await database
      .prepare("SELECT COUNT(*) AS total FROM lenders WHERE status = 'pilot'")
      .get()) as { total: number };
    expect(count.total).toBe(1);
  });

  it("memetakan syarat mitra dengan tipe yang benar", async () => {
    const database = await getDb();
    await database.prepare("UPDATE lenders SET risk_appetite_json = ?").run(
      JSON.stringify({
        max_amount: 15_000_000,
        max_tenor_months: 60,
        margin_rate_bp: 1200,
        service_fee_rate_bp: 200,
      }),
    );
    const terms = await getPilotLenderTerms();
    expect(terms?.marginRateBp).toBe(1200);
    expect(terms?.serviceFeeRateBp).toBe(200);
    expect(terms?.maxTenorMonths).toBe(60);
    expect(terms?.maxAmount).toBe(15_000_000);
  });

  it("mengembalikan null untuk bentuk data yang tidak dikenal", async () => {
    const database = await getDb();
    await database
      .prepare("UPDATE lenders SET risk_appetite_json = ?")
      .run('{"max_amount": "besar"}');
    expect(await getPilotLenderTerms()).toBeNull();
  });

  it("mengisi field yang hilang pada baris lama saat seed dijalankan ulang", async () => {
    const database = await getDb();
    await database
      .prepare("UPDATE lenders SET risk_appetite_json = ?")
      .run('{"max_amount": 15000000, "max_tenor_months": 60}');
    expect(await getPilotLenderTerms()).toBeNull();
    await applyIdentitySeeds(database);
    expect((await getPilotLenderTerms())?.marginRateBp).toBe(1200);
    await applyIdentitySeeds(database);
    expect((await getPilotLenderTerms())?.marginRateBp).toBe(1200);
  });
});
