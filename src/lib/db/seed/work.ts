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
];

const JOB_SEEDS: readonly JobSeed[] = [
  {
    id: "01K7JBSEED0000000000000001",
    employerId: "01K7EMPSEED00000000000001",
    title: "Barista Part-time",
    description:
      "Melayani pelanggan, menyiapkan minuman sesuai resep standar, dan menjaga kebersihan area kerja. Jadwal disusun dalam shift pendek agar tetap sejalan dengan jam kuliah.\nKami mencari mahasiswa yang teliti dan ramah. Pelatihan dasar diberikan pada minggu pertama.",
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
      "Menulis artikel dan materi pemasaran untuk klien UMKM, dengan tenggat yang disepakati mingguan. Seluruh pekerjaan dikerjakan jarak jauh dan bisa disesuaikan dengan jadwal kelas.\nKamu akan bekerja bersama editor kami dan mendapat catatan perbaikan yang jelas di setiap draf.",
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
      "Membimbing kelas kecil tiga sampai lima siswa untuk persiapan ujian. Modul dan latihan sudah disiapkan; tugasmu memastikan siswa benar-benar memahami langkah pengerjaannya.\nJadwal kelas tersedia sore hari, cocok untuk mahasiswa dengan kuliah pagi.",
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
      "Menjadwalkan unggahan, membalas pesan pelanggan di kanal resmi, dan menyusun laporan sederhana mingguan. Semua pekerjaan bisa dikerjakan jarak jauh dengan jam kerja fleksibel.\nNada bicara merek dan panduan konten akan diberikan saat onboarding.",
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
      "Merapikan dan menganalisis data survei untuk proyek penelitian sosial: pembersihan data, tabulasi, dan draf awal laporan. Pekerjaan dilakukan jarak jauh dengan rapat koordinasi mingguan.\nCocok untuk mahasiswa yang teliti dengan spreadsheet dan ingin mengenal alur riset yang rapi.",
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
