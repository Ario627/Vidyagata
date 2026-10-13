const FINANCING_FACILITIES = `
CREATE TABLE IF NOT EXISTS financing_facilities (
  id TEXT PRIMARY KEY,
  public_ref TEXT NOT NULL UNIQUE,
  student_id TEXT NOT NULL REFERENCES students(id),
  lender_id TEXT REFERENCES lenders(id),
  institution_id TEXT REFERENCES institutions(id),
  status TEXT NOT NULL CHECK (status IN (
    'draft', 'submitted', 'under_review', 'forwarded_to_lender',
    'approved', 'signed', 'disbursed', 'active', 'paid_off',
    'defaulted', 'rejected', 'cancelled'
  )),
  scheme_type TEXT NOT NULL DEFAULT 'vidyafund' CHECK (scheme_type IN ('vidyafund', 'vidyaringan')),
  academic_purpose TEXT CHECK (academic_purpose IS NULL OR academic_purpose IN ('tuition', 'living_cost', 'other')),
  requested_amount INTEGER CHECK (requested_amount IS NULL OR requested_amount > 0),
  approved_amount INTEGER CHECK (approved_amount IS NULL OR approved_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'IDR' CHECK (currency = 'IDR'),
  tenor_months INTEGER CHECK (tenor_months IS NULL OR (tenor_months BETWEEN 1 AND 360)),
  annual_margin_rate_bp INTEGER CHECK (annual_margin_rate_bp IS NULL OR (annual_margin_rate_bp BETWEEN 0 AND 99999)),
  service_fee_rate_bp INTEGER CHECK (service_fee_rate_bp IS NULL OR (service_fee_rate_bp BETWEEN 0 AND 99999)),
  payroll_deduction_rate INTEGER CHECK (payroll_deduction_rate IS NULL OR payroll_deduction_rate IN (20, 40, 60)),
  submitted_at TEXT,
  approved_at TEXT,
  signed_at TEXT,
  disbursed_at TEXT,
  closed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CONSTRAINT ck_ff_public_ref
    CHECK (public_ref GLOB 'VG-FIN-[0-9][0-9][0-9][0-9]-[0-9][0-9][0-9][0-9][0-9][0-9]'),
  CONSTRAINT ck_ff_signed_order
    CHECK (signed_at IS NULL OR approved_at IS NULL OR signed_at >= approved_at),
  CONSTRAINT ck_ff_disbursed_order
    CHECK (disbursed_at IS NULL OR signed_at IS NULL OR disbursed_at >= signed_at),
  CONSTRAINT ck_ff_committed_fields CHECK (
    status NOT IN ('submitted', 'under_review', 'forwarded_to_lender', 'approved', 'signed', 'disbursed', 'active', 'paid_off')
    OR (requested_amount IS NOT NULL AND institution_id IS NOT NULL AND academic_purpose IS NOT NULL)
  ),
  CONSTRAINT ck_ff_lender_required CHECK (
    status NOT IN ('forwarded_to_lender', 'approved', 'signed', 'disbursed', 'active', 'paid_off')
    OR lender_id IS NOT NULL
  ),
  CONSTRAINT ck_ff_pricing_required CHECK (
    status NOT IN ('approved', 'signed', 'disbursed', 'active', 'paid_off')
    OR (approved_amount IS NOT NULL AND approved_at IS NOT NULL AND tenor_months IS NOT NULL
        AND annual_margin_rate_bp IS NOT NULL AND service_fee_rate_bp IS NOT NULL)
  ),
  CONSTRAINT ck_ff_deduction_rate_required CHECK (
    status NOT IN ('active', 'paid_off') OR payroll_deduction_rate IS NOT NULL
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_financing_facilities_student_active
  ON financing_facilities (student_id)
  WHERE status IN ('submitted', 'under_review', 'approved', 'signed', 'disbursed', 'active');
CREATE INDEX IF NOT EXISTS idx_financing_facilities_status_created_at
  ON financing_facilities (status, created_at);
CREATE INDEX IF NOT EXISTS idx_financing_facilities_student_created_at
  ON financing_facilities (student_id, created_at);
CREATE TRIGGER IF NOT EXISTS financing_facilities_touch
AFTER UPDATE ON financing_facilities
FOR EACH ROW
BEGIN
  UPDATE financing_facilities
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;
`;

