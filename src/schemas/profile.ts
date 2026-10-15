import { z } from "zod";

export const PROFILE_ACADEMIC_STATUSES = [
  "high_school",
  "undergraduate",
  "graduated",
  "dropout",
] as const;

const GpaText = z
  .string()
  .trim()
  .regex(/^[0-4]([.,]\d{1,2})?$/, {
    error: "Format IPK contoh: 3,45 (skala 4)",
  });

export const ProfilePayload = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, { error: "Nama minimal 3 karakter" })
      .max(80, { error: "Nama maksimal 80 karakter" }),
    academicStatus: z.enum(PROFILE_ACADEMIC_STATUSES),
    institutionId: z.string().trim().min(1).nullable(),
    currentSemester: z
      .number()
      .int({ error: "Semester harus angka bulat" })
      .min(1, { error: "Semester minimal 1" })
      .max(24, { error: "Semester maksimal 24" })
      .nullable(),
    gpa: GpaText.nullable(),
    province: z
      .string()
      .trim()
      .min(3, { error: "Provinsi wajib diisi" })
      .max(60, { error: "Provinsi terlalu panjang" }),
    city: z
      .string()
      .trim()
      .min(3, { error: "Kota wajib diisi" })
      .max(60, { error: "Kota terlalu panjang" }),
    addressLine: z.string().trim().max(160).nullable(),
    hobby: z
      .string()
      .trim()
      .max(120, { error: "Hobi maksimal 120 karakter" })
      .nullable(),
    bio: z
      .string()
      .trim()
      .max(280, { error: "Cerita maksimal 280 karakter" })
      .nullable(),
  })
  .strict();

export type ProfilePayloadInput = z.infer<typeof ProfilePayload>;

export function parseGpaHundredths(text: string | null): number | null {
  if (text === null) return null;
  const value = Number(text.replace(",", "."));
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

export function profileFieldErrors(
  error: z.ZodError,
): Readonly<Record<string, string>> {
  const flat = z.flattenError(error).fieldErrors;
  const result: Record<string, string> = {};
  for (const [field, messages] of Object.entries(flat)) {
    const first = Array.isArray(messages) ? messages[0] : undefined;
    if (typeof first === "string") result[field] = first;
  }
  return result;
}
