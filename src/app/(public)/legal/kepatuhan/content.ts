import type { LegalSection } from "../_components/legal-page";

export const COMPLIANCE_VERSION = "Draf v0.1";
export const COMPLIANCE_UPDATED_AT = "13 Oktober 2026";

export const COMPLIANCE_SUMMARY = [
  "Vidyagata adalah penyelenggara teknologi yang menyambungkan mahasiswa dengan mitra pembiayaan berizin — kami tidak meminjamkan uang.",
  "Kerangka hukum kami: UU Pelindungan Data Pribadi, UU ITE, UU Perlindungan Konsumen, UU P2SK, dan ketentuan OJK untuk mitra pembiayaan.",
  "Usia minimum 18 tahun berdasar tiga lapis: perlindungan anak, kecakapan hukum perjanjian, dan kebijakan risiko kami sendiri.",
  "Di sisi norma: jujur soal data, menagih dengan sopan, tidak menyesatkan, dan tidak pernah menjual data pengguna.",
] as const;

export const COMPLIANCE_SECTIONS: readonly LegalSection[] = [
  {
    id: "peran",
    title: "Posisi kami dalam rantai layanan",
    paragraphs: [
      "Vidyagata adalah penyelenggara sistem elektronik: kami membangun dan mengoperasikan teknologi yang menyambungkan mahasiswa dengan mitra pembiayaan berizin. Dana pembiayaan disalurkan oleh mitra, bukan oleh kami.",
      "Konsekuensinya jelas: keputusan kredit, pencairan, dan penagihan berada di tangan mitra berizin, sementara pengelolaan data, transparansi biaya, dan pengalaman layanan berada di tangan kami.",
    ],
  },
  {
    id: "dasar-hukum",
    title: "Dasar hukum yang kami ikuti",
    paragraphs: [
      "Kami menyusun kebijakan, alur, dan produk mengikuti aturan yang berlaku di Indonesia. Daftar berikut adalah rujukan utama, bukan daftar lengkap, karena aturan turunan terus terbit.",
    ],
    items: [
      "UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi — hak subjek data, kewajiban pengendali, dan kewajiban notifikasi jika terjadi kegagalan pelindungan data.",
      "UU No. 1 Tahun 2024 tentang perubahan kedua UU ITE, bersama PP No. 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik — termasuk kewajiban registrasi penyelenggara sistem elektronik.",
      "UU No. 8 Tahun 1999 tentang Perlindungan Konsumen — hak atas informasi yang benar dan jujur, serta perlakuan yang tidak diskriminatif.",
      "UU No. 4 Tahun 2023 tentang Pengembangan dan Penguatan Sektor Keuangan dan POJK 10/POJK.05/2022 tentang Layanan Pendanaan Bersama Berbasis Teknologi Informasi — kerangka yang wajib dipatuhi mitra pembiayaan kami.",
      "UU No. 23 Tahun 2002 tentang Perlindungan Anak — anak adalah setiap orang di bawah 18 tahun; dasar kebijakan usia minimum kami.",
      "Kitab Undang-Undang Hukum Perdata — soal kecakapan membuat perjanjian; konteks mengapa layanan pembiayaan hanya untuk pengguna dewasa.",
      "Ketentuan pelindungan konsumen sektor jasa keuangan, termasuk mekanisme penyelesaian sengketa lewat LAPS SJK (POJK 61/POJK.07/2020) dan kanal pengawasan OJK.",
    ],
  },
  {
    id: "asas-pdp",
    title: "Asas yang kami pegang saat memproses data",
    paragraphs: [
      "Setiap fitur yang menyentuh data pribadi harus lulus pemeriksaan asas berikut sebelum dibangun. Kalau gagal salah satunya, fiturnya tidak jadi dibangun.",
    ],
    items: [
      "Legalitas — selalu ada dasar pemrosesan yang sah, bukan sekadar karena datanya bisa diambil.",
      "Proporsional — data yang diminta sepadan dengan tujuan yang kamu pahami.",
      "Minimalis — kami meminta sesedikit mungkin, sedini mungkin ditolak.",
      "Akurasi — data boleh kamu koreksi, dan akibat data salah yang kami buat ditanggung kami.",
      "Keamanan — terenkripsi saat transit dan saat disimpan, akses terbatas per peran, setiap akses tercatat.",
      "Akuntabilitas — pertanggungjawaban punya nama, bukan 'sistem yang salah'.",
    ],
  },
  {
    id: "usia-minimum",
    title: "Kenapa usia minimum 18 tahun",
    paragraphs: [
      "Aturan perlindungan anak memperlakukan setiap orang di bawah 18 tahun sebagai anak dengan pelindungan khusus. Sementara perjanjian pembiayaan menuntut kecakapan hukum yang penuh.",
      "Sampai alur persetujuan orang tua atau wali siap secara penuh dan teruji, kami memilih kebijakan yang lebih ketat: tidak ada pembiayaan untuk pengguna di bawah 18 tahun. Pelamar yang belum cukup umur diarahkan ke halaman penjelasan, tanpa akun dibuat.",
      "Untuk pengguna yang sah, batas ini juga melindungimu: perjanjian pembiayaan tanpa kecakapan penuh berisiko menimbulkan masalah hukum di kemudian hari.",
    ],
  },
  {
    id: "pembiayaan",
    title: "Ketentuan yang kami pastikan di sisi pembiayaan",
    paragraphs: [
      "Kami memilih mitra dan menyusun alur dengan batasan yang jelas, karena risiko terbesar industri ini lahir dari kelalaian kecil yang dibiarkan.",
    ],
    items: [
      "Hanya bekerja dengan mitra pembiayaan yang terdaftar dan berada di bawah pengawasan otoritas.",
      "Transparansi penuh di awal: pokok, margin, biaya layanan, dan denda dijelaskan sebelum kamu menyetujui apa pun.",
      "Penagihan hanya kepada peminjam — bukan kepada keluarga, atasan, atau grup pertemanan. Data tidak pernah disebar karena tunggakan.",
      "Penagihan mengikuti etika asosiasi fintech: hari kerja pada jam yang wajar, bukan tengah malam.",
      "Mitra kami dilarang mengakses kontak ponsel, galeri foto, atau data lain yang tidak diperlukan untuk penilaian kredit.",
      "Tidak ada biaya tersembunyi, tidak ada biaya di muka, dan tidak ada syarat yang disembunyikan di paragraf panjang.",
    ],
  },
  {
    id: "norma",
    title: "Norma dan etika",
    paragraphs: [
      "Hukum adalah batas minimal. Ada norma yang tidak diatur tegas tapi tetap kami pegang, karena meninggalkannya sama dengan kehilangan alasan kami dibangun.",
    ],
    items: [
      "Kejujuran — setiap angka di layar bisa dipertanggungjawabkan dengan perhitungan, bukan estimasi pemasaran.",
      "Tidak menyesatkan — tidak memakai kata 'gratis' atau 'bunga nol' yang menyembunyikan biaya.",
      "Sopan — komunikasi resmi kami tidak mengancam, tidak mempermalukan, dan tidak menekan.",
      "Gotong royong — misi kami pendidikan yang terjangkau; model bisnis harus tetap berpihak pada mahasiswa.",
      "Netral — tidak ada perlakuan istimewa berdasarkan kampus, latar belakang, atau kedekatan pribadi.",
      "Amanah — data yang dititipkan hanya dipakai untuk hal yang kamu tahu dan setujui.",
    ],
  },
  {
    id: "peninjauan",
    title: "Peninjauan dan pembaruan",
    paragraphs: [
      "Regulasi bergerak cepat, kadang lebih cepat dari produk kami. Kami meninjau dokumen ini secara berkala dan menyimpan riwayat versi agar setiap perubahan bisa ditelusuri.",
      "Pertanyaan soal kepatuhan bisa dikirim ke kanal kontak resmi yang akan dicantumkan pada versi final dokumen ini.",
    ],
  },
];
