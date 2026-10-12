import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { PlainDate } from "../../domain/time/plain-date";

const LONG = "d MMMM yyyy";
const SHORT = "d MMM yyyy";
const INSTANT = "d MMM yyyy, HH.mm";

function toUtcDate(date: PlainDate): TZDate {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  return new TZDate(Date.UTC(year, month - 1, day), "UTC");
}

function toWibDate(instant: Date | string): TZDate {
  const asDate = typeof instant === "string" ? new Date(instant) : instant;
  if (Number.isNaN(asDate.getTime())) {
    throw new RangeError(`Instant tidak valid: ${String(instant)}`);
  }
  return new TZDate(asDate, "Asia/Jakarta");
}

export function formatPlainDate(date: PlainDate): string {
  return format(toUtcDate(date), LONG, { locale: localeId });
}

export function formatPlainDateShort(date: PlainDate): string {
  return format(toUtcDate(date), SHORT, { locale: localeId });
}

export function formatInstantWib(instant: Date | string): string {
  return `${format(toWibDate(instant), INSTANT, { locale: localeId })} WIB`;
}
