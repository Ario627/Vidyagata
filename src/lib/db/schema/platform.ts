const AUDIT_LOGS = `
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'operator', 'system', 'external')),
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_json TEXT CHECK (before_json IS NULL OR json_valid(before_json)),
  after_json TEXT CHECK (after_json IS NULL OR json_valid(after_json)),
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  occurred_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs (entity_type, entity_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON audit_logs (actor_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs (action, occurred_at);
CREATE TRIGGER IF NOT EXISTS audit_logs_immutable_update
BEFORE UPDATE ON audit_logs
BEGIN
  SELECT RAISE(ABORT, 'audit_logs_immutable');
END;
CREATE TRIGGER IF NOT EXISTS audit_logs_immutable_delete
BEFORE DELETE ON audit_logs
BEGIN
  SELECT RAISE(ABORT, 'audit_logs_immutable');
END;
`;

const CONSENTS = `
CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version >= 1),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  legal_basis TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CONSTRAINT uq_consents_key_version UNIQUE (key, version)
);
CREATE TRIGGER IF NOT EXISTS consents_immutable_update
BEFORE UPDATE ON consents
BEGIN
  SELECT RAISE(ABORT, 'consents_immutable');
END;
CREATE TRIGGER IF NOT EXISTS consents_immutable_delete
BEFORE DELETE ON consents
BEGIN
  SELECT RAISE(ABORT, 'consents_immutable');
END;
`;

const CONSENT_RECORDS = `
CREATE TABLE IF NOT EXISTS consent_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  granted_by_user_id TEXT REFERENCES user(id),
  consent_id TEXT NOT NULL REFERENCES consents(id),
  consent_version INTEGER NOT NULL CHECK (consent_version >= 1),
  granted_at TEXT NOT NULL,
  granted_via TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  withdrawn_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_consent_records_active
  ON consent_records (user_id, consent_id, consent_version)
  WHERE withdrawn_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_consent_records_user
  ON consent_records (user_id, granted_at);
CREATE TRIGGER IF NOT EXISTS consent_records_guard_update
BEFORE UPDATE ON consent_records
WHEN NOT (
  OLD.withdrawn_at IS NULL
  AND NEW.withdrawn_at IS NOT NULL
  AND NEW.id IS OLD.id
  AND NEW.user_id IS OLD.user_id
  AND NEW.granted_by_user_id IS OLD.granted_by_user_id
  AND NEW.consent_id IS OLD.consent_id
  AND NEW.consent_version IS OLD.consent_version
  AND NEW.granted_at IS OLD.granted_at
  AND NEW.granted_via IS OLD.granted_via
  AND NEW.ip_address IS OLD.ip_address
  AND NEW.user_agent IS OLD.user_agent
)
BEGIN
  SELECT RAISE(ABORT, 'consent_records_immutable');
END;
CREATE TRIGGER IF NOT EXISTS consent_records_immutable_delete
BEFORE DELETE ON consent_records
BEGIN
  SELECT RAISE(ABORT, 'consent_records_immutable');
END;
`;

const API_RATE_LIMITS = `
CREATE TABLE IF NOT EXISTS api_rate_limits (
  bucket TEXT NOT NULL,
  window_start TEXT NOT NULL,
  hits INTEGER NOT NULL CHECK (hits >= 0),
  expires_at TEXT NOT NULL,
  PRIMARY KEY (bucket, window_start)
);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_expires
  ON api_rate_limits (expires_at);
`;

export const PLATFORM_SCHEMA = `${AUDIT_LOGS}\n${CONSENTS}\n${CONSENT_RECORDS}\n${API_RATE_LIMITS}`;
