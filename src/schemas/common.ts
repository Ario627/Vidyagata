import { z } from "zod";
import { rupiah } from "../domain/money/money";
import { parsePlainDate } from "../domain/time/plain-date";

export const MAX_MONEY_AMOUNT = 1_000_000_000;

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
