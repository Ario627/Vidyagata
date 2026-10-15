export const POSTGRES_SCHEMA = `
CREATE OR REPLACE FUNCTION vg_touch() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION vg_block_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '%', TG_TABLE_NAME || '_immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS "user" (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL,
  "phoneNumber" text,
  "phoneNumberVerified" boolean,
  username text,
  "displayUsername" text,
  birthdate date,
  "twoFactorEnabled" boolean NOT NULL DEFAULT false,
  "totpLastCodeHash" text
);

CREATE TABLE IF NOT EXISTS session (
  id text PRIMARY KEY,
  "expiresAt" timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user"(id)
);

CREATE TABLE IF NOT EXISTS account (
  id text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"(id),
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS otp_challenge (
  "phoneNumber" text PRIMARY KEY,
  "codeHash" text NOT NULL,
  "issuedAt" bigint NOT NULL,
  "expiresAt" bigint NOT NULL,
  attempts integer NOT NULL,
  "lockCount" integer NOT NULL,
  "lockedUntil" bigint
);

CREATE TABLE IF NOT EXISTS "rateLimit" (
  id text PRIMARY KEY,
  key text NOT NULL UNIQUE,
  count integer NOT NULL,
  "lastRequest" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS age_ban (
  fingerprint text PRIMARY KEY,
  eligible_at date NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  attempts integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "twoFactor" (
  id text PRIMARY KEY,
  secret text NOT NULL,
  "backupCodes" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"(id),
  verified boolean NOT NULL DEFAULT false,
  "failedVerificationCount" integer NOT NULL DEFAULT 0,
  "lockedUntil" timestamptz,
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS two_factor_user_id_index ON "twoFactor" ("userId");
CREATE INDEX IF NOT EXISTS two_factor_secret_index ON "twoFactor" (secret);
CREATE INDEX IF NOT EXISTS session_user_id_index ON session ("userId");
CREATE INDEX IF NOT EXISTS verification_identifier_index ON verification (identifier);
CREATE INDEX IF NOT EXISTS otp_challenge_expires_index ON otp_challenge ("expiresAt");
CREATE UNIQUE INDEX IF NOT EXISTS user_username_unique ON "user" (username);
CREATE INDEX IF NOT EXISTS age_ban_eligible_index ON age_ban (eligible_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY,
  actor_type text NOT NULL CHECK (actor_type IN ('user', 'operator', 'system', 'external')),
  actor_id text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  before_json jsonb,
  after_json jsonb,
  reason text,
  ip_address text,
  user_agent text,
  occurred_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action, occurred_at);

CREATE OR REPLACE TRIGGER audit_logs_immutable_update BEFORE UPDATE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION vg_block_immutable();
CREATE OR REPLACE TRIGGER audit_logs_immutable_delete BEFORE DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION vg_block_immutable();

CREATE TABLE IF NOT EXISTS consents (
  id text PRIMARY KEY,
  key text NOT NULL,
  version integer NOT NULL CHECK (version >= 1),
  title text NOT NULL,
  body text NOT NULL,
  legal_basis text NOT NULL,
  effective_from timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT uq_consents_key_version UNIQUE (key, version)
);

CREATE OR REPLACE TRIGGER consents_immutable_update BEFORE UPDATE ON consents
FOR EACH ROW EXECUTE FUNCTION vg_block_immutable();
CREATE OR REPLACE TRIGGER consents_immutable_delete BEFORE DELETE ON consents
FOR EACH ROW EXECUTE FUNCTION vg_block_immutable();

CREATE TABLE IF NOT EXISTS consent_records (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  granted_by_user_id text REFERENCES "user"(id),
  consent_id text NOT NULL REFERENCES consents(id),
  consent_version integer NOT NULL CHECK (consent_version >= 1),
  granted_at timestamptz NOT NULL,
  granted_via text NOT NULL,
  ip_address text,
  user_agent text,
  withdrawn_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_consent_records_active
  ON consent_records (user_id, consent_id, consent_version)
  WHERE withdrawn_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_consent_records_user
  ON consent_records (user_id, granted_at);

CREATE OR REPLACE FUNCTION vg_consent_records_guard() RETURNS trigger AS $$
BEGIN
  IF NOT (
    OLD.withdrawn_at IS NULL
    AND NEW.withdrawn_at IS NOT NULL
    AND NEW.id IS NOT DISTINCT FROM OLD.id
    AND NEW.user_id IS NOT DISTINCT FROM OLD.user_id
    AND NEW.granted_by_user_id IS NOT DISTINCT FROM OLD.granted_by_user_id
    AND NEW.consent_id IS NOT DISTINCT FROM OLD.consent_id
    AND NEW.consent_version IS NOT DISTINCT FROM OLD.consent_version
    AND NEW.granted_at IS NOT DISTINCT FROM OLD.granted_at
    AND NEW.granted_via IS NOT DISTINCT FROM OLD.granted_via
    AND NEW.ip_address IS NOT DISTINCT FROM OLD.ip_address
    AND NEW.user_agent IS NOT DISTINCT FROM OLD.user_agent
  ) THEN
    RAISE EXCEPTION 'consent_records_immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER consent_records_guard_update BEFORE UPDATE ON consent_records
FOR EACH ROW EXECUTE FUNCTION vg_consent_records_guard();
CREATE OR REPLACE TRIGGER consent_records_immutable_delete BEFORE DELETE ON consent_records
FOR EACH ROW EXECUTE FUNCTION vg_block_immutable();

CREATE TABLE IF NOT EXISTS user_roles (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  role text NOT NULL CHECK (role IN ('student', 'employer', 'operator', 'institution_verifier')),
  granted_by_user_id text REFERENCES "user"(id),
  granted_at timestamptz NOT NULL,
  revoked_at timestamptz,
  reason text,
  CONSTRAINT ck_user_roles_no_self_grant
    CHECK (granted_by_user_id IS NULL OR granted_by_user_id <> user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_roles_active
  ON user_roles (user_id, role)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles (user_id, granted_at);

CREATE OR REPLACE FUNCTION vg_user_roles_guard() RETURNS trigger AS $$
BEGIN
  IF NOT (
    OLD.revoked_at IS NULL
    AND NEW.revoked_at IS NOT NULL
    AND NEW.id IS NOT DISTINCT FROM OLD.id
    AND NEW.user_id IS NOT DISTINCT FROM OLD.user_id
    AND NEW.role IS NOT DISTINCT FROM OLD.role
    AND NEW.granted_by_user_id IS NOT DISTINCT FROM OLD.granted_by_user_id
    AND NEW.granted_at IS NOT DISTINCT FROM OLD.granted_at
    AND NEW.reason IS NOT DISTINCT FROM OLD.reason
  ) THEN
    RAISE EXCEPTION 'user_roles_history_immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_roles_guard_update BEFORE UPDATE ON user_roles
FOR EACH ROW EXECUTE FUNCTION vg_user_roles_guard();
CREATE OR REPLACE TRIGGER user_roles_immutable_delete BEFORE DELETE ON user_roles
FOR EACH ROW EXECUTE FUNCTION vg_block_immutable();

CREATE TABLE IF NOT EXISTS institutions (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  type text NOT NULL CHECK (type IN ('university', 'polytechnic', 'high_school', 'vocational_school')),
  city text NOT NULL,
  province text NOT NULL,
  verification_method text NOT NULL CHECK (verification_method IN ('api', 'manual_document', 'email_confirmation')),
  partnership_status text NOT NULL CHECK (partnership_status IN ('prospect', 'mou_signed', 'active', 'inactive')),
  bank_account_encrypted text,
  bank_account_changed_by text REFERENCES "user"(id),
  bank_account_approved_by text REFERENCES "user"(id),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT ck_institutions_bank_change_two_eyes
    CHECK (bank_account_changed_by IS NULL OR bank_account_changed_by <> bank_account_approved_by)
);

CREATE OR REPLACE TRIGGER institutions_touch BEFORE UPDATE ON institutions
FOR EACH ROW EXECUTE FUNCTION vg_touch();

CREATE TABLE IF NOT EXISTS lenders (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  license_type text NOT NULL CHECK (license_type IN ('bank', 'multifinance', 'fintech_lending', 'cooperative', 'other')),
  license_number text,
  status text NOT NULL CHECK (status IN ('prospect', 'pilot', 'active', 'suspended')),
  risk_appetite_json jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT ck_lenders_license_number
    CHECK (license_type = 'other' OR license_number IS NOT NULL)
);

CREATE OR REPLACE TRIGGER lenders_touch BEFORE UPDATE ON lenders
FOR EACH ROW EXECUTE FUNCTION vg_touch();

CREATE TABLE IF NOT EXISTS students (
  id text PRIMARY KEY,
  user_id text NOT NULL UNIQUE REFERENCES "user"(id),
  full_name text NOT NULL,
  nickname text,
  date_of_birth date NOT NULL,
  academic_status text NOT NULL CHECK (academic_status IN ('high_school', 'undergraduate', 'graduated', 'dropout')),
  current_semester integer CHECK (current_semester IS NULL OR current_semester BETWEEN 1 AND 24),
  gpa_hundredths integer CHECK (gpa_hundredths IS NULL OR gpa_hundredths BETWEEN 0 AND 400),
  institution_id text REFERENCES institutions(id),
  identity_verified_at timestamptz,
  academic_verified_at timestamptz,
  province text NOT NULL,
  city text NOT NULL,
  address_line text,
  hobby text,
  bio text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_students_institution ON students (institution_id);

CREATE OR REPLACE TRIGGER students_touch BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION vg_touch();

CREATE TABLE IF NOT EXISTS financing_facilities (
  id text PRIMARY KEY,
  public_ref text NOT NULL UNIQUE,
  student_id text NOT NULL REFERENCES students(id),
  lender_id text REFERENCES lenders(id),
  institution_id text REFERENCES institutions(id),
  status text NOT NULL CHECK (status IN (
    'draft', 'submitted', 'under_review', 'forwarded_to_lender',
    'approved', 'signed', 'disbursed', 'active', 'paid_off',
    'defaulted', 'rejected', 'cancelled'
  )),
  scheme_type text NOT NULL DEFAULT 'vidyafund' CHECK (scheme_type IN ('vidyafund', 'vidyaringan')),
  academic_purpose text CHECK (academic_purpose IS NULL OR academic_purpose IN ('tuition', 'living_cost', 'other')),
  requested_amount bigint CHECK (requested_amount IS NULL OR requested_amount > 0),
  approved_amount bigint CHECK (approved_amount IS NULL OR approved_amount >= 0),
  currency text NOT NULL DEFAULT 'IDR' CHECK (currency = 'IDR'),
  tenor_months integer CHECK (tenor_months IS NULL OR tenor_months BETWEEN 1 AND 360),
  annual_margin_rate_bp integer CHECK (annual_margin_rate_bp IS NULL OR annual_margin_rate_bp BETWEEN 0 AND 99999),
  service_fee_rate_bp integer CHECK (service_fee_rate_bp IS NULL OR service_fee_rate_bp BETWEEN 0 AND 99999),
  payroll_deduction_rate integer CHECK (payroll_deduction_rate IS NULL OR payroll_deduction_rate IN (20, 40, 60)),
  submitted_at timestamptz,
  approved_at timestamptz,
  signed_at timestamptz,
  disbursed_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT ck_ff_public_ref
    CHECK (public_ref ~ '^VG-FIN-[0-9]{4}-[0-9]{6}$'),
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
  WHERE status IN ('submitted', 'under_review', 'forwarded_to_lender', 'approved', 'signed', 'disbursed', 'active');
CREATE INDEX IF NOT EXISTS idx_financing_facilities_status_created_at
  ON financing_facilities (status, created_at);
CREATE INDEX IF NOT EXISTS idx_financing_facilities_student_created_at
  ON financing_facilities (student_id, created_at);

CREATE OR REPLACE TRIGGER financing_facilities_touch BEFORE UPDATE ON financing_facilities
FOR EACH ROW EXECUTE FUNCTION vg_touch();

CREATE TABLE IF NOT EXISTS officer_portfolios (
  id text PRIMARY KEY,
  officer_id text NOT NULL REFERENCES "user"(id),
  facility_id text NOT NULL UNIQUE REFERENCES financing_facilities(id),
  assigned_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_officer_portfolios_officer
  ON officer_portfolios (officer_id, assigned_at);

CREATE TABLE IF NOT EXISTS eligibility_assessments (
  id text PRIMARY KEY,
  facility_id text NOT NULL REFERENCES financing_facilities(id),
  assessed_by text NOT NULL CHECK (assessed_by IN ('vidya_ai', 'operator', 'lender')),
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  plafon_recommended bigint NOT NULL CHECK (plafon_recommended >= 0),
  factors_json jsonb NOT NULL,
  engine_version text NOT NULL,
  assessed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_eligibility_assessments_facility
  ON eligibility_assessments (facility_id, assessed_at);

CREATE OR REPLACE TRIGGER eligibility_assessments_immutable_update BEFORE UPDATE ON eligibility_assessments
FOR EACH ROW EXECUTE FUNCTION vg_block_immutable();
CREATE OR REPLACE TRIGGER eligibility_assessments_immutable_delete BEFORE DELETE ON eligibility_assessments
FOR EACH ROW EXECUTE FUNCTION vg_block_immutable();

CREATE TABLE IF NOT EXISTS repayment_schedules (
  id text PRIMARY KEY,
  facility_id text NOT NULL UNIQUE REFERENCES financing_facilities(id),
  schedule_version integer NOT NULL DEFAULT 1 CHECK (schedule_version >= 1),
  tenor_months integer NOT NULL CHECK (tenor_months BETWEEN 1 AND 360),
  first_due_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'active', 'completed')),
  activated_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT ck_rs_activated CHECK (status = 'draft' OR activated_at IS NOT NULL)
);

CREATE OR REPLACE TRIGGER repayment_schedules_touch BEFORE UPDATE ON repayment_schedules
FOR EACH ROW EXECUTE FUNCTION vg_touch();

CREATE TABLE IF NOT EXISTS installments (
  id text PRIMARY KEY,
  schedule_id text NOT NULL REFERENCES repayment_schedules(id),
  facility_id text NOT NULL REFERENCES financing_facilities(id),
  period_no integer NOT NULL CHECK (period_no >= 1),
  due_date date NOT NULL,
  principal_amount bigint NOT NULL CHECK (principal_amount >= 0),
  margin_amount bigint NOT NULL CHECK (margin_amount >= 0),
  fee_amount bigint NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  total_amount bigint NOT NULL CHECK (total_amount >= 0),
  currency text NOT NULL DEFAULT 'IDR' CHECK (currency = 'IDR'),
  status text NOT NULL CHECK (status IN ('due', 'partially_paid', 'paid', 'overdue', 'waived')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT uq_installments_schedule_period UNIQUE (schedule_id, period_no),
  CONSTRAINT ck_installments_total CHECK (total_amount = principal_amount + margin_amount + fee_amount)
);

CREATE INDEX IF NOT EXISTS idx_installments_due_date_status ON installments (due_date, status);
CREATE INDEX IF NOT EXISTS idx_installments_facility ON installments (facility_id, period_no);

CREATE OR REPLACE TRIGGER installments_touch BEFORE UPDATE ON installments
FOR EACH ROW EXECUTE FUNCTION vg_touch();

CREATE TABLE IF NOT EXISTS reference_sequences (
  scope text NOT NULL CHECK (scope ~ '^[a-z][a-z0-9_]{2,31}$'),
  period text NOT NULL CHECK (period ~ '^[0-9]{4}$'),
  current_value integer NOT NULL CHECK (current_value >= 1),
  updated_at timestamptz NOT NULL,
  PRIMARY KEY (scope, period)
);

CREATE TABLE IF NOT EXISTS regulatory_parameters (
  id text PRIMARY KEY,
  key text NOT NULL CHECK (key IN (
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
  value_json jsonb NOT NULL,
  effective_from date NOT NULL,
  effective_to date,
  source text NOT NULL,
  set_by_user_id text REFERENCES "user"(id),
  note text,
  created_at timestamptz NOT NULL,
  CONSTRAINT uq_regulatory_parameters_key_from UNIQUE (key, effective_from),
  CONSTRAINT ck_regulatory_parameters_period
    CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE INDEX IF NOT EXISTS idx_regulatory_parameters_key
  ON regulatory_parameters (key, effective_from);

CREATE OR REPLACE FUNCTION vg_regulatory_parameters_guard() RETURNS trigger AS $$
BEGIN
  IF NOT (
    OLD.effective_to IS NULL
    AND NEW.effective_to IS NOT NULL
    AND NEW.id IS NOT DISTINCT FROM OLD.id
    AND NEW.key IS NOT DISTINCT FROM OLD.key
    AND NEW.value_json IS NOT DISTINCT FROM OLD.value_json
    AND NEW.effective_from IS NOT DISTINCT FROM OLD.effective_from
    AND NEW.source IS NOT DISTINCT FROM OLD.source
    AND NEW.set_by_user_id IS NOT DISTINCT FROM OLD.set_by_user_id
    AND NEW.note IS NOT DISTINCT FROM OLD.note
    AND NEW.created_at IS NOT DISTINCT FROM OLD.created_at
  ) THEN
    RAISE EXCEPTION 'regulatory_parameters_immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER regulatory_parameters_guard_update BEFORE UPDATE ON regulatory_parameters
FOR EACH ROW EXECUTE FUNCTION vg_regulatory_parameters_guard();
CREATE OR REPLACE TRIGGER regulatory_parameters_immutable_delete BEFORE DELETE ON regulatory_parameters
FOR EACH ROW EXECUTE FUNCTION vg_block_immutable();

CREATE TABLE IF NOT EXISTS employers (
  id text PRIMARY KEY,
  user_id text REFERENCES "user"(id),
  name text NOT NULL UNIQUE,
  sector text NOT NULL,
  city text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'suspended')),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_employers_user
  ON employers (user_id)
  WHERE user_id IS NOT NULL;

CREATE OR REPLACE TRIGGER employers_touch BEFORE UPDATE ON employers
FOR EACH ROW EXECUTE FUNCTION vg_touch();

CREATE TABLE IF NOT EXISTS job_postings (
  id text PRIMARY KEY,
  employer_id text NOT NULL REFERENCES employers(id),
  title text NOT NULL,
  description text NOT NULL,
  job_type text NOT NULL CHECK (job_type IN ('part_time', 'project_based', 'internship')),
  weekly_hours integer NOT NULL CHECK (weekly_hours BETWEEN 1 AND 40),
  compensation_type text NOT NULL CHECK (compensation_type IN ('hourly', 'monthly', 'per_project')),
  compensation_min bigint NOT NULL CHECK (compensation_min > 0),
  compensation_max bigint NOT NULL CHECK (compensation_max >= compensation_min),
  location_type text NOT NULL CHECK (location_type IN ('onsite', 'remote', 'hybrid')),
  city text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'filled', 'closed')),
  published_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT ck_job_postings_active_published
    CHECK (status <> 'active' OR published_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_job_postings_status_published_at
  ON job_postings (status, published_at DESC);

CREATE OR REPLACE TRIGGER job_postings_touch BEFORE UPDATE ON job_postings
FOR EACH ROW EXECUTE FUNCTION vg_touch();

CREATE TABLE IF NOT EXISTS job_posting_skills (
  job_posting_id text NOT NULL REFERENCES job_postings(id),
  skill text NOT NULL CHECK (length(skill) BETWEEN 2 AND 60),
  PRIMARY KEY (job_posting_id, skill)
);

CREATE INDEX IF NOT EXISTS idx_job_posting_skills_skill ON job_posting_skills (skill);

CREATE TABLE IF NOT EXISTS job_applications (
  id text PRIMARY KEY,
  student_id text NOT NULL REFERENCES students(id),
  job_posting_id text NOT NULL REFERENCES job_postings(id),
  status text NOT NULL CHECK (status IN (
    'draft', 'submitted', 'shortlisted', 'rejected', 'accepted', 'withdrawn'
  )),
  note text,
  submitted_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT ck_job_applications_submitted
    CHECK (status IN ('draft', 'withdrawn') OR submitted_at IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_job_applications_active
  ON job_applications (student_id, job_posting_id)
  WHERE status IN ('draft', 'submitted', 'shortlisted', 'accepted');
CREATE INDEX IF NOT EXISTS idx_job_applications_student_created_at
  ON job_applications (student_id, created_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_posting_status
  ON job_applications (job_posting_id, status);

CREATE OR REPLACE TRIGGER job_applications_touch BEFORE UPDATE ON job_applications
FOR EACH ROW EXECUTE FUNCTION vg_touch();

CREATE TABLE IF NOT EXISTS disbursement_requests (
  id text PRIMARY KEY,
  facility_id text NOT NULL REFERENCES financing_facilities(id),
  amount bigint NOT NULL CHECK (amount > 0),
  destination_institution_id text NOT NULL REFERENCES institutions(id),
  destination_name text NOT NULL CHECK (length(destination_name) >= 1),
  status text NOT NULL CHECK (status IN (
    'requested', 'approved', 'rejected', 'withdrawn', 'executed'
  )),
  initiated_by text NOT NULL REFERENCES "user"(id),
  initiated_at timestamptz NOT NULL,
  decided_by text REFERENCES "user"(id),
  decided_at timestamptz,
  decision_reason text,
  executed_by text REFERENCES "user"(id),
  executed_at timestamptz,
  transfer_reference text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT ck_disbursement_requests_four_eyes
    CHECK (status = 'withdrawn' OR decided_by IS NULL OR decided_by <> initiated_by),
  CONSTRAINT ck_disbursement_requests_decided
    CHECK (status = 'requested' OR (decided_by IS NOT NULL AND decided_at IS NOT NULL)),
  CONSTRAINT ck_disbursement_requests_withdraw_owner
    CHECK (status <> 'withdrawn' OR decided_by = initiated_by),
  CONSTRAINT ck_disbursement_requests_reject_reason
    CHECK (status <> 'rejected' OR (decision_reason IS NOT NULL AND length(trim(decision_reason)) >= 3)),
  CONSTRAINT ck_disbursement_requests_execution
    CHECK (
      (status = 'executed'
        AND executed_by IS NOT NULL
        AND executed_at IS NOT NULL
        AND transfer_reference IS NOT NULL
        AND length(trim(transfer_reference)) >= 4)
      OR (status <> 'executed'
        AND executed_by IS NULL
        AND executed_at IS NULL
        AND transfer_reference IS NULL)
    ),
  CONSTRAINT ck_disbursement_requests_executor_owner
    CHECK (status <> 'executed' OR executed_by = initiated_by)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_disbursement_requests_open
  ON disbursement_requests (facility_id)
  WHERE status IN ('requested', 'approved');
CREATE INDEX IF NOT EXISTS idx_disbursement_requests_status_initiated_at
  ON disbursement_requests (status, initiated_at);
CREATE INDEX IF NOT EXISTS idx_disbursement_requests_facility_created_at
  ON disbursement_requests (facility_id, created_at);

CREATE OR REPLACE TRIGGER disbursement_requests_touch BEFORE UPDATE ON disbursement_requests
FOR EACH ROW EXECUTE FUNCTION vg_touch();

CREATE TABLE IF NOT EXISTS ledger_entries (
  id text PRIMARY KEY,
  idempotency_key text NOT NULL UNIQUE,
  facility_id text REFERENCES financing_facilities(id),
  entry_type text NOT NULL CHECK (entry_type IN (
    'disbursement', 'repayment', 'payroll_deduction', 'adjustment', 'refund'
  )),
  direction text NOT NULL CHECK (direction IN ('debit', 'credit')),
  amount bigint NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'IDR' CHECK (currency = 'IDR'),
  occurred_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL,
  recorded_by text NOT NULL,
  memo text,
  created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_facility_occurred_at
  ON ledger_entries (facility_id, occurred_at);

CREATE OR REPLACE TRIGGER ledger_entries_immutable_update BEFORE UPDATE ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION vg_block_immutable();
CREATE OR REPLACE TRIGGER ledger_entries_immutable_delete BEFORE DELETE ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION vg_block_immutable();

CREATE TABLE IF NOT EXISTS student_documents (
  id text PRIMARY KEY,
  student_id text NOT NULL REFERENCES students(id),
  kind text NOT NULL CHECK (kind IN ('ktm', 'selfie', 'statement_signed')),
  mime text NOT NULL CHECK (mime IN ('image/jpeg', 'image/png', 'application/pdf')),
  byte_size integer NOT NULL CHECK (byte_size > 0 AND byte_size <= 4194304),
  sha256 text NOT NULL CHECK (length(sha256) = 64),
  data bytea NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT uq_student_documents_kind UNIQUE (student_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_student_documents_student
  ON student_documents (student_id, kind);

CREATE TABLE IF NOT EXISTS student_statement_signatures (
  id text PRIMARY KEY,
  student_id text NOT NULL REFERENCES students(id),
  statement_version text NOT NULL CHECK (length(statement_version) >= 1),
  statement_hash text NOT NULL CHECK (length(statement_hash) = 64),
  signed_name text NOT NULL CHECK (length(trim(signed_name)) >= 3),
  ip_address text,
  user_agent text,
  signed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT uq_student_statement_version UNIQUE (student_id, statement_version)
);

CREATE INDEX IF NOT EXISTS idx_student_statement_student
  ON student_statement_signatures (student_id, signed_at);

CREATE OR REPLACE TRIGGER student_statement_signatures_immutable_update
BEFORE UPDATE ON student_statement_signatures
FOR EACH ROW EXECUTE FUNCTION vg_block_immutable();
CREATE OR REPLACE TRIGGER student_statement_signatures_immutable_delete
BEFORE DELETE ON student_statement_signatures
FOR EACH ROW EXECUTE FUNCTION vg_block_immutable();

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "totpLastCodeHash" text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS address_line text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS hobby text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS bio text;
`;
