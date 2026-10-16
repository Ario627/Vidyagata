export const STATEMENT_VERSION = "statement-v2";

export const STATEMENT_TITLE = "SURAT PERNYATAAN";

export const STATEMENT_LETTERHEAD = "Vidyagata";

export const STATEMENT_LETTERHEAD_TAGLINE =
  "Platform pembiayaan pendidikan mahasiswa";

export type StatementInput = {
  readonly fullName: string;
  readonly institutionName: string | null;
  readonly academicStatus: string;
  readonly currentSemester: number | null;
  readonly city: string;
  readonly province: string | null;
  readonly deductionRate: number | null;
};

export type StatementIdentityRow = {
  readonly label: string;
  readonly value: string;
};

const STATUS_LABELS: Readonly<Record<string, string>> = {
  high_school: "Siswa SMA/SMK",
  undergraduate: "Mahasiswa aktif",
  graduated: "Lulusan",
  dropout: "Berhenti studi",
};

const EM_DASH = "—";

export function statementDocumentNumber(
  studentId: string,
  year: number,
): string {
  const suffix = studentId.slice(-6).toUpperCase();
  return `SP-VG-${year}-${suffix}`;
}

export function buildStatementIdentity(
  input: StatementInput,
): readonly StatementIdentityRow[] {
  return [
    { label: "Nama", value: input.fullName },
    {
      label: "Kampus/Sekolah",
      value: input.institutionName ?? EM_DASH,
    },
    {
      label: "Status",
      value: STATUS_LABELS[input.academicStatus] ?? input.academicStatus,
    },
    {
      label: "Semester",
      value:
        input.currentSemester === null
          ? EM_DASH
          : String(input.currentSemester),
    },
    {
      label: "Domisili",
      value:
        input.province === null || input.province.length === 0
          ? input.city
          : `${input.city}, ${input.province}`,
    },
  ];
}

export function buildStatementClauses(
  input: StatementInput,
): readonly string[] {
  const clauses = [
    "Seluruh data dan dokumen yang saya sampaikan kepada Vidyagata adalah benar, lengkap, dan dapat saya pertanggungjawabkan.",
    "Dana pembiayaan pendidikan yang saya terima digunakan hanya untuk keperluan pendidikan saya, dan tidak dialihkan untuk keperluan lain tanpa persetujuan tertulis dari mitra pembiayaan.",
    "Saya bersedia mengikuti program penempatan kerja yang disediakan platform dan memahami bahwa penghasilan dari pekerjaan tersebut dikenakan potongan angsuran secara berkala sesuai ketentuan perjanjian.",
    "Saya bersedia membayar angsuran pokok beserta margin dan biaya layanan sesuai jadwal yang disepakati, serta memahami konsekuensi keterlambatan pembayaran yang berlaku.",
    "Apabila di kemudian hari terbukti bahwa pernyataan ini tidak benar, saya bersedia menerima sanksi administratif sesuai ketentuan yang berlaku, termasuk penghentian pembiayaan dan proses hukum yang sah.",
    "Surat pernyataan ini saya tandatangani secara elektronik melalui platform Vidyagata, dan saya menyetujui bahwa tanda tangan elektronik ini memiliki kekuatan yang sama dengan tanda tangan basah untuk keperluan administrasi internal.",
  ];
  if (input.deductionRate !== null) {
    clauses.splice(
      2,
      0,
      `Persentase potongan penghasilan yang saya pilih adalah ${input.deductionRate}% dari penghasilan kerja bulanan saya.`,
    );
  }
  return clauses;
}

export function buildStatementClosing(): string {
  return "Demikian surat pernyataan ini saya buat dengan sebenarnya, tanpa paksaan dari pihak mana pun, untuk dipergunakan sebagaimana mestinya.";
}

export function buildStatementCanonical(
  input: StatementInput & {
    readonly documentNumber: string;
  },
): string {
  const identity = buildStatementIdentity(input).map(
    (row) => `${row.label}: ${row.value}`,
  );
  const clauses = buildStatementClauses(input).map(
    (clause, index) => `${index + 1}. ${clause}`,
  );
  return [
    `[${STATEMENT_VERSION}]`,
    STATEMENT_TITLE,
    input.documentNumber,
    ...identity,
    ...clauses,
    buildStatementClosing(),
  ].join("\n\n");
}
