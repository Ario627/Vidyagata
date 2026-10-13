import { type PlainDate, plainDate } from "@/domain/time/plain-date";

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
