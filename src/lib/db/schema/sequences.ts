const REFERENCE_SEQUENCES = `
CREATE TABLE IF NOT EXISTS reference_sequences (
  scope TEXT NOT NULL CHECK (scope GLOB '[a-z][a-z0-9_]*' AND length(scope) BETWEEN 3 AND 32),
  period TEXT NOT NULL CHECK (period GLOB '[0-9][0-9][0-9][0-9]'),
  current_value INTEGER NOT NULL CHECK (current_value >= 1),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (scope, period)
);
`;

export const SEQUENCE_SCHEMA = REFERENCE_SEQUENCES;
