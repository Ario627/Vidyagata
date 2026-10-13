import { describe, expect, it } from "vitest";
import { rupiah, ZERO } from "../money/money";
import { plainDate } from "../time/plain-date";
import type { ScheduleRow } from "./schedule";
import { buildRepaymentSchedule, MAX_TENOR_MONTHS } from "./schedule";

function date(value: string) {
  const parsed = plainDate(
    Number(value.slice(0, 4)),
    Number(value.slice(5, 7)),
    Number(value.slice(8, 10)),
  );
  if (!parsed.ok) throw new Error(`tanggal uji tidak valid: ${value}`);
  return parsed.value;
}

const FIRST_DUE = date("2026-01-31");

function build(overrides?: {
  readonly principal?: number;
  readonly tenorMonths?: number;
  readonly annualMarginRateBp?: number;
  readonly serviceFeeRateBp?: number;
}) {
  return buildRepaymentSchedule({
    principal: rupiah(overrides?.principal ?? 1_000_000),
    tenorMonths: overrides?.tenorMonths ?? 3,
    annualMarginRateBp: overrides?.annualMarginRateBp ?? 1200,
    serviceFeeRateBp: overrides?.serviceFeeRateBp ?? 200,
    firstDueDate: FIRST_DUE,
  });
}

function unwrap(result: ReturnType<typeof build>) {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`jadwal gagal: ${result.error}`);
  return result.value;
}

describe("buildRepaymentSchedule", () => {
  it("menghasilkan persis tenor periode dengan Σ pokok = pokok dan Σ total = Σ komponen", () => {
    for (const tenor of [1, 2, 3, 6, 12, 36, 60]) {
      const schedule = unwrap(build({ tenorMonths: tenor }));
      expect(schedule.rows).toHaveLength(tenor);
      const principalSum = schedule.rows.reduce(
        (total, row) => total + row.principal,
        0,
      );
      const componentSum = schedule.rows.reduce(
        (total, row) => total + row.principal + row.margin + row.serviceFee,
        0,
      );
      expect(principalSum).toBe(1_000_000);
      expect(schedule.totals.principal).toBe(1_000_000);
      expect(schedule.totals.totalRepayment).toBe(componentSum);
      expect(schedule.totals.totalRepayment).toBe(
        schedule.totals.principal +
          schedule.totals.margin +
          schedule.totals.serviceFee,
      );
    }
  });

  it("menghitung margin dan fee sesuai contoh yang dapat dihitung tangan", () => {
    const schedule = unwrap(build());
    expect(schedule.totals.margin).toBe(30_000);
    expect(schedule.totals.serviceFee).toBe(20_000);
    expect(schedule.totals.totalRepayment).toBe(1_050_000);
    expect(schedule.rows.map((row) => row.total)).toEqual([
      350_001, 350_000, 349_999,
    ]);
    expect(schedule.rows.map((row) => row.principal)).toEqual([
      333_334, 333_333, 333_333,
    ]);
  });

  it("jatuh tempo pertama tepat dan klip akhir bulan benar (31 Januari)", () => {
    const schedule = unwrap(build());
    expect(schedule.rows.map((row) => row.dueDate)).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
    ]);
  });

  it("sisa pokok menurun dan tepat nol di periode terakhir", () => {
    const schedule = unwrap(build({ principal: 1_200_001, tenorMonths: 5 }));
    const rows: readonly ScheduleRow[] = schedule.rows;
    expect(rows.at(-1)?.remainingPrincipal).toBe(0);
    for (let index = 1; index < rows.length; index += 1) {
      const previous = rows[index - 1];
      const current = rows[index];
      if (previous === undefined || current === undefined) break;
      expect(previous.remainingPrincipal).toBeGreaterThan(
        current.remainingPrincipal,
      );
    }
  });

  it("deterministik untuk input identik", () => {
    expect(unwrap(build())).toEqual(unwrap(build()));
  });

  it("total tidak pernah turun saat tenor atau margin naik", () => {
    const short = unwrap(build({ tenorMonths: 3 }));
    const long = unwrap(build({ tenorMonths: 6 }));
    const higherMargin = unwrap(build({ annualMarginRateBp: 1500 }));
    expect(long.totals.totalRepayment).toBeGreaterThanOrEqual(
      short.totals.totalRepayment,
    );
    expect(higherMargin.totals.totalRepayment).toBeGreaterThanOrEqual(
      short.totals.totalRepayment,
    );
  });

  it("fee nol menyalurkan nol biaya ke seluruh periode", () => {
    const schedule = unwrap(build({ serviceFeeRateBp: 0 }));
    expect(schedule.rows.every((row) => row.serviceFee === 0)).toBe(true);
    expect(schedule.totals.serviceFee).toBe(0);
  });

  it("menolak pokok nol, tenor di luar batas, dan tarif di luar batas", () => {
    expect(build({ principal: 0 }).ok).toBe(false);
    expect(
      buildRepaymentSchedule({
        principal: ZERO,
        tenorMonths: 1,
        annualMarginRateBp: 0,
        serviceFeeRateBp: 0,
        firstDueDate: FIRST_DUE,
      }),
    ).toMatchObject({ ok: false, error: "principal_not_positive" });
    expect(build({ tenorMonths: 0 })).toMatchObject({
      ok: false,
      error: "invalid_tenor",
    });
    expect(build({ tenorMonths: MAX_TENOR_MONTHS + 1 })).toMatchObject({
      ok: false,
      error: "invalid_tenor",
    });
    expect(build({ annualMarginRateBp: 100_000 })).toMatchObject({
      ok: false,
      error: "invalid_margin_rate",
    });
    expect(build({ serviceFeeRateBp: 100_000 })).toMatchObject({
      ok: false,
      error: "invalid_service_fee_rate",
    });
  });

  it("menolak jadwal yang jatuh temponya melewati batas tanggal", () => {
    const result = buildRepaymentSchedule({
      principal: rupiah(1_000_000),
      tenorMonths: 2,
      annualMarginRateBp: 1200,
      serviceFeeRateBp: 200,
      firstDueDate: date("9999-12-01"),
    });
    expect(result).toMatchObject({ ok: false, error: "due_date_out_of_range" });
  });
});
