import { describe, expect, it } from "vitest";
import { rupiah, ZERO } from "../money/money";
import type {
  AcademicStatus,
  EligibilityFactor,
  EligibilityInput,
} from "./eligibility";
import { assessEligibility, ELIGIBILITY_ENGINE_VERSION } from "./eligibility";

function baseInput(
  overrides: Partial<EligibilityInput> = {},
): EligibilityInput {
  return {
    academicStatus: "undergraduate",
    currentSemester: 5,
    gpaHundredths: 372,
    requestedAmount: rupiah(750_000),
    tenorMonths: 24,
    plafonCap: rupiah(1_000_000),
    maxTenorMonths: 36,
    ...overrides,
  };
}

function factorOf(
  factors: readonly EligibilityFactor[],
  code: EligibilityFactor["code"],
): EligibilityFactor {
  const factor = factors.find((entry) => entry.code === code);
  if (factor === undefined) throw new Error(`faktor ${code} tidak ada`);
  return factor;
}

describe("assessEligibility", () => {
  it("mencapai skor maksimum 100 saat semua faktor di puncak", () => {
    const result = assessEligibility(
      baseInput({
        gpaHundredths: 400,
        currentSemester: 5,
        requestedAmount: rupiah(500_000),
        tenorMonths: 12,
      }),
    );
    expect(result.score).toBe(100);
    expect(result.plafonRecommended).toBe(500_000);
  });

  it("menjumlahkan poin faktor menjadi skor yang dapat diperiksa", () => {
    const result = assessEligibility(baseInput());
    const sum = result.factors.reduce(
      (total, factor) => total + factor.points,
      0,
    );
    expect(result.score).toBe(97);
    expect(sum).toBe(result.score);
  });

  it("menetapkan band IPK di setiap batas", () => {
    const cases: readonly [number | null, number, string][] = [
      [400, 40, "up"],
      [350, 40, "up"],
      [349, 34, "up"],
      [300, 34, "up"],
      [299, 26, "up"],
      [250, 26, "up"],
      [249, 16, "down"],
      [null, 24, "neutral"],
    ];
    for (const [gpa, points, direction] of cases) {
      const factor = factorOf(
        assessEligibility(baseInput({ gpaHundredths: gpa })).factors,
        "gpa_band",
      );
      expect(factor.points).toBe(points);
      expect(factor.direction).toBe(direction);
    }
  });

  it("menetapkan band semester di setiap batas", () => {
    const cases: readonly [number | null, number, string][] = [
      [null, 10, "neutral"],
      [1, 15, "up"],
      [2, 20, "up"],
      [4, 20, "up"],
      [5, 25, "up"],
      [8, 25, "up"],
      [9, 20, "neutral"],
    ];
    for (const [semester, points, direction] of cases) {
      const factor = factorOf(
        assessEligibility(baseInput({ currentSemester: semester })).factors,
        "semester_progress",
      );
      expect(factor.points).toBe(points);
      expect(factor.direction).toBe(direction);
    }
  });

  it("memperlakukan status akademik non-reguler secara eksplisit", () => {
    const graduated = factorOf(
      assessEligibility(baseInput({ academicStatus: "graduated" })).factors,
      "semester_progress",
    );
    const dropout = factorOf(
      assessEligibility(baseInput({ academicStatus: "dropout" })).factors,
      "semester_progress",
    );
    const highSchool = factorOf(
      assessEligibility(baseInput({ academicStatus: "high_school" })).factors,
      "semester_progress",
    );
    expect(graduated.points).toBe(20);
    expect(dropout.points).toBe(8);
    expect(dropout.direction).toBe("down");
    expect(highSchool.points).toBe(14);
  });

  it("menilai jumlah terhadap plafon mitra termasuk batas 50 dan 75 persen", () => {
    const cap = rupiah(1_000_000);
    const cases: readonly [number, number, string][] = [
      [500_000, 20, "up"],
      [501_000, 17, "up"],
      [750_000, 17, "up"],
      [751_000, 13, "up"],
      [1_000_000, 13, "up"],
      [1_500_000, 6, "down"],
    ];
    for (const [amount, points, direction] of cases) {
      const factor = factorOf(
        assessEligibility(
          baseInput({ requestedAmount: rupiah(amount), plafonCap: cap }),
        ).factors,
        "amount_within_plafon",
      );
      expect(factor.points).toBe(points);
      expect(factor.direction).toBe(direction);
    }
  });

  it("membatasi plafon yang direkomendasikan pada batas mitra", () => {
    const exceeding = assessEligibility(
      baseInput({ requestedAmount: rupiah(1_500_000) }),
    );
    const within = assessEligibility(
      baseInput({ requestedAmount: rupiah(750_000) }),
    );
    expect(exceeding.plafonRecommended).toBe(1_000_000);
    expect(within.plafonRecommended).toBe(750_000);
  });

  it("menunda penilaian jumlah dan tenor saat plafon mitra belum ditetapkan", () => {
    const result = assessEligibility(
      baseInput({ plafonCap: null, maxTenorMonths: null }),
    );
    const amount = factorOf(result.factors, "amount_within_plafon");
    const tenor = factorOf(result.factors, "tenor_within_cap");
    expect(amount.points).toBe(12);
    expect(amount.direction).toBe("neutral");
    expect(tenor.points).toBe(11);
    expect(tenor.direction).toBe("neutral");
    expect(result.plafonRecommended).toBe(750_000);
  });

  it("menilai tenor terhadap batas mitra", () => {
    const within = factorOf(
      assessEligibility(baseInput({ tenorMonths: 36 })).factors,
      "tenor_within_cap",
    );
    const above = factorOf(
      assessEligibility(baseInput({ tenorMonths: 37 })).factors,
      "tenor_within_cap",
    );
    expect(within.points).toBe(15);
    expect(within.direction).toBe("up");
    expect(above.points).toBe(5);
    expect(above.direction).toBe("down");
  });

  it("mengembalikan bentuk keluaran yang stabil tanpa keputusan otomatis (A1)", () => {
    const result = assessEligibility(baseInput());
    expect(Object.keys(result).sort()).toEqual([
      "engineVersion",
      "factors",
      "plafonRecommended",
      "score",
    ]);
    expect(result.engineVersion).toBe(ELIGIBILITY_ENGINE_VERSION);
  });

  it("selalu menyertakan penjelasan yang dapat dibaca manusia (A5)", () => {
    const result = assessEligibility(baseInput());
    const codes = new Set(result.factors.map((factor) => factor.code));
    expect(codes.size).toBe(4);
    for (const factor of result.factors) {
      expect(factor.value.length).toBeGreaterThan(10);
    }
  });

  it("deterministik untuk input identik", () => {
    expect(assessEligibility(baseInput())).toEqual(
      assessEligibility(baseInput()),
    );
  });

  it("menjaga skor dalam 0 sampai 100 untuk seluruh kombinasi status dan nilai", () => {
    const statuses: readonly AcademicStatus[] = [
      "high_school",
      "undergraduate",
      "graduated",
      "dropout",
    ];
    for (const status of statuses) {
      for (const gpa of [null, 0, 249, 250, 300, 350, 400]) {
        for (const semester of [null, 1, 5, 9, 24]) {
          const result = assessEligibility(
            baseInput({
              academicStatus: status,
              gpaHundredths: gpa,
              currentSemester: semester,
            }),
          );
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("tidak menjatuhkan skor ke nol pada kombinasi terlemah", () => {
    const result = assessEligibility(
      baseInput({
        academicStatus: "dropout",
        gpaHundredths: 0,
        requestedAmount: rupiah(5_000_000),
        tenorMonths: 48,
      }),
    );
    expect(result.score).toBe(35);
  });

  it("menolak input yang tidak valid di luar rentang", () => {
    expect(() => assessEligibility(baseInput({ tenorMonths: 0 }))).toThrow(
      RangeError,
    );
    expect(() => assessEligibility(baseInput({ tenorMonths: 1.5 }))).toThrow(
      RangeError,
    );
    expect(() => assessEligibility(baseInput({ currentSemester: 0 }))).toThrow(
      RangeError,
    );
    expect(() => assessEligibility(baseInput({ currentSemester: 25 }))).toThrow(
      RangeError,
    );
    expect(() => assessEligibility(baseInput({ gpaHundredths: -1 }))).toThrow(
      RangeError,
    );
    expect(() => assessEligibility(baseInput({ gpaHundredths: 401 }))).toThrow(
      RangeError,
    );
    expect(() => assessEligibility(baseInput({ maxTenorMonths: 0 }))).toThrow(
      RangeError,
    );
    expect(() =>
      assessEligibility(baseInput({ requestedAmount: ZERO })),
    ).not.toThrow();
  });
});
