import { err, type Result } from "../shared/result";
import {
  daysInMonth,
  type PlainDate,
  type PlainDateError,
  plainDate,
} from "./plain-date";

const MONTHS_PER_YEAR = 12;

export function addMonths(
  date: PlainDate,
  months: number,
): Result<PlainDate, PlainDateError> {
  if (!Number.isInteger(months)) return err("out_of_range");
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const totalMonths = year * MONTHS_PER_YEAR + (month - 1) + months;
  const targetYear = Math.floor(totalMonths / MONTHS_PER_YEAR);
  const targetMonth = (totalMonths % MONTHS_PER_YEAR) + 1;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));
  return plainDate(targetYear, targetMonth, targetDay);
}
