import { evaluateAgeGate, jakartaPlainDateOf } from "@/domain/account/age";
import { parsePlainDate } from "@/domain/time/plain-date";

export type SignUpRejection = {
  readonly error: string;
  readonly errorDescription: string;
};

export type AgeGateInput = {
  readonly method: string;
  readonly birthdate: unknown;
  readonly now: Date;
};

const UNDERAGE_MESSAGE =
  "Vidyagata belum bisa memproses pendaftaran untuk usia di bawah 18 tahun. Kamu bisa memakai halaman edukasi dan simulasi kami tanpa akun.";
const INVALID_MESSAGE = "Tanggal lahir tidak berformat YYYY-MM-DD";
const REQUIRED_MESSAGE = "Tanggal lahir wajib diisi saat mendaftar";

export function evaluateSignUpAgeGate(
  input: AgeGateInput,
): SignUpRejection | null {
  if (input.birthdate === undefined || input.birthdate === null) {
    return input.method === "email-password"
      ? { error: "BIRTHDATE_REQUIRED", errorDescription: REQUIRED_MESSAGE }
      : null;
  }
  if (typeof input.birthdate !== "string") {
    return { error: "BIRTHDATE_INVALID", errorDescription: INVALID_MESSAGE };
  }
  const birthdate = parsePlainDate(input.birthdate);
  if (!birthdate.ok) {
    return { error: "BIRTHDATE_INVALID", errorDescription: INVALID_MESSAGE };
  }
  const today = jakartaPlainDateOf(input.now);
  if (today === null) {
    return {
      error: "AGE_CHECK_UNAVAILABLE",
      errorDescription: "Pendaftaran tidak bisa diverifikasi sekarang.",
    };
  }
  const decision = evaluateAgeGate(birthdate.value, today);
  if (decision.kind === "eligible") return null;
  return { error: "UNDERAGE", errorDescription: UNDERAGE_MESSAGE };
}
