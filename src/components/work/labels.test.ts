import { describe, expect, it } from "vitest";
import { formatCompensation } from "./labels";

describe("formatCompensation", () => {
  it("menulis tarif per jam tanpa mengulang Rp dan tanpa pembulatan", () => {
    expect(
      formatCompensation({
        compensationType: "hourly",
        compensationMin: 15_000,
        compensationMax: 20_000,
      }),
    ).toBe("Rp15.000–20.000 / jam");
    expect(
      formatCompensation({
        compensationType: "hourly",
        compensationMin: 50_000,
        compensationMax: 50_000,
      }),
    ).toBe("Rp50.000 / jam");
  });

  it("menyingkat rentang bulanan dan proyek ke satuan juta", () => {
    expect(
      formatCompensation({
        compensationType: "monthly",
        compensationMin: 1_500_000,
        compensationMax: 2_500_000,
      }),
    ).toBe("Rp1,5–2,5 jt / bulan");
    expect(
      formatCompensation({
        compensationType: "per_project",
        compensationMin: 800_000,
        compensationMax: 1_500_000,
      }),
    ).toBe("Rp0,8–1,5 jt / proyek");
    expect(
      formatCompensation({
        compensationType: "monthly",
        compensationMin: 2_000_000,
        compensationMax: 2_000_000,
      }),
    ).toBe("Rp2 jt / bulan");
  });

  it("deterministik untuk input identik", () => {
    const input = {
      compensationType: "monthly" as const,
      compensationMin: 1_200_000,
      compensationMax: 1_800_000,
    };
    expect(formatCompensation(input)).toBe(formatCompensation(input));
  });
});
