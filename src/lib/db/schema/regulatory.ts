const REGULATORY_PARAMETERS = `
CREATE TABLE IF NOT EXISTS regulatory_parameters (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL CHECK (key IN (
    'max_annual_margin_rate_bp',
    'max_service_fee_rate_bp',
    'allowed_payroll_deduction_rates',
    'max_tenor_months',
    'min_age_years',
    'max_age_years',
    'default_threshold_days',
    'grace_period_days',
    'max_late_fee_rate_bp',
    'repayment_reminder_days',
    'data_retention_years'
  )),
  value_json TEXT NOT NULL CHECK (json_valid(value_json)),
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  source TEXT NOT NULL,
  set_by_user_id TEXT REFERENCES user(id),
  note TEXT,
  created_at TEXT NOT NULL,
  CONSTRAINT uq_regulatory_parameters_key_from UNIQUE (key, effective_from),
  CONSTRAINT ck_regulatory_parameters_period
    CHECK (effective_to IS NULL OR effective_to > effective_from)
);
CREATE INDEX IF NOT EXISTS idx_regulatory_parameters_key
  ON regulatory_parameters (key, effective_from);
CREATE TRIGGER IF NOT EXISTS regulatory_parameters_guard_update
BEFORE UPDATE ON regulatory_parameters
WHEN NOT (
  OLD.effective_to IS NULL
  AND NEW.effective_to IS NOT NULL
  AND NEW.id IS OLD.id
  AND NEW.key IS OLD.key
  AND NEW.value_json IS OLD.value_json
  AND NEW.effective_from IS OLD.effective_from
  AND NEW.source IS OLD.source
  AND NEW.set_by_user_id IS OLD.set_by_user_id
  AND NEW.note IS OLD.note
  AND NEW.created_at IS OLD.created_at
)
BEGIN
  SELECT RAISE(ABORT, 'regulatory_parameters_immutable');
END;
CREATE TRIGGER IF NOT EXISTS regulatory_parameters_immutable_delete
BEFORE DELETE ON regulatory_parameters
BEGIN
  SELECT RAISE(ABORT, 'regulatory_parameters_immutable');
END;
`;

export const REGULATORY_SCHEMA = REGULATORY_PARAMETERS;
