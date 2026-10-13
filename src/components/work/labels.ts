import type { CompensationType, JobType, LocationType } from "@/data/jobs";
import { rupiah } from "@/domain/money/money";
import { formatIDR, formatIDRDigits } from "@/lib/format/currency";

export const JOB_TYPE_LABELS: Readonly<Record<JobType, string>> = {
  part_time: "Part-time",
  project_based: "Berbasis proyek",
  internship: "Magang",
};

export const LOCATION_TYPE_LABELS: Readonly<Record<LocationType, string>> = {
  onsite: "Di lokasi",
  remote: "Jarak jauh",
  hybrid: "Hybrid",
};

const PERIOD_LABELS: Readonly<Record<CompensationType, string>> = {
  hourly: "jam",
  monthly: "bulan",
  per_project: "proyek",
};

function jutaText(amount: number): string {
  const tenths = Math.round(amount / 100_000);
  const whole = Math.floor(tenths / 10);
  const fraction = tenths % 10;
  const wholeText = formatIDRDigits(String(whole));
  return fraction === 0 ? wholeText : `${wholeText},${fraction}`;
}

export function formatCompensation(input: {
  readonly compensationType: CompensationType;
  readonly compensationMin: number;
  readonly compensationMax: number;
}): string {
  const period = PERIOD_LABELS[input.compensationType];
  const single = input.compensationMin === input.compensationMax;
  if (input.compensationType === "hourly") {
    const min = formatIDR(rupiah(input.compensationMin));
    if (single) return `${min} / ${period}`;
    const max = formatIDRDigits(String(input.compensationMax));
    return `${min}–${max} / ${period}`;
  }
  if (single) {
    return `Rp${jutaText(input.compensationMin)} jt / ${period}`;
  }
  return `Rp${jutaText(input.compensationMin)}–${jutaText(input.compensationMax)} jt / ${period}`;
}
