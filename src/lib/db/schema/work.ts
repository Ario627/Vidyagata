const EMPLOYERS = `
CREATE TABLE IF NOT EXISTS employers (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user(id),
  name TEXT NOT NULL UNIQUE,
  sector TEXT NOT NULL,
  city TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_employers_user
  ON employers (user_id)
  WHERE user_id IS NOT NULL;
CREATE TRIGGER IF NOT EXISTS employers_touch
AFTER UPDATE ON employers
FOR EACH ROW
BEGIN
  UPDATE employers
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;
`;

const JOB_POSTINGS = `
CREATE TABLE IF NOT EXISTS job_postings (
  id TEXT PRIMARY KEY,
  employer_id TEXT NOT NULL REFERENCES employers(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('part_time', 'project_based', 'internship')),
  weekly_hours INTEGER NOT NULL CHECK (weekly_hours BETWEEN 1 AND 40),
  compensation_type TEXT NOT NULL CHECK (compensation_type IN ('hourly', 'monthly', 'per_project')),
  compensation_min INTEGER NOT NULL CHECK (compensation_min > 0),
  compensation_max INTEGER NOT NULL CHECK (compensation_max >= compensation_min),
  location_type TEXT NOT NULL CHECK (location_type IN ('onsite', 'remote', 'hybrid')),
  city TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'filled', 'closed')),
  published_at TEXT,
  closes_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CONSTRAINT ck_job_postings_active_published
    CHECK (status <> 'active' OR published_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_job_postings_status_published_at
  ON job_postings (status, published_at DESC);
CREATE TRIGGER IF NOT EXISTS job_postings_touch
AFTER UPDATE ON job_postings
FOR EACH ROW
BEGIN
  UPDATE job_postings
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;
`;

const JOB_POSTING_SKILLS = `
CREATE TABLE IF NOT EXISTS job_posting_skills (
  job_posting_id TEXT NOT NULL REFERENCES job_postings(id),
  skill TEXT NOT NULL CHECK (length(skill) BETWEEN 2 AND 60),
  PRIMARY KEY (job_posting_id, skill)
);
CREATE INDEX IF NOT EXISTS idx_job_posting_skills_skill
  ON job_posting_skills (skill);
`;

const JOB_APPLICATIONS = `
CREATE TABLE IF NOT EXISTS job_applications (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  job_posting_id TEXT NOT NULL REFERENCES job_postings(id),
  status TEXT NOT NULL CHECK (status IN (
    'draft', 'submitted', 'shortlisted', 'rejected', 'accepted', 'withdrawn'
  )),
  note TEXT,
  submitted_at TEXT,
  decided_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
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
CREATE TRIGGER IF NOT EXISTS job_applications_touch
AFTER UPDATE ON job_applications
FOR EACH ROW
BEGIN
  UPDATE job_applications
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;
`;

export const WORK_SCHEMA = `${EMPLOYERS}\n${JOB_POSTINGS}\n${JOB_POSTING_SKILLS}\n${JOB_APPLICATIONS}`;
