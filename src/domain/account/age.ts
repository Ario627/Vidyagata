import {
  type PlainDate,
  parsePlainDate,
  plainDate,
} from "@/domain/time/plain-date";

export const MINIMUM_AGE_YEARS = 18;

export type AgeGateDecision =
  | { readonly kind: "eligible"; readonly age: number }
  | {
      readonly kind: "too_young";
      readonly age: number;
      readonly yearsUntilEligible: number;
    };

export function localPlainDateOf(date: Date): PlainDate | null {
  const parsed = plainDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
  return parsed.ok ? parsed.value : null;
}

const JAKARTA_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function jakartaPlainDateOf(date: Date): PlainDate | null {
  const parsed = parsePlainDate(JAKARTA_DATE_FORMAT.format(date));
  return parsed.ok ? parsed.value : null;
}

export function addYearsClamped(
  date: PlainDate,
  years: number,
): PlainDate | null {
  const year = Number(date.slice(0, 4)) + years;
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const parsed = plainDate(year, month, Math.min(day, lastDayOfMonth));
  return parsed.ok ? parsed.value : null;
}

export function ageInYearsAt(birthdate: PlainDate, today: PlainDate): number {
  const birthYear = Number(birthdate.slice(0, 4));
  const birthMonth = Number(birthdate.slice(5, 7));
  const birthDay = Number(birthdate.slice(8, 10));
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));
  const currentDay = Number(today.slice(8, 10));
  const hadBirthdayThisYear =
    currentMonth > birthMonth ||
    (currentMonth === birthMonth && currentDay >= birthDay);
  return currentYear - birthYear - (hadBirthdayThisYear ? 0 : 1);
}

export function eighteenthBirthday(birthdate: PlainDate): PlainDate | null {
  return addYearsClamped(birthdate, MINIMUM_AGE_YEARS);
}

export function evaluateAgeGate(
  birthdate: PlainDate,
  today: PlainDate,
): AgeGateDecision {
  const age = ageInYearsAt(birthdate, today);
  if (age >= MINIMUM_AGE_YEARS) return { kind: "eligible", age };
  return {
    kind: "too_young",
    age,
    yearsUntilEligible: MINIMUM_AGE_YEARS - age,
  };
}
