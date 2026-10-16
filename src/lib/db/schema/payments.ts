export const INSTALLMENT_PAYMENT_STATUSES = [
  "submitted",
  "verified",
  "rejected",
] as const;

export const INSTALLMENT_PAYMENT_MIME = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export const MAX_PAYMENT_PROOF_BYTES = 4 * 1024 * 1024;

export const PAYMENTS_SCHEMA = `
CREATE TABLE IF NOT EXISTS installment_payments (
  id TEXT PRIMARY KEY,
  installment_id TEXT NOT NULL REFERENCES installments(id),
  facility_id TEXT NOT NULL REFERENCES financing_facilities(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  sender_name TEXT NOT NULL CHECK (length(trim(sender_name)) >= 3),
  note TEXT,
  proof_mime TEXT NOT NULL CHECK (proof_mime IN ('image/jpeg', 'image/png', 'application/pdf')),
  proof_size INTEGER NOT NULL CHECK (proof_size > 0 AND proof_size <= 4194304),
  proof_sha256 TEXT NOT NULL CHECK (length(proof_sha256) = 64),
  proof_data BLOB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'verified', 'rejected')),
  submitted_at TEXT NOT NULL,
  verified_by TEXT REFERENCES user(id),
  verified_at TEXT,
  rejection_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CONSTRAINT ck_installment_payments_verified
    CHECK (status = 'submitted' OR (verified_by IS NOT NULL AND verified_at IS NOT NULL)),
  CONSTRAINT ck_installment_payments_reject_reason
    CHECK (status <> 'rejected' OR (rejection_reason IS NOT NULL AND length(trim(rejection_reason)) >= 3))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_installment_payments_open
  ON installment_payments (installment_id)
  WHERE status = 'submitted';
CREATE INDEX IF NOT EXISTS idx_installment_payments_installment
  ON installment_payments (installment_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_installment_payments_status
  ON installment_payments (status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_installment_payments_facility
  ON installment_payments (facility_id, submitted_at);
CREATE TRIGGER IF NOT EXISTS installment_payments_touch
AFTER UPDATE ON installment_payments
FOR EACH ROW
BEGIN
  UPDATE installment_payments
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;
`;
