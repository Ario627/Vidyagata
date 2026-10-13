import type { LegalSection } from "../_components/legal-page";

export const PRIVACY_VERSION = "Draf v0.1";
export const PRIVACY_UPDATED_AT = "13 Oktober 2026";

export const PRIVACY_SUMMARY = [
  "Kami memproses datamu untuk menilai kelayakan dan menjalankan layanan — bukan untuk dijual.",
  "Data identitas dan dokumen hanya dibuka di alur verifikasi yang diaudit.",
  "Penyerahan data ke mitra pembiayaan hanya terjadi setelah persetujuan terpisah darimu.",
  "Hak akses, koreksi, penghapusan, dan penarikan persetujuan bisa kamu gunakan kapan saja.",
] as const;

export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    id: "peran-kami",
    title: "Peran kami atas datamu",
    paragraphs: [
      "Untuk data pribadi yang kamu berikan lewat Vidyagata, kami berperan sebagai pengendali data pribadi sesuai UU No. 27/2022 tentang Pelindungan Data Pribadi. Artinya kami yang menentukan tujuan dan cara pemrosesan, dan kami yang bertanggung jawab menanggapi permintaanmu soal data.",
      "Saat pengajuanmu diteruskan ke mitra pembiayaan, mitra tersebut menjadi pengendali sendiri atas data yang mereka terima untuk proses kredit mereka. Penyerahan itu tidak pernah terjadi tanpa persetujuan terpisah darimu.",
    ],
  },
  {
    id: "data-yang-diproses",
    title: "Data yang kami proses",
    paragraphs: [
      "Kami memproses data yang kamu berikan sendiri, data yang dihasilkan dari penggunaan layanan, dan data verifikasi dari institusi mitra. Kami tidak membeli data pribadi dari pihak mana pun.",
      "Dokumen identitas hanya dibuka dalam alur verifikasi, tidak pernah ditampilkan di antarmuka biasa, dan setiap pembukaannya tercatat.",
    ],
    items: [
      "Identitas dan kontak — nama, nomor HP, email.",
      "Data akademik — kampus atau sekolah, program studi, dan semester berjalan.",
      "Data ekonomi — rencana biaya pendidikan dan informasi penghasilan yang kamu isi.",
      "Dokumen verifikasi — identitas dan dokumen pendukung sesuai kebutuhan mitra pembiayaan.",
      "Data kerja — profil skill, lamaran, penempatan, dan penghasilan dari kerja part-time.",
    ],
  },
  {
    id: "tujuan",
    title: "Mengapa data diproses",
    paragraphs: [
      "Setiap pemrosesan terikat pada tujuan yang jelas, dan data tidak dipakai di luar tujuan itu tanpa dasar pemrosesan yang baru.",
    ],
    items: [
      "Menilai kelayakan dan menghitung plafon pembiayaanmu.",
      "Memverifikasi status kuliah bersama kampus atau sekolah mitra.",
      "Meneruskan pengajuan ke mitra pembiayaan setelah kamu setuju.",
      "Mencocokkan lowongan kerja dan menyiapkan skema potongan cicilan.",
      "Mengirim pemberitahuan layanan, seperti pengingat jatuh tempo.",
    ],
    closing:
      "Pesan pemasaran hanya dikirim jika kamu memberikan persetujuan terpisah, dan persetujuan itu bisa ditarik kapan saja tanpa memengaruhi layananmu.",
  },
  {
    id: "pihak-lain",
    title: "Siapa yang bisa menerima data",
    paragraphs: [
      "Data dibagikan seperlunya — hanya kepada pihak yang membutuhkannya untuk menjalankan bagiannya, dan hanya setelah dasar pemrosesan yang sah terpenuhi.",
    ],
    items: [
      "Mitra pembiayaan berizin — menerima data pengajuan hanya setelah persetujuan terpisah per penyerahan.",
      "Kampus atau sekolah mitra — menerima data yang diperlukan untuk memverifikasi statusmu.",
      "Mitra usaha — menerima profil yang relevan hanya setelah kamu melamar suatu posisi.",
      "Prosesor infrastruktur — hosting, pemantauan, dan verifikasi identitas; bekerja atas instruksi kami di bawah perjanjian pemrosesan data.",
    ],
    closing:
      "Kami tidak menjual data pribadi, dan tidak pernah mengirim seluruh profilmu ke semua mitra usaha.",
  },
  {
    id: "retensi",
    title: "Berapa lama data disimpan",
    paragraphs: [
      "Data disimpan selama akunmu aktif dan selama masih diperlukan untuk tujuan di atas.",
      "Setelah pembiayaan tuntas, dokumen keuangan disimpan sesuai kewajiban hukum yang berlaku, lalu dihapus atau dianonimkan.",
      "Data yang tidak lagi diperlukan kami hapus lebih awal — termasuk ketika kamu meminta penghapusan dan tidak ada kewajiban hukum yang menghalanginya.",
    ],
  },
  {
    id: "hak-kamu",
    title: "Hakmu atas data",
    paragraphs: [
      "Hak-hak ini bisa kamu gunakan lewat halaman Profil atau kanal kontak resmi, dan kami menanggapinya dalam batas waktu yang diatur UU PDP.",
    ],
    items: [
      "Melihat dan mengunduh salinan data yang kami simpan.",
      "Meminta koreksi atas data yang tidak akurat atau tidak lengkap.",
      "Meminta penghapusan data, sejauh tidak bertentangan dengan kewajiban hukum.",
      "Menarik persetujuan yang pernah kamu berikan.",
      "Mengajukan keberatan atau keluhan atas pemrosesan data.",
    ],
  },
  {
    id: "keamanan",
    title: "Cara kami menjaga data",
    paragraphs: [
      "Data dienkripsi saat transit dan saat disimpan. Akses dibatasi per peran, dan data sensitif hanya bisa dibuka lewat alur yang diaudit.",
      "Data pribadi tidak ditulis ke log sistem: nomor HP, dokumen, dan kode verifikasi disamarkan sebelum meninggalkan server.",
    ],
  },
  {
    id: "usia",
    title: "Pengguna di bawah 18 tahun",
    paragraphs: [
      "Data pengguna di bawah 18 tahun hanya diproses dengan persetujuan orang tua atau wali.",
      "Sampai alur persetujuan wali siap sepenuhnya, kami tidak membuka pengajuan pembiayaan untuk pengguna di bawah 18 tahun dan mengarahkan mereka ke konten edukasi.",
    ],
  },
  {
    id: "perubahan",
    title: "Perubahan dokumen ini",
    paragraphs: [
      "Setiap versi naskah ini dicatat beserta tanggal berlakunya, sehingga versi yang kamu setujui saat mendaftar selalu bisa direkonstruksi.",
      "Perubahan yang memengaruhi hakmu diberitahukan lebih dulu lewat kanal resmi.",
      "Pertanyaan soal dokumen ini bisa disampaikan lewat kanal kontak resmi yang akan dicantumkan pada versi final.",
    ],
  },
];
