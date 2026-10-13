import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { resolveActiveParameters } from "@/data/regulatory";
import { openAuthDatabase } from "@/lib/db/sqlite";

const directory = mkdtempSync(join(tmpdir(), "vidyagata-regulatory-"));
process.env.VIDYAGATA_DB_FILE = join(directory, "regulatory.db");

const AT_2026 = "2026-10-13T00:00:00.000Z";
const AT_2027 = "2027-06-01T00:00:00.000Z";

const INSERT_ROW = `INSERT INTO regulatory_parameters (
  id, key, value_json, effective_from, effective_to,
  source, set_by_user_id, note, created_at
) VALUES (?, ?, ?, ?, NULL, 'test', NULL, NULL, ?)`;

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("regulatory parameters dari database", () => {
  it("menyemai parameter awal lengkap dan dapat diresolusi", () => {
    const count = openAuthDatabase()
      .prepare("SELECT COUNT(*) AS total FROM regulatory_parameters")
      .get() as { total: number };
    expect(count.total).toBe(11);
    const result = resolveActiveParameters(AT_2026);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.max_annual_margin_rate_bp).toBe(1500);
    expect(result.value.max_service_fee_rate_bp).toBe(300);
    expect(result.value.allowed_payroll_deduction_rates).toEqual([20, 40, 60]);
    expect(result.value.repayment_reminder_days).toEqual([7, 3, 1, 0]);
    expect(result.value.data_retention_years).toBe(10);
  });

  it("mereproduksi nilai historis dari effectiveFrom tiap baris", () => {
    const database = openAuthDatabase();
    database
      .prepare(INSERT_ROW)
      .run(
        "test-margin-2027",
        "max_annual_margin_rate_bp",
        "2000",
        "2027-01-01T00:00:00.000Z",
        AT_2026,
      );
    const before = resolveActiveParameters(AT_2026);
    const after = resolveActiveParameters(AT_2027);
    expect(before.ok && before.value.max_annual_margin_rate_bp).toBe(1500);
    expect(after.ok && after.value.max_annual_margin_rate_bp).toBe(2000);
  });

  it("mengizinkan penutupan periode dan menolak perubahan lain", () => {
    const database = openAuthDatabase();
    database
      .prepare(INSERT_ROW)
      .run(
        "test-tenor-2030",
        "max_tenor_months",
        "48",
        "2030-01-01T00:00:00.000Z",
        AT_2026,
      );
    expect(() =>
      database
        .prepare(
          "UPDATE regulatory_parameters SET note = 'ubah' WHERE id = 'test-tenor-2030'",
        )
        .run(),
    ).toThrow(/regulatory_parameters_immutable/);
    expect(() =>
      database
        .prepare(
          "DELETE FROM regulatory_parameters WHERE id = 'test-tenor-2030'",
        )
        .run(),
    ).toThrow(/regulatory_parameters_immutable/);
    database
      .prepare(
        "UPDATE regulatory_parameters SET effective_to = '2031-01-01T00:00:00.000Z' WHERE id = 'test-tenor-2030'",
      )
      .run();
    const open2030 = resolveActiveParameters("2030-06-01T00:00:00.000Z");
    expect(open2030.ok && open2030.value.max_tenor_months).toBe(48);
    expect(() =>
      database
        .prepare(
          "UPDATE regulatory_parameters SET effective_to = NULL WHERE id = 'test-tenor-2030'",
        )
        .run(),
    ).toThrow(/regulatory_parameters_immutable/);
  });

  it("menegakkan kunci, bentuk json, periode, dan keunikan di database", () => {
    const database = openAuthDatabase();
    const insert = database.prepare(INSERT_ROW);
    expect(() =>
      insert.run(
        "test-bad-key",
        "unknown_key",
        "1",
        "2032-01-01T00:00:00.000Z",
        AT_2026,
      ),
    ).toThrow(/CHECK/);
    expect(() =>
      insert.run(
        "test-bad-json",
        "max_tenor_months",
        "{bukan",
        "2032-01-01T00:00:00.000Z",
        AT_2026,
      ),
    ).toThrow(/CHECK/);
    insert.run(
      "test-unique",
      "max_service_fee_rate_bp",
      "250",
      "2032-01-01T00:00:00.000Z",
      AT_2026,
    );
    expect(() =>
      insert.run(
        "test-unique-dupe",
        "max_service_fee_rate_bp",
        "250",
        "2032-01-01T00:00:00.000Z",
        AT_2026,
      ),
    ).toThrow(/UNIQUE/);
  });
});
