import type { Db } from "@/lib/db/client";

type EmployerSeed = {
  readonly id: string;
  readonly name: string;
  readonly sector: string;
  readonly city: string;
};

type JobSeed = {
  readonly id: string;
  readonly employerId: string;
  readonly title: string;
  readonly description: string;
  readonly jobType: "part_time" | "project_based" | "internship";
  readonly weeklyHours: number;
  readonly compensationType: "hourly" | "monthly" | "per_project";
  readonly compensationMin: number;
  readonly compensationMax: number;
  readonly locationType: "onsite" | "remote" | "hybrid";
  readonly city: string;
  readonly publishedAt: string;
  readonly skills: readonly string[];
};

const EMPLOYER_SEEDS: readonly EmployerSeed[] = [
  {
    id: "01K7EMPSEED00000000000001",
    name: "Kopi Rakyat Indonesia",
    sector: "Makanan dan minuman",
    city: "Depok",
  },
  {
    id: "01K7EMPSEED00000000000002",
    name: "Studio Kreasi Nusantara",
    sector: "Industri kreatif",
    city: "Bandung",
  },
  {
    id: "01K7EMPSEED00000000000003",
    name: "Bimbel Cendekia",
    sector: "Pendidikan",
    city: "Yogyakarta",
  },
  {
    id: "01K7EMPSEED00000000000004",
    name: "Lembaga Riset Nusantara",
    sector: "Riset dan data",
    city: "Jakarta",
  },
  {
    id: "01K7EMPSEED00000000000005",
    name: "Warung Digital Sehat",
    sector: "Teknologi pangan",
    city: "Surabaya",
  },
  {
    id: "01K7EMPSEED00000000000006",
    name: "Aksara Publishing House",
    sector: "Penerbitan",
    city: "Yogyakarta",
  },
  {
    id: "01K7EMPSEED00000000000007",
    name: "Hijau Lestari Agro",
    sector: "Agriteknologi",
    city: "Malang",
  },
  {
    id: "01K7EMPSEED00000000000008",
    name: "Kelana Wisata Lokal",
    sector: "Pariwisata",
    city: "Denpasar",
  },
  {
    id: "01K7EMPSEED00000000000009",
    name: "Batik Nusa Craft",
    sector: "Kerajinan",
    city: "Surakarta",
  },
  {
    id: "01K7EMPSEED00000000000010",
    name: "Ruang Belajar Ceria",
    sector: "Pendidikan anak",
    city: "Semarang",
  },
  {
    id: "01K7EMPSEED00000000000011",
    name: "Data Prima Analitika",
    sector: "Analitik data",
    city: "Jakarta",
  },
  {
    id: "01K7EMPSEED00000000000012",
    name: "Sehat Bersama Klinik",
    sector: "Kesehatan",
    city: "Makassar",
  },
  {
    id: "01K7EMPSEED00000000000013",
    name: "Logistik Cepat Nusantara",
    sector: "Logistik",
    city: "Bekasi",
  },
  {
    id: "01K7EMPSEED00000000000014",
    name: "Kopi Senja Medan",
    sector: "Makanan dan minuman",
    city: "Medan",
  },
  {
    id: "01K7EMPSEED00000000000015",
    name: "Media Suara Kampus",
    sector: "Media",
    city: "Bandung",
  },
  {
    id: "01K7EMPSEED00000000000016",
    name: "Tekno Servis Handal",
    sector: "Jasa teknologi",
    city: "Tangerang",
  },
];

