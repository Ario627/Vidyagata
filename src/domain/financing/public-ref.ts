export const FINANCING_REF_SCOPE = "financing_facility";

const REF_PREFIX = "VG-FIN";
const MAX_SEQUENCE_VALUE = 999_999;
const MIN_YEAR = 2020;
const PUBLIC_REF_PATTERN = /^VG-FIN-\d{4}-\d{6}$/;

export function buildPublicRef(input: {
  readonly year: number;
  readonly value: number;
}): string {
  if (
    !Number.isInteger(input.year) ||
    input.year < MIN_YEAR ||
    input.year > 9999
  ) {
    throw new RangeError(`Tahun referensi tidak valid: ${input.year}`);
  }
  if (
    !Number.isInteger(input.value) ||
    input.value < 1 ||
    input.value > MAX_SEQUENCE_VALUE
  ) {
    throw new RangeError(`Nilai urut referensi tidak valid: ${input.value}`);
  }
  return `${REF_PREFIX}-${input.year}-${String(input.value).padStart(6, "0")}`;
}

export function isPublicRef(value: unknown): value is string {
  return typeof value === "string" && PUBLIC_REF_PATTERN.test(value);
}
