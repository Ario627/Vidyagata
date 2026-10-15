const OTP_SUBJECTS: Readonly<Record<string, string>> = {
  "email-verification": "Kode verifikasi email Vidyagata",
  "forget-password": "Kode atur ulang kata sandi Vidyagata",
  "change-email": "Kode verifikasi perubahan email",
  "sign-in": "Kode masuk Vidyagata",
};

const GENERIC_SUBJECT = "Kode Vidyagata";

export function buildOtpEmailSubject(type: string): string {
  return OTP_SUBJECTS[type] ?? GENERIC_SUBJECT;
}

export function buildOtpEmailText(otp: string, ttlMs: number): string {
  const minutes = Math.round(ttlMs / 60_000);
  return [
    `Kode Vidyagata: ${otp}`,
    "",
    `Kode ini berlaku ${minutes} menit dan hanya bisa dipakai sekali.`,
    "Jangan bagikan kode ini ke siapa pun, termasuk yang mengaku tim Vidyagata.",
    "",
    "Kalau kamu tidak meminta kode ini, abaikan saja email ini.",
  ].join("\n");
}

export function buildPasswordResetEmailSubject(): string {
  return "Atur ulang kata sandi Vidyagata";
}

export function buildPasswordResetEmailText(
  resetUrl: string,
  ttlMs: number,
): string {
  const minutes = Math.round(ttlMs / 60_000);
  return [
    "Kami menerima permintaan atur ulang kata sandi untuk akun Vidyagata ini.",
    "",
    `Buka tautan berikut untuk membuat kata sandi baru. Tautan berlaku ${minutes} menit dan hanya bisa dipakai sekali:`,
    resetUrl,
    "",
    "Jangan bagikan tautan ini ke siapa pun, termasuk yang mengaku tim Vidyagata.",
    "Kalau kamu tidak meminta ini, abaikan saja email ini — kata sandimu tidak berubah.",
  ].join("\n");
}
