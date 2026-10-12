import { z } from "zod";
import { rupiah } from "../domain/money/money";
import { parsePlainDate } from "../domain/time/plain-date";

declare const phoneBrand: unique symbol;

export type PhoneNumber = string & { readonly [phoneBrand]: "PhoneNumber" };

export const MAX_MONEY_AMOUNT = 1_000_000_000;

const SUBSCRIBER_DIGITS = /^\d{8,11}$/;
const SEPARATORS = /[\s().-]/g;

function canonicalizePhoneNumber(input: string): PhoneNumber | null {
  const stripped = input.replace(SEPARATORS, "");
  const digits = stripped.startsWith("+") ? stripped.slice(1) : stripped;
  if (!/^\d+$/.test(digits)) return null;
  const national = digits.startsWith("62")
    ? digits.slice(2)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;
  if (!national.startsWith("8")) return null;
  if (!SUBSCRIBER_DIGITS.test(national.slice(1))) return null;
  return `+62${national}` as PhoneNumber;
}

export const PhoneNumberID = z.string().transform((value, ctx) => {
  const phoneNumber = canonicalizePhoneNumber(value);
  if (phoneNumber === null) {
    ctx.addIssue({
      code: "custom",
      message: "Nomor HP Indonesia tidak valid, contoh 081234567890",
    });
    return z.NEVER;
  }
  return phoneNumber;
});

export const MoneyAmount = z
  .int({ error: "Nominal harus bilangan bulat rupiah" })
  .nonnegative({ error: "Nominal tidak boleh negatif" })
  .max(MAX_MONEY_AMOUNT, { error: "Nominal di luar batas wajar" })
  .transform(rupiah);

export const PlainDateString = z.string().transform((value, ctx) => {
  const parsed = parsePlainDate(value);
  if (!parsed.ok) {
    ctx.addIssue({
      code: "custom",
      message:
        parsed.error === "invalid_format"
          ? "Tanggal harus berformat YYYY-MM-DD"
          : "Tanggal tidak valid",
    });
    return z.NEVER;
  }
  return parsed.value;
});

export const PaginationInput = z.object({
  cursor: z.ulid({ error: "Kursor tidak valid" }).optional(),
  limit: z.int().min(1).max(50).default(20),
});
