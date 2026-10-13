import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { PlainDate } from "../../domain/time/plain-date";

const LONG_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agt",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

const INSTANT = "d MMM yyyy, HH.mm";

function yearOf(date: PlainDate): number {
  return Number(date.slice(0, 4));
}

function monthOf(date: PlainDate): number {
  return Number(date.slice(5, 7)) - 1;
}

function dayOf(date: PlainDate): number {
  return Number(date.slice(8, 10));
}

function monthName(months: readonly string[], index: number): string {
  const name = months[index];
  if (name === undefined) {
    throw new RangeError(`Bulan di luar rentang: ${index + 1}`);
  }
  return name;
}

function toWibDate(instant: Date | string): TZDate {
  const asDate = typeof instant === "string" ? new Date(instant) : instant;
  if (Number.isNaN(asDate.getTime())) {
    throw new RangeError(`Instant tidak valid: ${String(instant)}`);
  }
  return new TZDate(asDate, "Asia/Jakarta");
}

export function formatPlainDate(date: PlainDate): string {
  return `${dayOf(date)} ${monthName(LONG_MONTHS, monthOf(date))} ${yearOf(date)}`;
}

export function formatPlainDateShort(date: PlainDate): string {
  return `${dayOf(date)} ${monthName(SHORT_MONTHS, monthOf(date))} ${yearOf(date)}`;
}

export function formatInstantWib(instant: Date | string): string {
  return `${format(toWibDate(instant), INSTANT, { locale: localeId })} WIB`;
}
