import { min, type Rupiah } from "../money/money";

export const ELIGIBILITY_ENGINE_VERSION = "vidya-elig-1.0.0";

export const FORWARD_MIN_SCORE = 50;

export type AcademicStatus =
  | "high_school"
  | "undergraduate"
  | "graduated"
  | "dropout";

export type EligibilityDirection = "up" | "down" | "neutral";

export type EligibilityFactorCode =
  | "gpa_band"
  | "semester_progress"
  | "amount_within_plafon"
  | "tenor_within_cap";

export type EligibilityFactor = {
  readonly code: EligibilityFactorCode;
  readonly direction: EligibilityDirection;
  readonly value: string;
  readonly points: number;
};

export type EligibilityInput = {
  readonly academicStatus: AcademicStatus;
  readonly currentSemester: number | null;
  readonly gpaHundredths: number | null;
  readonly requestedAmount: Rupiah;
  readonly tenorMonths: number;
  readonly plafonCap: Rupiah | null;
  readonly maxTenorMonths: number | null;
};

export type EligibilityAssessment = {
  readonly score: number;
  readonly plafonRecommended: Rupiah;
  readonly factors: readonly EligibilityFactor[];
  readonly engineVersion: string;
};

const GPA_MAX_HUNDREDTHS = 400;
const SEMESTER_MAX = 24;
const GPA_TOP_MIN = 350;
const GPA_STRONG_MIN = 300;
const GPA_STEADY_MIN = 250;
const SEMESTER_BUILDING_MAX = 4;
const SEMESTER_ESTABLISHED_MAX = 8;

const GPA_POINTS = {
  top: 40,
  strong: 34,
  steady: 26,
  low: 16,
  unknown: 24,
} as const;

const PROGRESS_POINTS = {
  graduated: 20,
  dropout: 8,
  highSchool: 14,
  unknown: 10,
  starting: 15,
  building: 20,
  established: 25,
  extended: 20,
} as const;

const AMOUNT_POINTS = {
  noCap: 12,
  comfortable: 20,
  moderate: 17,
  atCap: 13,
  aboveCap: 6,
} as const;

const TENOR_POINTS = {
  noCap: 11,
  within: 15,
  above: 5,
} as const;

function decimalText(hundredths: number): string {
  const whole = Math.floor(hundredths / 100);
  const fraction = hundredths % 100;
  return `${whole},${String(fraction).padStart(2, "0")}`;
}

function percentText(part: number, whole: number): string {
  return `${Math.round((part * 100) / whole)}%`;
}

function gpaFactor(gpaHundredths: number | null): EligibilityFactor {
  if (gpaHundredths === null) {
    return {
      code: "gpa_band",
      direction: "neutral",
      value: "IPK belum terverifikasi — memakai nilai netral",
      points: GPA_POINTS.unknown,
    };
  }
  const label = decimalText(gpaHundredths);
  if (gpaHundredths >= GPA_TOP_MIN) {
    return {
      code: "gpa_band",
      direction: "up",
      value: `IPK ${label} — di atas 3,50`,
      points: GPA_POINTS.top,
    };
  }
  if (gpaHundredths >= GPA_STRONG_MIN) {
    return {
      code: "gpa_band",
      direction: "up",
      value: `IPK ${label} — rentang 3,00 sampai 3,49`,
      points: GPA_POINTS.strong,
    };
  }
  if (gpaHundredths >= GPA_STEADY_MIN) {
    return {
      code: "gpa_band",
      direction: "up",
      value: `IPK ${label} — rentang 2,50 sampai 2,99`,
      points: GPA_POINTS.steady,
    };
  }
  return {
    code: "gpa_band",
    direction: "down",
    value: `IPK ${label} — di bawah 2,50`,
    points: GPA_POINTS.low,
  };
}

function progressFactor(
  academicStatus: AcademicStatus,
  currentSemester: number | null,
): EligibilityFactor {
  if (academicStatus === "graduated") {
    return {
      code: "semester_progress",
      direction: "up",
      value: "Sudah lulus — siklus studi selesai",
      points: PROGRESS_POINTS.graduated,
    };
  }
  if (academicStatus === "dropout") {
    return {
      code: "semester_progress",
      direction: "down",
      value: "Berhenti studi — butuh peninjauan manual",
      points: PROGRESS_POINTS.dropout,
    };
  }
  if (academicStatus === "high_school") {
    return {
      code: "semester_progress",
      direction: "up",
      value: "Pelajar sekolah menengah",
      points: PROGRESS_POINTS.highSchool,
    };
  }
  if (currentSemester === null) {
    return {
      code: "semester_progress",
      direction: "neutral",
      value: "Semester kuliah belum diisi",
      points: PROGRESS_POINTS.unknown,
    };
  }
  if (currentSemester === 1) {
    return {
      code: "semester_progress",
      direction: "up",
      value: "Mahasiswa semester 1 — rekam jejak masih pendek",
      points: PROGRESS_POINTS.starting,
    };
  }
  if (currentSemester <= SEMESTER_BUILDING_MAX) {
    return {
      code: "semester_progress",
      direction: "up",
      value: `Mahasiswa semester ${currentSemester}`,
      points: PROGRESS_POINTS.building,
    };
  }
  if (currentSemester <= SEMESTER_ESTABLISHED_MAX) {
    return {
      code: "semester_progress",
      direction: "up",
      value: `Mahasiswa semester ${currentSemester}`,
      points: PROGRESS_POINTS.established,
    };
  }
  return {
    code: "semester_progress",
    direction: "neutral",
    value: `Mahasiswa semester ${currentSemester} — masa studi memanjang`,
    points: PROGRESS_POINTS.extended,
  };
}

