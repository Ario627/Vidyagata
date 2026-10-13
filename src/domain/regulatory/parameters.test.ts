import { describe, expect, it } from "vitest";
import type { RegulatoryParameterRecord } from "./parameters";
import { resolveRegulatoryParameters } from "./parameters";

const FROM = "2025-01-01T00:00:00.000Z";
const AT_2026 = "2026-06-01T00:00:00.000Z";
const AT_2027 = "2027-06-01T00:00:00.000Z";

function baseRecords(): RegulatoryParameterRecord[] {
  return [
    {
      key: "max_annual_margin_rate_bp",
      value: 900,
      effectiveFrom: FROM,
      effectiveTo: null,
      source: "test",
    },
    {
      key: "max_service_fee_rate_bp",
      value: 150,
      effectiveFrom: FROM,
      effectiveTo: null,
      source: "test",
    },
    {
      key: "allowed_payroll_deduction_rates",
      value: [20, 40],
      effectiveFrom: FROM,
      effectiveTo: null,
      source: "test",
    },
    {
      key: "max_tenor_months",
      value: 36,
      effectiveFrom: FROM,
      effectiveTo: null,
      source: "test",
    },
    {
      key: "min_age_years",
      value: 17,
      effectiveFrom: FROM,
      effectiveTo: null,
      source: "test",
    },
    {
      key: "max_age_years",
      value: 40,
      effectiveFrom: FROM,
      effectiveTo: null,
      source: "test",
    },
    {
      key: "default_threshold_days",
      value: 60,
      effectiveFrom: FROM,
      effectiveTo: null,
      source: "test",
    },
    {
      key: "grace_period_days",
      value: 5,
      effectiveFrom: FROM,
      effectiveTo: null,
      source: "test",
    },
    {
      key: "max_late_fee_rate_bp",
      value: 50,
      effectiveFrom: FROM,
      effectiveTo: null,
      source: "test",
    },
    {
      key: "repayment_reminder_days",
      value: [3, 1],
      effectiveFrom: FROM,
      effectiveTo: null,
      source: "test",
    },
    {
      key: "data_retention_years",
      value: 5,
      effectiveFrom: FROM,
      effectiveTo: null,
      source: "test",
    },
  ];
}

describe("resolveRegulatoryParameters", () => {
  it("meresolusi seluruh kunci saat semua baris lengkap", () => {
    const result = resolveRegulatoryParameters(baseRecords(), AT_2026);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.max_annual_margin_rate_bp).toBe(900);
    expect(result.value.allowed_payroll_deduction_rates).toEqual([20, 40]);
    expect(result.value.repayment_reminder_days).toEqual([3, 1]);
    expect(result.value.min_age_years).toBeLessThanOrEqual(
      result.value.max_age_years,
    );
  });

  it("menolak bila ada kunci tanpa baris berlaku", () => {
    const records = baseRecords().filter(
      (record) => record.key !== "max_tenor_months",
    );
    const result = resolveRegulatoryParameters(records, AT_2026);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatchObject({
      kind: "missing",
      key: "max_tenor_months",
    });
  });

  it("menolak nilai yang gagal validasi bentuk", () => {
    const records = baseRecords().map((record) =>
      record.key === "allowed_payroll_deduction_rates"
        ? { ...record, value: [45] }
        : record,
    );
    const result = resolveRegulatoryParameters(records, AT_2026);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatchObject({
      kind: "invalid",
      key: "allowed_payroll_deduction_rates",
    });
  });

  it("menolak rentang usia yang tidak konsisten", () => {
    const records = baseRecords().map((record) =>
      record.key === "min_age_years"
        ? { ...record, value: 50 }
        : record.key === "max_age_years"
          ? { ...record, value: 40 }
          : record,
    );
    const result = resolveRegulatoryParameters(records, AT_2026);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatchObject({
      kind: "inconsistent",
      keys: ["min_age_years", "max_age_years"],
    });
  });

  it("menolak instant yang tidak dapat diparse", () => {
    const result = resolveRegulatoryParameters(baseRecords(), "bukan-instant");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatchObject({ kind: "invalid_instant" });
  });

  it("memilih baris dengan effectiveFrom terbaru yang berlaku", () => {
    const records = [
      ...baseRecords(),
      {
        key: "max_annual_margin_rate_bp",
        value: 1200,
        effectiveFrom: "2027-01-01T00:00:00.000Z",
        effectiveTo: null,
        source: "test",
      } satisfies RegulatoryParameterRecord,
    ];
    const before = resolveRegulatoryParameters(records, AT_2026);
    const after = resolveRegulatoryParameters(records, AT_2027);
    expect(before.ok && before.value.max_annual_margin_rate_bp).toBe(900);
    expect(after.ok && after.value.max_annual_margin_rate_bp).toBe(1200);
  });

  it("menghormati effectiveTo saat periode ditutup", () => {
    const closed: RegulatoryParameterRecord = {
      key: "max_annual_margin_rate_bp",
      value: 300,
      effectiveFrom: FROM,
      effectiveTo: "2027-01-01T00:00:00.000Z",
      source: "test",
    };
    const successor: RegulatoryParameterRecord = {
      key: "max_annual_margin_rate_bp",
      value: 450,
      effectiveFrom: "2027-01-01T00:00:00.000Z",
      effectiveTo: null,
      source: "test",
    };
    const records = [
      closed,
      successor,
      ...baseRecords().filter(
        (record) => record.key !== "max_annual_margin_rate_bp",
      ),
    ];
    const end2026 = resolveRegulatoryParameters(
      records,
      "2026-12-31T23:59:59.000Z",
    );
    const start2027 = resolveRegulatoryParameters(
      records,
      "2027-01-01T00:00:00.000Z",
    );
    expect(end2026.ok && end2026.value.max_annual_margin_rate_bp).toBe(300);
    expect(start2027.ok && start2027.value.max_annual_margin_rate_bp).toBe(450);
  });

  it("deterministik untuk input identik", () => {
    const first = resolveRegulatoryParameters(baseRecords(), AT_2026);
    const second = resolveRegulatoryParameters(baseRecords(), AT_2026);
    expect(first).toEqual(second);
  });
});
