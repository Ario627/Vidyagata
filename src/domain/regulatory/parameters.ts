import {
  isPayrollDeductionRate,
  type PayrollDeductionRate,
} from "../financing/deduction";
import { MAX_RATE_BP, MAX_TENOR_MONTHS } from "../financing/schedule";
import { err, ok, type Result } from "../shared/result";

export type RegulatoryParameterShape = {
  readonly max_annual_margin_rate_bp: number;
  readonly max_service_fee_rate_bp: number;
  readonly allowed_payroll_deduction_rates: readonly PayrollDeductionRate[];
  readonly max_tenor_months: number;
  readonly min_age_years: number;
  readonly max_age_years: number;
  readonly default_threshold_days: number;
  readonly grace_period_days: number;
  readonly max_late_fee_rate_bp: number;
  readonly repayment_reminder_days: readonly number[];
  readonly data_retention_years: number;
};

export type RegulatoryParameterKey = keyof RegulatoryParameterShape;

export type RegulatoryParameterSet = {
  readonly [K in RegulatoryParameterKey]: RegulatoryParameterShape[K];
};

export type RegulatoryParameterRecord = {
  readonly key: RegulatoryParameterKey;
  readonly value: unknown;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly source: string;
};

export type RegulatoryParameterError =
  | { readonly kind: "invalid_instant"; readonly at: string }
  | { readonly kind: "missing"; readonly key: RegulatoryParameterKey }
  | { readonly kind: "invalid"; readonly key: RegulatoryParameterKey }
  | {
      readonly kind: "inconsistent";
      readonly keys: readonly RegulatoryParameterKey[];
    };

type Validator = (value: unknown) => boolean;

const intBetween =
  (min: number, max: number): Validator =>
  (value) =>
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max;

const rateBp: Validator = intBetween(0, MAX_RATE_BP);

const rateList: Validator = (value) =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(isPayrollDeductionRate);

const reminderDay: Validator = intBetween(0, 365);

const dayList: Validator = (value) =>
  Array.isArray(value) && value.every(reminderDay);

const VALIDATORS: Readonly<Record<RegulatoryParameterKey, Validator>> = {
  max_annual_margin_rate_bp: rateBp,
  max_service_fee_rate_bp: rateBp,
  allowed_payroll_deduction_rates: rateList,
  max_tenor_months: intBetween(1, MAX_TENOR_MONTHS),
  min_age_years: intBetween(0, 100),
  max_age_years: intBetween(0, 150),
  default_threshold_days: intBetween(0, 365),
  grace_period_days: intBetween(0, 365),
  max_late_fee_rate_bp: rateBp,
  repayment_reminder_days: dayList,
  data_retention_years: intBetween(1, 100),
};

const PARAMETER_KEYS = Object.keys(
  VALIDATORS,
) as readonly RegulatoryParameterKey[];

function instantOf(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isEffectiveAt(record: RegulatoryParameterRecord, at: number): boolean {
  const from = instantOf(record.effectiveFrom);
  if (from === null || from > at) return false;
  if (record.effectiveTo === null) return true;
  const to = instantOf(record.effectiveTo);
  return to !== null && at < to;
}

type EffectiveRecord = {
  readonly record: RegulatoryParameterRecord;
  readonly from: number;
};

function latestPerKey(
  records: readonly RegulatoryParameterRecord[],
  at: number,
): ReadonlyMap<RegulatoryParameterKey, EffectiveRecord> {
  const latest = new Map<RegulatoryParameterKey, EffectiveRecord>();
  for (const record of records) {
    if (!isEffectiveAt(record, at)) continue;
    const from = Date.parse(record.effectiveFrom);
    const current = latest.get(record.key);
    if (current === undefined || from > current.from) {
      latest.set(record.key, { record, from });
    }
  }
  return latest;
}

export function resolveRegulatoryParameters(
  records: readonly RegulatoryParameterRecord[],
  at: string,
): Result<RegulatoryParameterSet, RegulatoryParameterError> {
  const atInstant = instantOf(at);
  if (atInstant === null) return err({ kind: "invalid_instant", at });
  const latest = latestPerKey(records, atInstant);
  const resolved: Record<string, unknown> = {};
  for (const key of PARAMETER_KEYS) {
    const candidate = latest.get(key);
    if (candidate === undefined) return err({ kind: "missing", key });
    if (!VALIDATORS[key](candidate.record.value)) {
      return err({ kind: "invalid", key });
    }
    resolved[key] = candidate.record.value;
  }
  const set = resolved as RegulatoryParameterSet;
  if (set.min_age_years > set.max_age_years) {
    return err({
      kind: "inconsistent",
      keys: ["min_age_years", "max_age_years"],
    });
  }
  return ok(set);
}
