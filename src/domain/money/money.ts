import { err, ok, type Result } from "../shared/result";

declare const rupiahBrand: unique symbol;

export type Rupiah = number & { readonly [rupiahBrand]: "Rupiah" };

export type MoneyError = "negative_result";

export function rupiah(value: number): Rupiah {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`Nilai rupiah tidak valid: ${value}`);
  }
  return value as Rupiah;
}

export const ZERO: Rupiah = rupiah(0);

export function add(a: Rupiah, b: Rupiah): Rupiah {
  return rupiah(a + b);
}

export function sum(values: readonly Rupiah[]): Rupiah {
  return values.reduce<Rupiah>((total, value) => add(total, value), ZERO);
}

export function subtract(a: Rupiah, b: Rupiah): Result<Rupiah, MoneyError> {
  const difference = a - b;
  return difference < 0 ? err("negative_result") : ok(rupiah(difference));
}

export function compare(a: Rupiah, b: Rupiah): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function min(a: Rupiah, b: Rupiah): Rupiah {
  return compare(a, b) <= 0 ? a : b;
}

export function max(a: Rupiah, b: Rupiah): Rupiah {
  return compare(a, b) >= 0 ? a : b;
}
