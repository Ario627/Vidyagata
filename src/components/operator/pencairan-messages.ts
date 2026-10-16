const PENCAIRAN_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  invalid_input: "Data yang dikirim tidak valid.",
  facility_not_found: "Pengajuan tidak ditemukan.",
  invalid_transition:
    "Tahap pembiayaan sudah berubah. Muat ulang lalu coba lagi.",
  reason_required: "Alasan wajib diisi.",
  note_required: "Catatan perjanjian minimal 10 karakter.",
  reference_required: "Nomor bukti transfer wajib diisi minimal 4 karakter.",
  confirmation_required: "Centang konfirmasi verifikasi tujuan dan nominal.",
  not_initiator:
    "Hanya petugas yang mengajukan permintaan ini yang bisa menjalankan langkah tersebut.",
  four_eyes_violation:
    "Kamu petugas yang mengajukan — persetujuan harus datang dari petugas lain.",
  open_request_exists: "Masih ada permintaan pencairan yang berjalan.",
  no_open_request: "Tidak ada permintaan pencairan yang menunggu keputusan.",
  lender_unavailable: "Parameter mitra pembiayaan belum tersedia.",
  facility_incomplete: "Data pembiayaan belum lengkap untuk tahap ini.",
  already_recorded: "Transaksi ini sudah pernah tercatat di ledger.",
  schedule_exists: "Jadwal cicilan untuk pengajuan ini sudah dibuat.",
  internal_error:
    "Ada gangguan saat menyusun jadwal cicilan. Coba lagi sebentar lagi.",
};

export function pencairanErrorMessage(code: string): string {
  return (
    PENCAIRAN_ERROR_MESSAGES[code] ??
    "Ada gangguan di sisi kami. Coba lagi sebentar lagi."
  );
}
