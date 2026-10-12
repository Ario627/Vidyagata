import { err, ok, type Result } from "../shared/result";

declare const plainDateBrand: unique symbol;

export type PlainDate = string & { readonly [plainDateBrand]: "PlainDate" };

export type PlainDateError = "invalid_format" | "out_of_range";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIN_YEAR = 1000;
const MAX_YEAR = 9999;
const THIRTY_DAY_MONTHS = new Set([4, 6, 9, 11]);

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return THIRTY_DAY_MONTHS.has(month) ? 30 : 31;
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, "0");
}

export function plainDate(
  year: number,
  month: number,
  day: number,
): Result<PlainDate, PlainDateError> {
  const isInteger =
    Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day);
  if (!isInteger) return err("out_of_range");
  if (year < MIN_YEAR || year > MAX_YEAR) return err("out_of_range");
  if (month < 1 || month > 12) return err("out_of_range");
  if (day < 1 || day > daysInMonth(year, month)) return err("out_of_range");
  return ok(`${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}` as PlainDate);
}

export function parsePlainDate(
  input: string,
): Result<PlainDate, PlainDateError> {
  const parts = ISO_DATE.exec(input);
  if (parts === null) return err("invalid_format");
  return plainDate(Number(parts[1]), Number(parts[2]), Number(parts[3]));
}

export function comparePlainDate(a: PlainDate, b: PlainDate): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function isBefore(a: PlainDate, b: PlainDate): boolean {
  return comparePlainDate(a, b) < 0;
}

export function isAfter(a: PlainDate, b: PlainDate): boolean {
  return comparePlainDate(a, b) > 0;
}

export function minPlainDate(a: PlainDate, b: PlainDate): PlainDate {
  return comparePlainDate(a, b) <= 0 ? a : b;
}

export function maxPlainDate(a: PlainDate, b: PlainDate): PlainDate {
  return comparePlainDate(a, b) >= 0 ? a : b;
}
