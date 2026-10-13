import type { LegalSection } from "../_components/legal-page";

export const COMPLAINT_VERSION = "Draf v0.1";
export const COMPLAINT_UPDATED_AT = "13 Oktober 2026";

export const COMPLAINT_SUMMARY = [
  "Semua pengaduan masuk lewat kanal resmi dan mendapat nomor tiket agar bisa dilacak.",
  "Target kami: konfirmasi maksimal 2 hari kerja, penyelesaian maksimal 20 hari kerja.",
  "Kalau kamu tidak sepakat dengan hasilnya, sengketa bisa dibawa ke LAPS SJK — independen dan berbiaya ringan.",
  "Pengaduan soal datamu (akses, koreksi, hapus, tarik persetujuan) memakai kanal yang sama dan tenggat UU PDP.",
] as const;

export const COMPLAINT_SECTIONS: readonly LegalSection[] = [
  {
    id: "kanal",
    title: "Kanal pengaduan resmi",
    paragraphs: [
      "Pengaduan diterima lewat kanal resmi yang tercatat — supaya ada bukti, ada nomor tiket, dan tidak ada yang bisa mengaku-ngaku mewakili kami.",
      "Saat dokumen ini berstatus draf, kanal yang aktif adalah alamat pengaduan@vidyagata.id. Versi final akan mencantumkan kanal lengkap beserta jam operasionalnya.",
      "Kami tidak pernah menunjuk pihak ketiga untuk memungut biaya dalam proses pengaduan. Kalau ada yang menawarkan 'bantuan' berbayar agar pengaduanmu cepat selesai, itu penipuan.",
    ],
  },
  {
    id: "proses",
    title: "Bagaimana pengaduanmu diproses",
    paragraphs: [
      "Setiap pengaduan mengikuti alur yang sama, tanpa memandang siapa yang mengirim.",
    ],
    items: [
      "Kamu menerima nomor tiket dan konfirmasi penerimaan maksimal dua hari kerja.",
      "Kami memverifikasi masalahnya: memeriksa catatan transaksi, percakapan, dan data yang relevan.",
      "Kami menyampaikan hasil penyelesaian maksimal 20 hari kerja sesuai ketentuan pelindungan konsumen sektor jasa keuangan. Kalau kasusnya luar biasa kompleks, kami memberi tahu alasannya dan kapan kamu bisa berharap kabar.",
      "Seluruh tahapan dan keputusannya terdokumentasi, sehingga bisa ditinjau ulang kalau kamu mengajukan keberatan.",
    ],
  },
  {
    id: "sengketa",
    title: "Kalau kamu tidak sepakat dengan hasilnya",
    paragraphs: [
      "Penyelesaian internal yang buntu bukan jalan buntu. Kamu punya jalur eksternal yang murah dan tidak mengharuskan pengacara.",
      "Untuk sengketa dengan mitra pembiayaan, jalur yang disediakan regulasi adalah Lembaga Alternatif Penyelesaian Sengketa Sektor Jasa Keuangan (LAPS SJK) — lembaga independen yang menangani mediasi dan arbitrase dengan biaya yang jauh lebih ringan daripada pengadilan.",
      "Kamu juga bisa menyampaikan masalahnya ke kanal pengawasan Otoritas Jasa Keuangan (157, atau kanal resmi OJK lainnya) supaya menjadi catatan pengawasan — terlebih kalau lembaga keuangan yang kamu adu tidak menindaklanjuti.",
    ],
  },
  {
    id: "ilegal",
    title: "Waspada pinjaman ilegal",
    paragraphs: [
      "Kejahatan yang paling sering menyasar mahasiswa bukan pencurian data, melainkan pinjaman dari pihak yang tidak berizin: bunganya tidak terbatas, penagihannya menekan, dan tidak ada lembaga yang bisa kamu adu.",
    ],
    items: [
      "Cek legalitas setiap penyelenggara di kanal resmi OJK sebelum memakai layanannya. Mitra kami selalu bisa ditunjukkan izinnya.",
      "Ciri layanan ilegal: meminta akses daftar kontak, menawarkan cair tanpa penilaian, memungut biaya di muka, dan menagih dengan ancaman.",
      "Kalau kamu sudah terlanjur menjadi korban: jangan bayar dengan cara yang diminta di luar kanal resmi, simpan semua buktinya, lalu lapor lewat kanal pengaduan OJK dan Satgas Pemberantasan Aktivitas Keuangan Ilegal.",
    ],
    closing:
      "Vidyagata tidak pernah meminta pembayaran ke rekening pribadi siapa pun, termasuk ke rekening karyawan kami.",
  },
  {
    id: "data",
    title: "Pengaduan yang menyangkut datamu",
    paragraphs: [
      "Hak atas data — melihat, mengoreksi, menghapus, menarik persetujuan, dan mengajukan keberatan — bisa kamu gunakan lewat kanal pengaduan yang sama. Kami menindaklanjutinya sesuai tenggat yang diatur UU Pelindungan Data Pribadi.",
      "Kalau kamu tidak puas dengan penanganan klaim datamu, kamu bisa mengajukan penyelesaian sengketa pelindungan data pribadi melalui lembaga yang berwenang sesuai mekanisme UU PDP.",
    ],
  },
  {
    id: "siapkan",
    title: "Agar pengaduanmu cepat ditangani",
    paragraphs: [
      "Sertakan informasi berikut sedini mungkin — satu pesan yang lengkap menghemat berhari-hari tanya-jawab.",
    ],
    items: [
      "Nomor akun atau email yang terdaftar. Jangan sertakan kata sandi atau kode OTP.",
      "Kronologi kejadian: tanggal, jam, dan apa yang kamu lakukan.",
      "Tangkapan layar atau bukti pendukung seperlunya.",
      "Hasil yang kamu harapkan — sengketa lebih mudah diselesaikan kalau sejak awal jelas apa yang ingin kamu capai.",
    ],
  },
];
