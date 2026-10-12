export function multiplyDivideRoundUp(
  value: number,
  multiplier: number,
  divisor: number,
): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`Nilai tidak valid: ${value}`);
  }
  if (!Number.isSafeInteger(multiplier) || multiplier < 0) {
    throw new RangeError(`Pengali tidak valid: ${multiplier}`);
  }
  if (!Number.isSafeInteger(divisor) || divisor <= 0) {
    throw new RangeError(`Pembagi tidak valid: ${divisor}`);
  }
  const numerator = BigInt(value) * BigInt(multiplier);
  const ratio = (numerator + BigInt(divisor) - 1n) / BigInt(divisor);
  const result = Number(ratio);
  if (!Number.isSafeInteger(result)) {
    throw new RangeError("Hasil pembulatan di luar rentang aman");
  }
  return result;
}

export function allocateEvenly(total: number, parts: number): number[] {
  if (!Number.isSafeInteger(total) || total < 0) {
    throw new RangeError(`Total tidak valid: ${total}`);
  }
  if (!Number.isSafeInteger(parts) || parts < 1) {
    throw new RangeError(`Jumlah bagian tidak valid: ${parts}`);
  }
  const base = Math.floor(total / parts);
  const remainder = total - base * parts;
  return Array.from({ length: parts }, (_, index) =>
    index < remainder ? base + 1 : base,
  );
}
