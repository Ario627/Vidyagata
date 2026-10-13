import { z } from "zod";
import { PlainDateString } from "./common";

export const EMAIL_MAX_LENGTH = 254;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;
export const FULL_NAME_MIN_LENGTH = 3;
export const FULL_NAME_MAX_LENGTH = 80;
export const BIRTHDATE_MIN_YEAR = 1900;

export const USERNAME_PATTERN = /^[a-z0-9_]+$/;

export const EmailAddress = z
  .string()
  .trim()
  .toLowerCase()
  .max(EMAIL_MAX_LENGTH, { error: "Email terlalu panjang" })
  .pipe(z.email({ error: "Format email belum benar, contoh nama@email.com" }));

export const UsernameInput = z
  .string()
  .trim()
  .toLowerCase()
  .min(USERNAME_MIN_LENGTH, {
    error: `Username minimal ${USERNAME_MIN_LENGTH} karakter`,
  })
  .max(USERNAME_MAX_LENGTH, {
    error: `Username maksimal ${USERNAME_MAX_LENGTH} karakter`,
  })
  .regex(USERNAME_PATTERN, {
    error: "Gunakan huruf kecil, angka, dan garis bawah saja",
  });

export const PasswordInput = z
  .string()
  .min(PASSWORD_MIN_LENGTH, {
    error: `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter`,
  })
  .max(PASSWORD_MAX_LENGTH, {
    error: `Kata sandi maksimal ${PASSWORD_MAX_LENGTH} karakter`,
  })
  .regex(/[a-z]/, { error: "Sertakan minimal satu huruf kecil" })
  .regex(/[0-9]/, { error: "Sertakan minimal satu angka" });

export const FullNameInput = z
  .string()
  .trim()
  .min(FULL_NAME_MIN_LENGTH, {
    error: `Nama minimal ${FULL_NAME_MIN_LENGTH} karakter`,
  })
  .max(FULL_NAME_MAX_LENGTH, {
    error: `Nama maksimal ${FULL_NAME_MAX_LENGTH} karakter`,
  });

export const BirthdateInput = PlainDateString.refine(
  (value) => Number(value.slice(0, 4)) >= BIRTHDATE_MIN_YEAR,
  { error: `Tanggal lahir tidak wajar sebelum tahun ${BIRTHDATE_MIN_YEAR}` },
);