function amountFactor(
  requestedAmount: Rupiah,
  plafonCap: Rupiah | null,
): EligibilityFactor {
  if (plafonCap === null) {
    return {
      code: "amount_within_plafon",
      direction: "neutral",
      value: "Plafon mitra belum ditetapkan — penilaian jumlah ditunda",
      points: AMOUNT_POINTS.noCap,
    };
  }
  const share = percentText(requestedAmount, plafonCap);
  if (requestedAmount * 2 <= plafonCap) {
    return {
      code: "amount_within_plafon",
      direction: "up",
      value: `Pengajuan ${share} dari plafon mitra`,
      points: AMOUNT_POINTS.comfortable,
    };
  }
  if (requestedAmount * 4 <= plafonCap * 3) {
    return {
      code: "amount_within_plafon",
      direction: "up",
      value: `Pengajuan ${share} dari plafon mitra`,
      points: AMOUNT_POINTS.moderate,
    };
  }
  if (requestedAmount <= plafonCap) {
    return {
      code: "amount_within_plafon",
      direction: "up",
      value: `Pengajuan ${share} dari plafon mitra — tepat pada batas`,
      points: AMOUNT_POINTS.atCap,
    };
  }
  return {
    code: "amount_within_plafon",
    direction: "down",
    value: `Pengajuan ${share} dari plafon mitra — melebihi batas mitra`,
    points: AMOUNT_POINTS.aboveCap,
  };
}

function tenorFactor(
  tenorMonths: number,
  maxTenorMonths: number | null,
): EligibilityFactor {
  if (maxTenorMonths === null) {
    return {
      code: "tenor_within_cap",
      direction: "neutral",
      value: "Batas tenor mitra belum ditetapkan — penilaian tenor ditunda",
      points: TENOR_POINTS.noCap,
    };
  }
  if (tenorMonths <= maxTenorMonths) {
    return {
      code: "tenor_within_cap",
      direction: "up",
      value: `Tenor ${tenorMonths} bulan dalam batas mitra (maks ${maxTenorMonths} bulan)`,
      points: TENOR_POINTS.within,
    };
  }
  return {
    code: "tenor_within_cap",
    direction: "down",
    value: `Tenor ${tenorMonths} bulan melebihi batas mitra (maks ${maxTenorMonths} bulan)`,
    points: TENOR_POINTS.above,
  };
}

function assertTenor(tenorMonths: number): void {
  if (!Number.isInteger(tenorMonths) || tenorMonths < 1) {
    throw new RangeError(`Tenor tidak valid: ${tenorMonths}`);
  }
}

function assertSemester(currentSemester: number | null): void {
  if (currentSemester === null) return;
  if (
    !Number.isInteger(currentSemester) ||
    currentSemester < 1 ||
    currentSemester > SEMESTER_MAX
  ) {
    throw new RangeError(`Semester tidak valid: ${currentSemester}`);
  }
}

function assertGpa(gpaHundredths: number | null): void {
  if (gpaHundredths === null) return;
  if (
    !Number.isInteger(gpaHundredths) ||
    gpaHundredths < 0 ||
    gpaHundredths > GPA_MAX_HUNDREDTHS
  ) {
    throw new RangeError(`IPK tidak valid: ${gpaHundredths}`);
  }
}

function assertTenorCap(maxTenorMonths: number | null): void {
  if (maxTenorMonths === null) return;
  if (!Number.isInteger(maxTenorMonths) || maxTenorMonths < 1) {
    throw new RangeError(`Batas tenor tidak valid: ${maxTenorMonths}`);
  }
}

function assertInput(input: EligibilityInput): void {
  assertTenor(input.tenorMonths);
  assertSemester(input.currentSemester);
  assertGpa(input.gpaHundredths);
  assertTenorCap(input.maxTenorMonths);
}

function plafonRecommendedOf(input: EligibilityInput): Rupiah {
  if (input.plafonCap === null) return input.requestedAmount;
  return min(input.requestedAmount, input.plafonCap);
}

export function assessEligibility(
  input: EligibilityInput,
): EligibilityAssessment {
  assertInput(input);
  const factors: readonly EligibilityFactor[] = [
    gpaFactor(input.gpaHundredths),
    progressFactor(input.academicStatus, input.currentSemester),
    amountFactor(input.requestedAmount, input.plafonCap),
    tenorFactor(input.tenorMonths, input.maxTenorMonths),
  ];
  const score = factors.reduce((total, factor) => total + factor.points, 0);
  return {
    score,
    plafonRecommended: plafonRecommendedOf(input),
    factors,
    engineVersion: ELIGIBILITY_ENGINE_VERSION,
  };
}
