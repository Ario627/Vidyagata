import { describe, expect, it } from "vitest";
import { rupiah } from "../money/money";
import {
  computePayrollDeduction,
  estimatePayoffPeriods,
  isPayrollDeductionRate,
  PAYROLL_DEDUCTION_RATES,
} from "./deduction";

describe("isPayrollDeductionRate", () => {
  it("hanya menerima 20, 40, dan 60", () => {
    expect(PAYROLL_DEDUCTION_RATES.every(isPayrollDeductionRate)).toBe(true);
    expect(isPayrollDeductionRate(20)).toBe(true);
    expect(isPayrollDeductionRate(30)).toBe(false);
    expect(isPayrollDeductionRate("40")).toBe(false);
    expect(isPayrollDeductionRate(null)).toBe(false);
  });
});

describe("computePayrollDeduction", () => {
  it("membulatkan potongan ke atas dan tidak melebihi sisa kewajiban", () => {
    expect(
      computePayrollDeduction({
        earnings: rupiah(1_000_000),
        rate: 20,
        outstanding: rupiah(1_000_000_000),
      }),
    ).toBe(200_000);
    expect(
      computePayrollDeduction({
        earnings: rupiah(999_999),
        rate: 40,
        outstanding: rupiah(1_000_000_000),
      }),
    ).toBe(400_000);
    expect(
      computePayrollDeduction({
        earnings: rupiah(1_234_567),
        rate: 60,
        outstanding: rupiah(1_000_000_000),
      }),
    ).toBe(740_741);
    expect(
      computePayrollDeduction({
        earnings: rupiah(1_000_000),
        rate: 20,
        outstanding: rupiah(150_000),
      }),
    ).toBe(150_000);
    expect(
      computePayrollDeduction({
        earnings: rupiah(0),
        rate: 60,
        outstanding: rupiah(500_000),
      }),
    ).toBe(0);
  });
});

describe("estimatePayoffPeriods", () => {
  it("menghitung jumlah periode pemotongan sampai lunas", () => {
    expect(
      estimatePayoffPeriods({
        outstanding: rupiah(1_000_000),
        periodDeduction: rupiah(300_000),
      }),
    ).toBe(4);
    expect(
      estimatePayoffPeriods({
        outstanding: rupiah(150_000),
        periodDeduction: rupiah(50_000),
      }),
    ).toBe(3);
    expect(
      estimatePayoffPeriods({
        outstanding: rupiah(150_001),
        periodDeduction: rupiah(50_000),
      }),
    ).toBe(4);
  });

  it("mengembalikan nol saat lunas dan null saat tidak ada potongan", () => {
    expect(
      estimatePayoffPeriods({
        outstanding: rupiah(0),
        periodDeduction: rupiah(50_000),
      }),
    ).toBe(0);
    expect(
      estimatePayoffPeriods({
        outstanding: rupiah(150_000),
        periodDeduction: rupiah(0),
      }),
    ).toBeNull();
  });
});
