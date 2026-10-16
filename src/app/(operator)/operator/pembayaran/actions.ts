"use server";

import { z } from "zod";
import { reviewPayment } from "@/data/payments";

export type PaymentReviewResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly code: string };

const PaymentIdInput = z.ulid();

const RejectInput = z
  .object({
    paymentId: z.ulid(),
    reason: z
      .string()
      .trim()
      .min(3, { error: "Tulis alasan penolakan minimal 3 karakter" })
      .max(280, { error: "Alasan maksimal 280 karakter" }),
  })
  .strict();

function errorCode(error: unknown): string {
  return error instanceof Error ? error.message : "internal_error";
}

export async function verifyPaymentAction(
  paymentId: unknown,
): Promise<PaymentReviewResult> {
  const parsed = PaymentIdInput.safeParse(paymentId);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const result = await reviewPayment({
      paymentId: parsed.data,
      decision: "verify",
    });
    return result.ok ? { ok: true } : { ok: false, code: result.code };
  } catch (error) {
    return { ok: false, code: errorCode(error) };
  }
}

export async function rejectPaymentAction(
  input: unknown,
): Promise<PaymentReviewResult> {
  const parsed = RejectInput.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const result = await reviewPayment({
      paymentId: parsed.data.paymentId,
      decision: "reject",
      reason: parsed.data.reason,
    });
    return result.ok ? { ok: true } : { ok: false, code: result.code };
  } catch (error) {
    return { ok: false, code: errorCode(error) };
  }
}
