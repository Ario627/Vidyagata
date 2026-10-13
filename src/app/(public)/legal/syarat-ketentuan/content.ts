import type { LegalSection } from "../_components/legal-page";

export const TERMS_VERSION = "Draf v0.1";
export const TERMS_UPDATED_AT = "13 Oktober 2026";

export const TERMS_SUMMARY = [
  "Vidyagata mempertemukanmu dengan mitra pembiayaan berizin dan mitra usaha — keputusan akhir selalu ada di pihak mitra.",
  "Dana pembiayaan selalu dicairkan ke rekening institusi pendidikan, tidak pernah ke rekening pribadi.",
  "Kode verifikasi adalah kunci akunmu; kami tidak pernah memintanya darimu.",
  "Angka final — margin, service fee, jadwal cicilan, konsekuensi keterlambatan — selalu tertulis di perjanjian yang kamu tandatangani.",
] as const;

export const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    id: "definisi",
    title: "Definisi",
    paragraphs: [
      "Istilah-istilah berikut dipakai konsisten di seluruh dokumen ini.",
    ],
    items: [
      "Vidyagata — platform yang mempertemukan pembiayaan pendidikan dengan kerja part-time.",
      "VidyaFund — fasilitas pembiayaan pendidikan yang disalurkan bersama mitra pembiayaan berizin.",
      "Earn2Study — program penyaluran kerja part-time bagi pengguna.",
      "Mitra pembiayaan — lembaga berizin yang memutuskan pemberian pembiayaan.",
      "Mitra usaha — perusahaan yang menempatkan pengguna bekerja.",
      "Perjanjian — dokumen pembiayaan yang kamu tandatangani secara digital.",
    ],
  },
  {
    id: "akun",
    title: "Akunmu",
    paragraphs: [
      "Satu akun untuk satu orang, dengan data yang benar dan bisa diverifikasi. Data yang tidak benar bisa membatalkan proses pengajuan dan menangguhkan akun.",
      "Kode verifikasi adalah kunci akunmu. Kami tidak pernah memintanya darimu lewat kanal mana pun — jangan pernah memberikannya kepada siapa pun.",
    ],
  },
  {
    id: "peran-kami",
    title: "Peran kami, keputusan mitra",
    paragraphs: [
      "Vidyagata mempertemukan, menyaring, dan memantau. Keputusan pemberian pembiayaan ada pada mitra pembiayaan, dan keputusan penerimaan kerja ada pada mitra usaha.",
      "Kami tidak menjamin pengajuanmu disetujui atau lamaranmu diterima, dan tidak pernah menyampaikan sebaliknya.",
    ],
  },
  {
    id: "pembiayaan",
    title: "Pembiayaan",
    paragraphs: [
      "Pengajuan melewati penyaringan internal lalu verifikasi oleh mitra pembiayaan. Status di aplikasi selalu mengikuti keputusan terbaru dari proses itu.",
      "Dana dicairkan langsung ke rekening institusi pendidikan. Angka final — margin, service fee, jadwal cicilan, dan konsekuensi keterlambatan — tertulis di perjanjian yang kamu tandatangani.",
    ],
  },
  {
    id: "pembayaran",
    title: "Pembayaran dan potongan penghasilan",
    paragraphs: [
      "Kamu memilih porsi potongan cicilan dari penghasilan kerja: 20%, 40%, atau 60%. Potongan berjalan otomatis setelah penghasilanmu masuk, dan sisanya tetap milikmu.",
      "Jika terjadi keterlambatan, masa tenggang dan konsekuensinya mengikuti apa yang tertulis di perjanjianmu — tidak ada aturan yang muncul di luar dokumen itu.",
    ],
  },
  {
    id: "kerja",
    title: "Kerja part-time",
    paragraphs: [
      "Penempatan disusun berdasarkan kecocokan skill dan jadwal kuliahmu. Kamu yang memilih lowongan dan melamar; mitra usaha yang menyetujui.",
      "Hubungan kerja terbentuk langsung antara kamu dan mitra usaha. Vidyagata bukan pemberi kerja dan tidak menjadi pihak dalam kontrak kerjamu.",
    ],
  },
  {
    id: "penyalahgunaan",
    title: "Penyalahgunaan layanan",
    paragraphs: [
      "Akun bisa ditangguhkan jika ada pemalsuan dokumen, penyalahgunaan akses, atau pelanggaran ketentuan ini.",
      "Penangguhan selalu disertai alasan, dan kamu bisa menanggapinya lewat kanal resmi.",
    ],
  },
  {
    id: "hukum",
    title: "Hukum yang berlaku dan perubahan",
    paragraphs: [
      "Ketentuan ini tunduk pada hukum Republik Indonesia.",
      "Perubahan ketentuan diberitahukan sebelum berlaku, dan versi yang berlaku selalu bisa kamu buka di halaman ini.",
      "Pertanyaan soal ketentuan ini bisa disampaikan lewat kanal kontak resmi yang akan dicantumkan pada versi final.",
    ],
  },
];
