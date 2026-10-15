const USER_ROLES = `
CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  role TEXT NOT NULL CHECK (role IN ('student', 'employer', 'operator', 'institution_verifier')),
  granted_by_user_id TEXT REFERENCES user(id),
  granted_at TEXT NOT NULL,
  revoked_at TEXT,
  reason TEXT,
  CONSTRAINT ck_user_roles_no_self_grant
    CHECK (granted_by_user_id IS NULL OR granted_by_user_id <> user_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_roles_active
  ON user_roles (user_id, role)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_roles_user
  ON user_roles (user_id, granted_at);
CREATE TRIGGER IF NOT EXISTS user_roles_guard_update
BEFORE UPDATE ON user_roles
WHEN NOT (
  OLD.revoked_at IS NULL
  AND NEW.revoked_at IS NOT NULL
  AND NEW.id IS OLD.id
  AND NEW.user_id IS OLD.user_id
  AND NEW.role IS OLD.role
  AND NEW.granted_by_user_id IS OLD.granted_by_user_id
  AND NEW.granted_at IS OLD.granted_at
  AND NEW.reason IS OLD.reason
)
BEGIN
  SELECT RAISE(ABORT, 'user_roles_history_immutable');
END;
CREATE TRIGGER IF NOT EXISTS user_roles_immutable_delete
BEFORE DELETE ON user_roles
BEGIN
  SELECT RAISE(ABORT, 'user_roles_history_immutable');
END;
`;

const INSTITUTIONS = `
CREATE TABLE IF NOT EXISTS institutions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE CHECK (length(slug) >= 1 AND slug NOT GLOB '*[^a-z0-9-]*'),
  type TEXT NOT NULL CHECK (type IN ('university', 'polytechnic', 'high_school', 'vocational_school')),
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('api', 'manual_document', 'email_confirmation')),
  partnership_status TEXT NOT NULL CHECK (partnership_status IN ('prospect', 'mou_signed', 'active', 'inactive')),
  bank_account_encrypted TEXT,
  bank_account_changed_by TEXT REFERENCES user(id),
  bank_account_approved_by TEXT REFERENCES user(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CONSTRAINT ck_institutions_bank_change_two_eyes
    CHECK (bank_account_changed_by IS NULL OR bank_account_changed_by <> bank_account_approved_by)
);
CREATE TRIGGER IF NOT EXISTS institutions_touch
AFTER UPDATE ON institutions
FOR EACH ROW
BEGIN
  UPDATE institutions
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;
`;

const LENDERS = `
CREATE TABLE IF NOT EXISTS lenders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  license_type TEXT NOT NULL CHECK (license_type IN ('bank', 'multifinance', 'fintech_lending', 'cooperative', 'other')),
  license_number TEXT,
  status TEXT NOT NULL CHECK (status IN ('prospect', 'pilot', 'active', 'suspended')),
  risk_appetite_json TEXT NOT NULL CHECK (json_valid(risk_appetite_json)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CONSTRAINT ck_lenders_license_number
    CHECK (license_type = 'other' OR license_number IS NOT NULL)
);
CREATE TRIGGER IF NOT EXISTS lenders_touch
AFTER UPDATE ON lenders
FOR EACH ROW
BEGIN
  UPDATE lenders
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;
`;

const STUDENTS = `
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES user(id),
  full_name TEXT NOT NULL,
  nickname TEXT,
  date_of_birth TEXT NOT NULL CHECK (date_of_birth GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  academic_status TEXT NOT NULL CHECK (academic_status IN ('high_school', 'undergraduate', 'graduated', 'dropout')),
  current_semester INTEGER CHECK (current_semester IS NULL OR (current_semester BETWEEN 1 AND 24)),
  gpa_hundredths INTEGER CHECK (gpa_hundredths IS NULL OR (gpa_hundredths BETWEEN 0 AND 400)),
  institution_id TEXT REFERENCES institutions(id),
  identity_verified_at TEXT,
  academic_verified_at TEXT,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  address_line TEXT,
  hobby TEXT,
  bio TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_students_institution
  ON students (institution_id);
CREATE TRIGGER IF NOT EXISTS students_touch
AFTER UPDATE ON students
FOR EACH ROW
BEGIN
  UPDATE students
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;
`;

const OFFICER_PORTFOLIOS = `
CREATE TABLE IF NOT EXISTS officer_portfolios (
  id TEXT PRIMARY KEY,
  officer_id TEXT NOT NULL REFERENCES user(id),
  facility_id TEXT NOT NULL UNIQUE REFERENCES financing_facilities(id),
  assigned_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_officer_portfolios_officer
  ON officer_portfolios (officer_id, assigned_at);
`;

export const IDENTITY_SCHEMA = `${INSTITUTIONS}\n${LENDERS}\n${STUDENTS}\n${USER_ROLES}\n${OFFICER_PORTFOLIOS}`;