const JOB_SEEDS: readonly JobSeed[] = [
  {
    id: "01K7JBSEED0000000000000001",
    employerId: "01K7EMPSEED00000000000001",
    title: "Barista Part-time",
    description:
      "Melayani pelanggan, menyiapkan minuman sesuai resep standar, dan menjaga kebersihan area kerja. Jadwal disusun dalam shift pendek agar tetap sejalan dengan jam kuliah.\nPelatihan dasar diberikan pada minggu pertama; kamu akan didampingi barista senior.",
    jobType: "part_time",
    weeklyHours: 16,
    compensationType: "hourly",
    compensationMin: 15_000,
    compensationMax: 20_000,
    locationType: "onsite",
    city: "Depok",
    publishedAt: "2026-10-10T01:00:00.000Z",
    skills: ["Kerja tim", "Pelayanan pelanggan", "Pengolahan kopi"],
  },
  {
    id: "01K7JBSEED0000000000000002",
    employerId: "01K7EMPSEED00000000000002",
    title: "Penulis Konten",
    description:
      "Menulis artikel dan materi pemasaran untuk klien UMKM dengan tenggat mingguan yang jelas. Seluruh pekerjaan dikerjakan jarak jauh dan bisa disesuaikan dengan jadwal kelas.\nKamu akan bekerja bersama editor kami dan mendapat catatan perbaikan di setiap draf.",
    jobType: "part_time",
    weeklyHours: 10,
    compensationType: "monthly",
    compensationMin: 1_500_000,
    compensationMax: 2_500_000,
    locationType: "remote",
    city: "Bandung",
    publishedAt: "2026-10-08T01:00:00.000Z",
    skills: ["Bahasa Indonesia", "Penulisan", "Riset kata kunci"],
  },
  {
    id: "01K7JBSEED0000000000000003",
    employerId: "01K7EMPSEED00000000000002",
    title: "Desainer Grafis Proyek",
    description:
      "Mengerjakan materi identitas visual untuk satu proyek klien selama empat sampai enam minggu: logo, kartu nama, dan templat media sosial.\nPertemuan daring dua kali seminggu; sisanya dikerjakan mandiri.",
    jobType: "project_based",
    weeklyHours: 8,
    compensationType: "per_project",
    compensationMin: 800_000,
    compensationMax: 1_500_000,
    locationType: "hybrid",
    city: "Bandung",
    publishedAt: "2026-10-06T01:00:00.000Z",
    skills: ["Branding", "Desain grafis", "Figma"],
  },
  {
    id: "01K7JBSEED0000000000000004",
    employerId: "01K7EMPSEED00000000000003",
    title: "Tutor Matematika SMA",
    description:
      "Membimbing kelas kecil tiga sampai lima siswa untuk persiapan ujian. Modul dan latihan sudah disiapkan; tugasmu memastikan siswa memahami langkah pengerjaannya.\nJadwal sore, cocok untuk mahasiswa dengan kuliah pagi.",
    jobType: "part_time",
    weeklyHours: 6,
    compensationType: "hourly",
    compensationMin: 50_000,
    compensationMax: 75_000,
    locationType: "onsite",
    city: "Yogyakarta",
    publishedAt: "2026-10-04T01:00:00.000Z",
    skills: ["Komunikasi", "Matematika", "Mengajar"],
  },
  {
    id: "01K7JBSEED0000000000000005",
    employerId: "01K7EMPSEED00000000000001",
    title: "Admin Media Sosial",
    description:
      "Menjadwalkan unggahan, membalas pesan pelanggan di kanal resmi, dan menyusun laporan sederhana mingguan. Bisa dikerjakan jarak jauh dengan jam fleksibel.\nNada bicara merek dan panduan konten diberikan saat onboarding.",
    jobType: "part_time",
    weeklyHours: 12,
    compensationType: "monthly",
    compensationMin: 1_200_000,
    compensationMax: 1_800_000,
    locationType: "remote",
    city: "Depok",
    publishedAt: "2026-10-02T01:00:00.000Z",
    skills: ["Copywriting", "Media sosial", "Penjadwalan konten"],
  },
  {
    id: "01K7JBSEED0000000000000006",
    employerId: "01K7EMPSEED00000000000004",
    title: "Asisten Riset Data",
    description:
      "Merapikan dan menganalisis data survei untuk proyek penelitian sosial: pembersihan data, tabulasi, dan draf awal laporan. Dikerjakan jarak jauh dengan rapat koordinasi mingguan.\nCocok untuk mahasiswa teliti yang ingin mengenal alur riset yang rapi.",
    jobType: "internship",
    weeklyHours: 15,
    compensationType: "monthly",
    compensationMin: 2_000_000,
    compensationMax: 3_000_000,
    locationType: "remote",
    city: "Jakarta",
    publishedAt: "2026-09-30T01:00:00.000Z",
    skills: ["Analisis data", "Penulisan laporan", "Spreadsheet"],
  },
  {
    id: "01K7JBSEED0000000000000007",
    employerId: "01K7EMPSEED00000000000005",
    title: "Staf Dapur Sehat",
    description:
      "Membantu persiapan bahan, penimbangan porsi, dan pengepakan menu harian sesuai standar kebersihan. Shift pagi dan sore bergantian.\nKami menyediakan celemek, sarung tangan, dan makan siang untuk setiap shift.",
    jobType: "part_time",
    weeklyHours: 14,
    compensationType: "hourly",
    compensationMin: 18_000,
    compensationMax: 22_000,
    locationType: "onsite",
    city: "Surabaya",
    publishedAt: "2026-10-12T01:00:00.000Z",
    skills: ["Kerja tim", "Kebersihan", "Manajemen waktu"],
  },
  {
    id: "01K7JBSEED0000000000000008",
    employerId: "01K7EMPSEED00000000000005",
    title: "Kurir Lokal Sepeda",
    description:
      "Mengantar pesanan dalam radius lima kilometer dari dapur dengan sepeda listrik yang kami sediakan. Cocok untuk penghasilan tambahan saat jam senggang.\nTarget harian sederhana dan bonus untuk pengantaran tepat waktu.",
    jobType: "part_time",
    weeklyHours: 12,
    compensationType: "hourly",
    compensationMin: 20_000,
    compensationMax: 28_000,
    locationType: "onsite",
    city: "Surabaya",
    publishedAt: "2026-10-11T01:00:00.000Z",
    skills: ["Navigasi", "Ketelitian", "Pelayanan pelanggan"],
  },
  {
    id: "01K7JBSEED0000000000000009",
    employerId: "01K7EMPSEED00000000000006",
    title: "Editor Naskah Lepas",
    description:
      "Menyunting naskah novel dan buku non-fiksi: ejaan, tanda baca, konsistensi istilah, dan kelancaran kalimat. Sistem per bab dengan tenggat mingguan.\nPedoman gaya rumah penerbitan akan diberikan dan diuji lewat satu bab percobaan.",
    jobType: "project_based",
    weeklyHours: 10,
    compensationType: "per_project",
    compensationMin: 500_000,
    compensationMax: 1_200_000,
    locationType: "remote",
    city: "Yogyakarta",
    publishedAt: "2026-10-09T01:00:00.000Z",
    skills: ["Penyuntingan", "Bahasa Indonesia", "Ketelitian"],
  },
  {
    id: "01K7JBSEED0000000000000010",
    employerId: "01K7EMPSEED00000000000006",
    title: "Ilustrator Sampul",
    description:
      "Membuat satu sampai tiga konsep sampul buku remaja dengan gaya yang disepakati. Revisi maksimal dua putaran per konsep.\nPortofolio ilustrasi diperlukan saat lamaran.",
    jobType: "project_based",
    weeklyHours: 8,
    compensationType: "per_project",
    compensationMin: 700_000,
    compensationMax: 1_500_000,
    locationType: "remote",
    city: "Yogyakarta",
    publishedAt: "2026-10-07T01:00:00.000Z",
    skills: ["Ilustrasi", "Desain grafis", "Komunikasi"],
  },
  {
    id: "01K7JBSEED0000000000000011",
    employerId: "01K7EMPSEED00000000000007",
    title: "Asisten Kebun Hidroponik",
    description:
      "Membantu penanaman, pemberian nutrisi, dan pencatatan pertumbuhan tanaman hidroponik. Pekerjaan pagi hari selama tiga jam per sesi.\nPelatihan singkat diberikan; kamu akan belajar dasar pertanian modern.",
    jobType: "part_time",
    weeklyHours: 12,
    compensationType: "hourly",
    compensationMin: 17_000,
    compensationMax: 21_000,
    locationType: "onsite",
    city: "Malang",
    publishedAt: "2026-10-10T01:00:00.000Z",
    skills: ["Ketelitian", "Pencatatan", "Kerja tim"],
  },
  {
    id: "01K7JBSEED0000000000000012",
    employerId: "01K7EMPSEED00000000000007",
    title: "Admin Pemasaran Tani",
    description:
      "Mengelola katalog daring hasil tani mitra, membalas pertanyaan pembeli, dan menyusun laporan penjualan mingguan. Dikerjakan jarak jauh.\nCocok untuk mahasiswa yang tertarik pada agriteknologi dan pemasaran digital.",
    jobType: "part_time",
    weeklyHours: 10,
    compensationType: "monthly",
    compensationMin: 1_000_000,
    compensationMax: 1_600_000,
    locationType: "remote",
    city: "Malang",
    publishedAt: "2026-10-05T01:00:00.000Z",
    skills: ["Media sosial", "Copywriting", "Spreadsheet"],
  },
  {
    id: "01K7JBSEED0000000000000013",
    employerId: "01K7EMPSEED00000000000008",
    title: "Pemandu Wisata Weekend",
    description:
      "Mendampingi tamu pada paket wisata setengah hari di area kota: menjelaskan rute, menjaga jadwal, dan memastikan kenyamanan kelompok kecil.\nBahasa Inggris dasar diperlukan; pelatihan materi rute diberikan.",
    jobType: "part_time",
    weeklyHours: 12,
    compensationType: "hourly",
    compensationMin: 35_000,
    compensationMax: 50_000,
    locationType: "onsite",
    city: "Denpasar",
    publishedAt: "2026-10-09T01:00:00.000Z",
    skills: ["Bahasa Inggris", "Komunikasi", "Pelayanan pelanggan"],
  },
  {
    id: "01K7JBSEED0000000000000014",
    employerId: "01K7EMPSEED00000000000008",
    title: "Admin Reservasi",
    description:
      "Menangani reservasi lewat WhatsApp dan email, menyusun jadwal pemandu, serta memastikan konfirmasi terkirim tepat waktu.\nPekerjaan bisa dilakukan dari mana saja dengan jam kerja yang disepakati.",
    jobType: "part_time",
    weeklyHours: 14,
    compensationType: "monthly",
    compensationMin: 1_300_000,
    compensationMax: 1_900_000,
    locationType: "remote",
    city: "Denpasar",
    publishedAt: "2026-10-03T01:00:00.000Z",
    skills: ["Komunikasi", "Manajemen waktu", "Layanan pelanggan"],
  },
  {
    id: "01K7JBSEED0000000000000015",
    employerId: "01K7EMPSEED00000000000009",
    title: "Fotografer Produk Batch",
    description:
      "Memotret produk kerajinan batik untuk katalog daring: rata air, satu arah pandang, latar polos. Sekitar tiga puluh produk per batch.\nPeralatan dasar tersedia di studio; kamu boleh membawa kamera sendiri.",
    jobType: "project_based",
    weeklyHours: 8,
    compensationType: "per_project",
    compensationMin: 600_000,
    compensationMax: 1_100_000,
    locationType: "onsite",
    city: "Surakarta",
    publishedAt: "2026-10-08T01:00:00.000Z",
    skills: ["Fotografi", "Komposisi", "Produksi konten"],
  },
  {
    id: "01K7JBSEED0000000000000016",
    employerId: "01K7EMPSEED00000000000009",
    title: "Staf Toko Paruh Waktu",
    description:
      "Menyambut pembeli, menjelaskan produk batik, dan membantu penataan etalase. Shift akhir pekan dengan durasi enam jam.\nKamu akan belajar langsung tentang kerajinan dan cerita di balik produk.",
    jobType: "part_time",
    weeklyHours: 12,
    compensationType: "hourly",
    compensationMin: 16_000,
    compensationMax: 20_000,
    locationType: "onsite",
    city: "Surakarta",
    publishedAt: "2026-10-01T01:00:00.000Z",
    skills: ["Pelayanan pelanggan", "Komunikasi", "Penataan produk"],
  },
  {
    id: "01K7JBSEED0000000000000017",
    employerId: "01K7EMPSEED00000000000010",
    title: "Pengajar Les Membaca",
    description:
      "Mendampingi anak usia sekolah dasar belajar membaca dengan metode yang menyenangkan. Kelas berisi maksimal empat anak.\nModul dan kartu belajar disiapkan; kamu tinggal membawakan dengan sabar dan hangat.",
    jobType: "part_time",
    weeklyHours: 8,
    compensationType: "hourly",
    compensationMin: 40_000,
    compensationMax: 60_000,
    locationType: "onsite",
    city: "Semarang",
    publishedAt: "2026-10-10T01:00:00.000Z",
    skills: ["Mengajar", "Kesabaran", "Komunikasi"],
  },
  {
    id: "01K7JBSEED0000000000000018",
    employerId: "01K7EMPSEED00000000000010",
    title: "Desainer Materi Belajar",
    description:
      "Merapikan lembar kerja anak menjadi tampilan yang menarik dan mudah dibaca: tata letak, warna, dan ilustrasi sederhana.\nSemua dikerjakan jarak jauh dengan acuan gaya yang sudah ada.",
    jobType: "project_based",
    weeklyHours: 8,
    compensationType: "per_project",
    compensationMin: 450_000,
    compensationMax: 900_000,
    locationType: "remote",
    city: "Semarang",
    publishedAt: "2026-10-04T01:00:00.000Z",
    skills: ["Desain grafis", "Canva", "Ketelitian"],
  },
  {
    id: "01K7JBSEED0000000000000019",
    employerId: "01K7EMPSEED00000000000011",
    title: "Analis Data Junior",
    description:
      "Membantu membersihkan data penjualan klien dan membuat dasbor ringkas untuk laporan bulanan. Bekerja jarak jauh dengan rapat mingguan.\nKamu akan memakai spreadsheet dan alat visualisasi sederhana.",
    jobType: "internship",
    weeklyHours: 16,
    compensationType: "monthly",
    compensationMin: 2_200_000,
    compensationMax: 3_200_000,
    locationType: "remote",
    city: "Jakarta",
    publishedAt: "2026-10-11T01:00:00.000Z",
    skills: ["Analisis data", "Spreadsheet", "Visualisasi data"],
  },
  {
    id: "01K7JBSEED0000000000000020",
    employerId: "01K7EMPSEED00000000000011",
    title: "Verifikator Data Survei",
    description:
      "Memeriksa kelengkapan dan kewajaran jawaban survei lapangan, lalu menandai data yang perlu ditanyakan ulang ke enumerator.\nPekerjaan teliti dengan target harian yang wajar dan sistem bonus.",
    jobType: "part_time",
    weeklyHours: 15,
    compensationType: "hourly",
    compensationMin: 25_000,
    compensationMax: 32_000,
    locationType: "remote",
    city: "Jakarta",
    publishedAt: "2026-10-06T01:00:00.000Z",
    skills: ["Ketelitian", "Analisis data", "Komunikasi"],
  },
  {
    id: "01K7JBSEED0000000000000021",
    employerId: "01K7EMPSEED00000000000012",
    title: "Admin Pendaftaran Pasien",
    description:
      "Menyambut pasien, mengarahkan ke poli yang tepat, dan memasukkan data pendaftaran dengan teliti. Shift empat jam pagi atau sore.\nPelatihan sistem dan kerahasiaan data pasien diberikan di hari pertama.",
    jobType: "part_time",
    weeklyHours: 16,
    compensationType: "hourly",
    compensationMin: 19_000,
    compensationMax: 24_000,
    locationType: "onsite",
    city: "Makassar",
    publishedAt: "2026-10-09T01:00:00.000Z",
    skills: ["Pelayanan pelanggan", "Ketelitian", "Manajemen waktu"],
  },
  {
    id: "01K7JBSEED0000000000000022",
    employerId: "01K7EMPSEED00000000000012",
    title: "Penulis Konten Kesehatan",
    description:
      "Menulis artikel edukasi kesehatan ringan yang ramah awam, berdasarkan bahan dari tim medis. Setiap artikel melewati pemeriksaan fakta.\nJarak jauh, dua artikel per minggu dengan tenggat tetap.",
    jobType: "part_time",
    weeklyHours: 8,
    compensationType: "per_project",
    compensationMin: 150_000,
    compensationMax: 250_000,
    locationType: "remote",
    city: "Makassar",
    publishedAt: "2026-10-02T01:00:00.000Z",
    skills: ["Penulisan", "Riset", "Bahasa Indonesia"],
  },
  {
    id: "01K7JBSEED0000000000000023",
    employerId: "01K7EMPSEED00000000000013",
    title: "Operator Sortir Paket",
    description:
      "Menyortir paket sesuai rute pengiriman dan memindai barcode dengan alat yang disediakan. Shift malam pendek untuk pengiriman esok hari.\nTargetnya rapi dan akurat; bonus untuk ketepatan sortir.",
    jobType: "part_time",
    weeklyHours: 18,
    compensationType: "hourly",
    compensationMin: 18_000,
    compensationMax: 23_000,
    locationType: "onsite",
    city: "Bekasi",
    publishedAt: "2026-10-12T01:00:00.000Z",
    skills: ["Ketelitian", "Kerja tim", "Manajemen waktu"],
  },
  {
    id: "01K7JBSEED0000000000000024",
    employerId: "01K7EMPSEED00000000000013",
    title: "Admin Pelacakan Paket",
    description:
      "Membantu pelanggan melacak paket, berkoordinasi dengan kurir, dan mencatat kendala pengiriman dengan rapi.\nDikerjakan jarak jauh dengan panduan penanganan kasus yang jelas.",
    jobType: "part_time",
    weeklyHours: 12,
    compensationType: "monthly",
    compensationMin: 1_100_000,
    compensationMax: 1_700_000,
    locationType: "remote",
    city: "Bekasi",
    publishedAt: "2026-10-05T01:00:00.000Z",
    skills: ["Komunikasi", "Spreadsheet", "Pelayanan pelanggan"],
  },
  {
    id: "01K7JBSEED0000000000000025",
    employerId: "01K7EMPSEED00000000000014",
    title: "Barista Shift Sore",
    description:
      "Menyiapkan kopi susu dan minuman non-kopi untuk jam ramai sore, menjaga kebersihan bar, dan menutup kasir harian.\nKami mencari mahasiswa yang cepat belajar dan ramah.",
    jobType: "part_time",
    weeklyHours: 15,
    compensationType: "hourly",
    compensationMin: 16_000,
    compensationMax: 21_000,
    locationType: "onsite",
    city: "Medan",
    publishedAt: "2026-10-08T01:00:00.000Z",
    skills: ["Pengolahan kopi", "Pelayanan pelanggan", "Kerja tim"],
  },
  {
    id: "01K7JBSEED0000000000000026",
    employerId: "01K7EMPSEED00000000000014",
    title: "Penjaga Kios Malam",
    description:
      "Mengelola kios minuman di lobi kampus pada jam 18.00 sampai 22.00: melayani pembeli dan menutup kios.\nPekerjaan ringan dengan lingkungan yang dekat dari kampus.",
    jobType: "part_time",
    weeklyHours: 16,
    compensationType: "hourly",
    compensationMin: 15_000,
    compensationMax: 19_000,
    locationType: "onsite",
    city: "Medan",
    publishedAt: "2026-10-01T01:00:00.000Z",
    skills: ["Pelayanan pelanggan", "Disiplin", "Kasir"],
  },
  {
    id: "01K7JBSEED0000000000000027",
    employerId: "01K7EMPSEED00000000000015",
    title: "Reporter Kampus",
    description:
      "Meliput kegiatan kampus dan menulis berita pendek untuk kanal daring kami: wawancara singkat, foto pendukung, dan draf dua ratus kata.\nIdeal untuk mahasiswa jurnalistik atau yang suka menulis.",
    jobType: "part_time",
    weeklyHours: 10,
    compensationType: "per_project",
    compensationMin: 100_000,
    compensationMax: 200_000,
    locationType: "hybrid",
    city: "Bandung",
    publishedAt: "2026-10-07T01:00:00.000Z",
    skills: ["Penulisan", "Wawancara", "Fotografi"],
  },
  {
    id: "01K7JBSEED0000000000000028",
    employerId: "01K7EMPSEED00000000000015",
    title: "Editor Video Pendek",
    description:
      "Memotong dan merapikan video vertikal untuk media sosial: subtitle, transisi sederhana, dan suara yang jernih. Dua video per minggu.\nBekerja jarak jauh dengan arahan editor kami.",
    jobType: "part_time",
    weeklyHours: 10,
    compensationType: "per_project",
    compensationMin: 150_000,
    compensationMax: 350_000,
    locationType: "remote",
    city: "Bandung",
    publishedAt: "2026-10-03T01:00:00.000Z",
    skills: ["Editing video", "Kreativitas", "Manajemen waktu"],
  },
  {
    id: "01K7JBSEED0000000000000029",
    employerId: "01K7EMPSEED00000000000016",
    title: "Teknisi Servis Pelajar",
    description:
      "Membantu membersihkan dan mengganti suku cadang ringan ponsel serta laptop, didampingi teknisi senior. Alat lengkap tersedia.\nCocok untuk yang suka membongkar perangkat dan ingin belajar servis profesional.",
    jobType: "part_time",
    weeklyHours: 14,
    compensationType: "hourly",
    compensationMin: 20_000,
    compensationMax: 30_000,
    locationType: "onsite",
    city: "Tangerang",
    publishedAt: "2026-10-10T01:00:00.000Z",
    skills: ["Perbaikan perangkat", "Ketelitian", "Kerja tim"],
  },
  {
    id: "01K7JBSEED0000000000000030",
    employerId: "01K7EMPSEED00000000000016",
    title: "Asisten Toko Elektronik",
    description:
      "Membantu pelanggan memilih aksesori yang cocok, mencatat stok masuk, dan menata display. Shift enam jam dengan jadwal tetap.\nKomisi tambahan untuk penjualan aksesori.",
    jobType: "part_time",
    weeklyHours: 18,
    compensationType: "hourly",
    compensationMin: 17_000,
    compensationMax: 22_000,
    locationType: "onsite",
    city: "Tangerang",
    publishedAt: "2026-10-06T01:00:00.000Z",
    skills: ["Pelayanan pelanggan", "Penjualan", "Penataan produk"],
  },
];

