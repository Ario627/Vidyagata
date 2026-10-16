import { z } from "zod";
import type { PayrollDeductionRate } from "../domain/financing/deduction";
import { isPayrollDeductionRate } from "../domain/financing/deduction";
import { MAX_TENOR_MONTHS } from "../domain/financing/schedule";
import { MoneyAmount, PlainDateString } from "./common";

export const ACADEMIC_PURPOSES = ["tuition", "living_cost", "other"] as const;

export type AcademicPurpose = (typeof ACADEMIC_PURPOSES)[number];

export const AcademicPurposeSchema = z.enum(ACADEMIC_PURPOSES, {
  error: "Pilih tujuan pembiayaan",
});

export const PayrollDeductionRateSchema = z.custom<PayrollDeductionRate>(
  isPayrollDeductionRate,
  { error: "Bagian potongan harus 20%, 40%, atau 60%" },
);

export const RequestedAmount = MoneyAmount.refine((amount) => amount > 0, {
  error: "Nominal pengajuan harus lebih dari nol",
});

export const PurposeNote = z
  .string({ error: "Ceritakan rencana penggunaan dana" })
  .trim()
  .min(40, { error: "Tulis minimal 40 karakter agar bisa ditinjau" })
  .max(600, { error: "Maksimal 600 karakter" });

export const TenorMonths = z
  .int({ error: "Tenor harus bilangan bulat bulan" })
  .min(1, { error: "Tenor minimal 1 bulan" })
  .max(MAX_TENOR_MONTHS, { error: `Tenor maksimal ${MAX_TENOR_MONTHS} bulan` });

export const ApplySchema = z.object({
  institutionId: z.ulid({ error: "Kampus tujuan tidak valid" }),
  requestedAmount: RequestedAmount,
  purpose: AcademicPurposeSchema,
});

export const ApplyDraftSchema = z.object({
  institutionId: z.ulid({ error: "Kampus tujuan tidak valid" }).optional(),
  requestedAmount: RequestedAmount.optional(),
  purpose: AcademicPurposeSchema.optional(),
  purposeNote: PurposeNote.optional(),
});

export const SimulationSchema = z.object({
  requestedAmount: RequestedAmount,
  tenorMonths: TenorMonths,
  firstDueDate: PlainDateString,
});

export type ApplyInput = z.infer<typeof ApplySchema>;
export type ApplyDraftInput = z.infer<typeof ApplyDraftSchema>;
export type SimulationInput = z.infer<typeof SimulationSchema>;
