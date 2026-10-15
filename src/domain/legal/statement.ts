export const STATEMENT_VERSION = "statement-v1";

export const STATEMENT_TITLE = "Surat Pernyataan Mahasiswa";

export type StatementInput = {
  readonly fullName: string;
  readonly institutionName: string | null;
  readonly academicStatus: string;
  readonly currentSemester: number | null;
  readonly city: string;
  readonly deductionRate: number | null;
};

const STATUS_WORDS: Readonly<Record<string, string>> = {
  high_school: "siswa SMA/SMK",
  undergraduate: "mahasiswa",
  graduated: "lulusan",
  dropout: "berhenti studi",
};

function subjectPhrase(input: StatementInput): string {
  const role = STATUS_WORDS[input.academicStatus] ?? "mahasiswa";
  const campus =
    input.institutionName === null ? "" : ` di ${input.institutionName}`;
  const semester =
    input.currentSemester === null ? "" : ` semester ${input.currentSemester}`;
  return `${role}${campus}${semester}`;
}

export function buildStatementParagraphs(
  input: StatementInput,
): readonly string[] {
  const paragraphs = [
    `Saya, ${input.fullName}, ${subjectPhrase(input)}, dengan ini menyatakan dengan sadar bahwa seluruh data yang saya sampaikan kepada Vidyagata — termasuk identitas, data akademik, dan dokumen yang saya unggah — adalah benar dan dapat saya pertanggungjawabkan.`,
    "Saya menyatakan bahwa dana pembiayaan pendidikan yang saya terima digunakan hanya untuk keperluan pendidikan saya, dan tidak akan dialihkan untuk keperluan lain tanpa persetujuan tertulis dari mitra pembiayaan.",
    "Saya bersedia mengikuti program penempatan kerja yang disediakan platform dan memahami bahwa penghasilan dari pekerjaan tersebut dikenakan potongan angsuran secara berkala sesuai persentase yang saya pilih pada saat pengajuan.",
    "Saya bersedia membayar angsuran pokok beserta margin dan biaya layanan sesuai jadwal yang disepakati, dan memahami konsekuensi keterlambatan pembayaran sesuai ketentuan perjanjian.",
    "Apabila di kemudian hari terbukti bahwa pernyataan ini tidak benar, saya bersedia menerima sanksi administratif sesuai ketentuan yang berlaku, termasuk penghentian pembiayaan dan proses hukum yang sah.",
    "Surat pernyataan ini saya tandatangani secara elektronik melalui platform Vidyagata, dan saya menyetujui bahwa tanda tangan elektronik ini memiliki kekuatan yang sama dengan tanda tangan basah untuk keperluan administrasi internal.",
  ];
  if (input.deductionRate !== null) {
    paragraphs.splice(
      3,
      0,
      `Persentase potongan penghasilan yang saya pilih adalah ${input.deductionRate}% dari penghasilan kerja bulanan saya.`,
    );
  }
  return paragraphs;
}

export function buildStatementClosing(city: string): string {
  return `Dibuat dan ditandatangani di ${city} melalui platform Vidyagata.`;
}

export function buildStatementCanonical(input: StatementInput): string {
  return [
    `[${STATEMENT_VERSION}]`,
    STATEMENT_TITLE,
    ...buildStatementParagraphs(input),
    buildStatementClosing(input.city),
  ].join("\n\n");
}