const INSERT_EMPLOYER = `INSERT INTO employers (
  id, user_id, name, sector, city, status, created_at, updated_at
) VALUES (?, NULL, ?, ?, ?, 'active', ?, ?)
ON CONFLICT DO NOTHING`;

const INSERT_JOB = `INSERT INTO job_postings (
  id, employer_id, title, description, job_type, weekly_hours,
  compensation_type, compensation_min, compensation_max,
  location_type, city, status, published_at, closes_at, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, NULL, ?, ?)
ON CONFLICT DO NOTHING`;

const INSERT_SKILL = `INSERT INTO job_posting_skills (job_posting_id, skill)
VALUES (?, ?)
ON CONFLICT DO NOTHING`;

export async function applyWorkSeeds(database: Db): Promise<void> {
  const createdAt = new Date().toISOString();
  for (const seed of EMPLOYER_SEEDS) {
    await database
      .prepare(INSERT_EMPLOYER)
      .run(seed.id, seed.name, seed.sector, seed.city, createdAt, createdAt);
  }
  for (const seed of JOB_SEEDS) {
    await database
      .prepare(INSERT_JOB)
      .run(
        seed.id,
        seed.employerId,
        seed.title,
        seed.description,
        seed.jobType,
        seed.weeklyHours,
        seed.compensationType,
        seed.compensationMin,
        seed.compensationMax,
        seed.locationType,
        seed.city,
        seed.publishedAt,
        createdAt,
        createdAt,
      );
    for (const skill of seed.skills) {
      await database.prepare(INSERT_SKILL).run(seed.id, skill);
    }
  }
}