const ELIGIBILITY_ASSESSMENTS = `
CREATE TABLE IF NOT EXISTS eligibility_assessments (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL REFERENCES financing_facilities(id),
  assessed_by TEXT NOT NULL CHECK (assessed_by IN ('vidya_ai', 'operator', 'lender')),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  plafon_recommended INTEGER NOT NULL CHECK (plafon_recommended >= 0),
  factors_json TEXT NOT NULL CHECK (json_valid(factors_json)),
  engine_version TEXT NOT NULL,
  assessed_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_eligibility_assessments_facility
  ON eligibility_assessments (facility_id, assessed_at);
CREATE TRIGGER IF NOT EXISTS eligibility_assessments_immutable_update
BEFORE UPDATE ON eligibility_assessments
BEGIN
  SELECT RAISE(ABORT, 'eligibility_assessments_immutable');
END;
CREATE TRIGGER IF NOT EXISTS eligibility_assessments_immutable_delete
BEFORE DELETE ON eligibility_assessments
BEGIN
  SELECT RAISE(ABORT, 'eligibility_assessments_immutable');
END;
`;

const REPAYMENT_SCHEDULES = `
CREATE TABLE IF NOT EXISTS repayment_schedules (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL UNIQUE REFERENCES financing_facilities(id),
  schedule_version INTEGER NOT NULL DEFAULT 1 CHECK (schedule_version >= 1),
  tenor_months INTEGER NOT NULL CHECK (tenor_months BETWEEN 1 AND 360),
  first_due_date TEXT NOT NULL CHECK (first_due_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed')),
  activated_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CONSTRAINT ck_rs_activated CHECK (status = 'draft' OR activated_at IS NOT NULL)
);
CREATE TRIGGER IF NOT EXISTS repayment_schedules_touch
AFTER UPDATE ON repayment_schedules
FOR EACH ROW
BEGIN
  UPDATE repayment_schedules
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;
`;

const INSTALLMENTS = `
CREATE TABLE IF NOT EXISTS installments (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL REFERENCES repayment_schedules(id),
  facility_id TEXT NOT NULL REFERENCES financing_facilities(id),
  period_no INTEGER NOT NULL CHECK (period_no >= 1),
  due_date TEXT NOT NULL CHECK (due_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  principal_amount INTEGER NOT NULL CHECK (principal_amount >= 0),
  margin_amount INTEGER NOT NULL CHECK (margin_amount >= 0),
  fee_amount INTEGER NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'IDR' CHECK (currency = 'IDR'),
  status TEXT NOT NULL CHECK (status IN ('due', 'partially_paid', 'paid', 'overdue', 'waived')),
  paid_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CONSTRAINT uq_installments_schedule_period UNIQUE (schedule_id, period_no),
  CONSTRAINT ck_installments_total CHECK (total_amount = principal_amount + margin_amount + fee_amount)
);
CREATE INDEX IF NOT EXISTS idx_installments_due_date_status
  ON installments (due_date, status);
CREATE INDEX IF NOT EXISTS idx_installments_facility
  ON installments (facility_id, period_no);
CREATE TRIGGER IF NOT EXISTS installments_touch
AFTER UPDATE ON installments
FOR EACH ROW
BEGIN
  UPDATE installments
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;
`;

export const FINANCING_SCHEMA = `${FINANCING_FACILITIES}\n${ELIGIBILITY_ASSESSMENTS}\n${REPAYMENT_SCHEDULES}\n${INSTALLMENTS}`;
