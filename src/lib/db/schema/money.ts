const DISBURSEMENT_REQUESTS = `
CREATE TABLE IF NOT EXISTS disbursement_requests (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL REFERENCES financing_facilities(id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  destination_institution_id TEXT NOT NULL REFERENCES institutions(id),
  destination_name TEXT NOT NULL CHECK (length(destination_name) >= 1),
  status TEXT NOT NULL CHECK (status IN (
    'requested', 'approved', 'rejected', 'withdrawn', 'executed'
  )),
  initiated_by TEXT NOT NULL REFERENCES user(id),
  initiated_at TEXT NOT NULL,
  decided_by TEXT REFERENCES user(id),
  decided_at TEXT,
  decision_reason TEXT,
  executed_by TEXT REFERENCES user(id),
  executed_at TEXT,
  transfer_reference TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
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
CREATE TRIGGER IF NOT EXISTS disbursement_requests_touch
AFTER UPDATE ON disbursement_requests
FOR EACH ROW
BEGIN
  UPDATE disbursement_requests
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;
`;

const LEDGER_ENTRIES = `
CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  facility_id TEXT REFERENCES financing_facilities(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'disbursement', 'repayment', 'payroll_deduction', 'adjustment', 'refund'
  )),
  direction TEXT NOT NULL CHECK (direction IN ('debit', 'credit')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'IDR' CHECK (currency = 'IDR'),
  occurred_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  memo TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_facility_occurred_at
  ON ledger_entries (facility_id, occurred_at);
CREATE TRIGGER IF NOT EXISTS ledger_entries_immutable_update
BEFORE UPDATE ON ledger_entries
BEGIN
  SELECT RAISE(ABORT, 'ledger_entries_immutable');
END;
CREATE TRIGGER IF NOT EXISTS ledger_entries_immutable_delete
BEFORE DELETE ON ledger_entries
BEGIN
  SELECT RAISE(ABORT, 'ledger_entries_immutable');
END;
`;

export const MONEY_SCHEMA = `${DISBURSEMENT_REQUESTS}\n${LEDGER_ENTRIES}`;
