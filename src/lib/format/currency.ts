import type { Rupiah } from "../../domain/money/money";

const THOUSANDS = /\B(?=(?:\d{3})+$)/g;
const PLAIN = /^\d+$/;
const GROUPED = /^\d{1,3}(?:\.\d{3})*$/;
const PROMOTE_TENTHS = 10_000;

const JUTA = { divisor: 1_000_000, suffix: "jt" } as const;
const MILIAR = { divisor: 1_000_000_000, suffix: "M" } as const;

export function formatIDRDigits(digits: string): string {
  return digits.replace(THOUSANDS, ".");
}

function groupDigits(value: number): string {
  return formatIDRDigits(String(value));
}

function tenthsOf(amount: number, divisor: number): number {
  return Math.floor((amount + divisor / 20) / (divisor / 10));
}

function renderTenths(tenths: number, suffix: string): string {
  const whole = groupDigits(Math.floor(tenths / 10));
  const fraction = tenths % 10;
  return fraction === 0
    ? `${whole} ${suffix}`
    : `${whole},${fraction} ${suffix}`;
}

function toSafeInteger(digits: string): number | null {
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}

export function formatIDR(amount: Rupiah): string {
  return `Rp${groupDigits(amount)}`;
}

export function formatIDRCompact(amount: Rupiah): string {
  if (amount >= MILIAR.divisor) {
    return `Rp${renderTenths(tenthsOf(amount, MILIAR.divisor), MILIAR.suffix)}`;
  }
  if (amount >= JUTA.divisor) {
    const tenths = tenthsOf(amount, JUTA.divisor);
    if (tenths < PROMOTE_TENTHS)
      return `Rp${renderTenths(tenths, JUTA.suffix)}`;
    return `Rp${renderTenths(tenthsOf(amount, MILIAR.divisor), MILIAR.suffix)}`;
  }
  return formatIDR(amount);
}

export function parseIDRInput(input: string): number | null {
  const compact = input.trim().replace(/\s+/g, "");
  if (compact.length === 0) return null;
  if (PLAIN.test(compact)) return toSafeInteger(compact);
  if (!GROUPED.test(compact)) return null;
  return toSafeInteger(compact.replaceAll(".", ""));
}
