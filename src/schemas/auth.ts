import { z } from "zod";
import { PhoneNumberID } from "./common";

export const OTP_CODE_LENGTH = 6;

export const OtpCode = z
  .string()
  .regex(new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`), {
    error: `Kode verifikasi harus ${OTP_CODE_LENGTH} digit angka`,
  });

export const RequestOtpSchema = z.object({
  phoneNumber: PhoneNumberID,
});

export const VerifyOtpSchema = z.object({
  phoneNumber: PhoneNumberID,
  code: OtpCode,
  consentVersion: z
    .string()
    .trim()
    .min(1, { error: "Versi persetujuan tidak dikenal" })
    .max(64, { error: "Versi persetujuan tidak dikenal" })
    .optional(),
});

export type RequestOtpInput = z.infer<typeof RequestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
