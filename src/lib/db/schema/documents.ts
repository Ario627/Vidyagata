export const STUDENT_DOCUMENT_KINDS = [
  "ktm",
  "selfie",
  "statement_signed",
] as const;

export const STUDENT_DOCUMENT_MIME = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;

export const DOCUMENTS_SCHEMA = `
CREATE TABLE IF NOT EXISTS student_documents (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  kind TEXT NOT NULL CHECK (kind IN ('ktm', 'selfie', 'statement_signed')),
  mime TEXT NOT NULL CHECK (mime IN ('image/jpeg', 'image/png', 'application/pdf')),
  byte_size INTEGER NOT NULL CHECK (byte_size > 0 AND byte_size <= 4194304),
  sha256 TEXT NOT NULL CHECK (length(sha256) = 64),
  data BLOB NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CONSTRAINT uq_student_documents_kind UNIQUE (student_id, kind)
);
CREATE INDEX IF NOT EXISTS idx_student_documents_student
  ON student_documents (student_id, kind);

CREATE TABLE IF NOT EXISTS student_statement_signatures (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  statement_version TEXT NOT NULL CHECK (length(statement_version) >= 1),
  statement_hash TEXT NOT NULL CHECK (length(statement_hash) = 64),
  signed_name TEXT NOT NULL CHECK (length(trim(signed_name)) >= 3),
  ip_address TEXT,
  user_agent TEXT,
  signed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CONSTRAINT uq_student_statement_version UNIQUE (student_id, statement_version)
);
CREATE INDEX IF NOT EXISTS idx_student_statement_student
  ON student_statement_signatures (student_id, signed_at);

CREATE TRIGGER IF NOT EXISTS student_statement_signatures_immutable_update
BEFORE UPDATE ON student_statement_signatures
BEGIN
  SELECT RAISE(ABORT, 'student_statement_signatures_immutable');
END;
CREATE TRIGGER IF NOT EXISTS student_statement_signatures_immutable_delete
BEFORE DELETE ON student_statement_signatures
BEGIN
  SELECT RAISE(ABORT, 'student_statement_signatures_immutable');
END;
`;
