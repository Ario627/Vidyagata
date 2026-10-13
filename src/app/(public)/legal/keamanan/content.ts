import type { LegalSection } from "../_components/legal-page";

export const SECURITY_VERSION = "Draf v0.1";
export const SECURITY_UPDATED_AT = "13 Oktober 2026";

export const SECURITY_SUMMARY = [
  "Transport dan penyimpanan terenkripsi; kata sandi disimpan sebagai hash satu arah yang tidak bisa dibaca siapa pun.",
  "Kami tidak pernah meminta kode OTP, PIN, atau kata sandi lewat telepon, pesan, atau tautan.",
  "Laporkan kerentanan ke keamanan@vidyagata.id — pelaporan dengan itikad baik kami tanggapi, bukan kami tuntut.",
  "Kalau terjadi kegagalan pelindungan data, kamu dan otoritas diberi tahu sesuai tenggat yang diatur UU PDP.",
] as const;

export const SECURITY_SECTIONS: readonly LegalSection[] = [
  {
    id: "prinsip",
    title: "Cara kami melindungi layanan",
    paragraphs: [
      "Keamanan kami rancang sebagai lapisan, bukan satu tembok. Setiap lapisan mengasumsikan lapisan sebelumnya bisa saja gagal.",
    ],
    items: [
      "Seluruh lalu lintas antara perambanmu dan server kami memakai koneksi terenkripsi.",
      "Kata sandi disimpan sebagai hash satu arah — tidak ada yang bisa membacanya kembali, termasuk tim kami.",
      "Sesi login disimpan di server dan bisa dicabut kapan saja; ini alasan kami tidak memakai token mandiri yang tak bisa ditarik.",
      "Kode verifikasi berumur pendek, sekali pakai, dan disimpan dalam bentuk hash.",
      "Percobaan berulang dibatasi otomatis: pengiriman ulang dan percobaan kode punya batas waktunya sendiri.",
      "Kebijakan keamanan konten dan pemeriksaan asal-permintaan aktif di seluruh halaman dan endpoint.",
    ],
  },
  {
    id: "tidak-diminta",
    title: "Yang tidak pernah kami minta",
    paragraphs: [
      "Modus penipuan paling umum di Indonesia menyamar sebagai tim layanan keuangan. Tiga hal berikut tidak pernah kami minta, dalam kondisi apa pun.",
    ],
    items: [
      "Kode OTP yang masuk ke HP atau emailmu — sekalipun yang menghubungi mengaku dari Vidyagata.",
      "Kata sandi atau PIN akunmu.",
      "Transfer biaya apa pun ke rekening pribadi. Semua pembayaran resmi selalu lewat kanal resmi yang tercatat atas namamu.",
    ],
    closing:
      "Kalau ada yang meminta salah satunya, putuskan komunikasi lalu laporkan ke kanal pengaduan resmi kami.",
  },
  {
    id: "data-minimal",
    title: "Kami hanya meminta yang perlu",
    paragraphs: [
      "Aplikasi dan situs kami tidak meminta akses kontak, galeri, lokasi, atau mikrofon. Dokumen identitas hanya diminta saat pengajuan pembiayaan, tidak saat mendaftar.",
      "Nomor HP dan email di layar-layar tertentu kami samarkan supaya tidak ikut terekam di tangkapan layar atau log sistem.",
    ],
  },
  {
    id: "catatan-perangkat",
    title: "Catatan perangkat untuk batas usia",
    paragraphs: [
      "Saat kamu menyatakan tanggal lahir di bawah 18 tahun, kami mencatat perangkat yang dipakai agar pendaftaran ulang sebelum cukup umur bisa dicegah. Catatannya hanya berupa gabungan alamat jaringan dan identitas peramban yang digabung lalu diacak satu arah (hash) — tidak bisa dibaca balik menjadi alamat atau identitas.",
      "Tanggal lahirmu tidak disimpan. Yang tersimpan hanya tanggal kapan pembatasan berakhir, dan catatan itu kedaluwarsa otomatis pada tanggal tersebut.",
      "Kami sadar alamat jaringan bisa dipakai bersama (wifi kampus, warnet, jaringan keluarga). Karena itu catatan ini tidak pernah jadi satu-satunya pagar: pemeriksaan tanggal lahir di server tetap berlaku untuk semua orang, di semua jalur pendaftaran.",
    ],
  },
  {
    id: "pelaporan",
    title: "Melaporkan kerentanan",
    paragraphs: [
      "Kalau kamu menemukan celah keamanan di layanan kami, tolong laporkan ke keamanan@vidyagata.id sebelum membagikannya ke publik. Kami akan mengonfirmasi penerimaan, menyelidiki, dan memberi kabar kemajuannya.",
    ],
    items: [
      "Jangan mengakses, mengubah, atau mengunduh data milik pengguna lain selama pengujian.",
      "Jangan mengganggu ketersediaan layanan untuk pengguna lain.",
      "Beri kami waktu yang wajar untuk memperbaiki sebelum mempublikasikan.",
      "Sertakan langkah reproduksi secukupnya agar kami bisa memverifikasi tanpa menebak.",
    ],
    closing:
      "Pelaporan dengan itikad baik tidak akan kami proses secara hukum. Saat ini kami belum menjalankan program imbalan, tetapi laporan yang berdampak besar kami catat dan hargai secara terbuka bila kamu mengizinkan.",
  },
  {
    id: "insiden",
    title: "Kalau terjadi insiden data",
    paragraphs: [
      "Kegagalan pelindungan data bisa terjadi pada layanan mana pun. Yang membedakan adalah apa yang dilakukan setelahnya.",
      "Kami menjalankan prosedur penanganan insiden: menghentikan penyebaran, menyelidiki akar masalah, lalu memberi tahu pengguna yang terdampak dan otoritas sesuai tenggat yang diatur UU Pelindungan Data Pribadi — paling lambat tiga hari sejak diketahui.",
      "Pemberitahuan berisi apa yang terjadi, data apa yang terdampak, apa yang sudah kami lakukan, dan apa yang perlu kamu lakukan.",
    ],
  },
  {
    id: "kamu",
    title: "Kebiasaan aman dari sisimu",
    paragraphs: [
      "Sebagian besar insiden akun bukan kegagalan teknologi, melainkan kata sandi yang dipakai ulang. Beberapa kebiasaan berikut menutup sebagian besar risikonya.",
    ],
    items: [
      "Pakai kata sandi yang unik untuk Vidyagata — jangan sama dengan email atau media sosialmu.",
      "Aktifkan pembaruan otomatis di peramban dan sistem operasimu.",
      "Periksa alamat situs sebelum memasukkan kata sandi; kami tidak pernah minta login lewat tautan aneh.",
      "Keluarkan sesi perangkat lain kalau kamu merasa pernah login dari perangkat yang bukan milikmu.",
    ],
  },
];
