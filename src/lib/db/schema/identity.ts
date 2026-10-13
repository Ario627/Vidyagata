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

export const IDENTITY_SCHEMA = USER_ROLES;
