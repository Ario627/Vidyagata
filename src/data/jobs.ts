import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db/client";

export type JobType = "part_time" | "project_based" | "internship";

export type CompensationType = "hourly" | "monthly" | "per_project";

export type LocationType = "onsite" | "remote" | "hybrid";

export type JobPostingSummary = {
  readonly id: string;
  readonly title: string;
  readonly employerName: string;
  readonly employerSector: string;
  readonly jobType: JobType;
  readonly weeklyHours: number;
  readonly compensationType: CompensationType;
  readonly compensationMin: number;
  readonly compensationMax: number;
  readonly locationType: LocationType;
  readonly city: string;
  readonly publishedAt: string | null;
  readonly skills: readonly string[];
};

export type JobPostingDetail = JobPostingSummary & {
  readonly description: string;
  readonly closesAt: string | null;
};

type JobRow = {
  id: string;
  title: string;
  employer_name: string;
  employer_sector: string;
  job_type: string;
  weekly_hours: number;
  compensation_type: string;
  compensation_min: number;
  compensation_max: number;
  location_type: string;
  city: string;
  published_at: string | null;
};

type JobDetailRow = JobRow & {
  description: string;
  closes_at: string | null;
};

type SkillRow = {
  job_posting_id: string;
  skill: string;
};

const CATALOG_COLUMNS = `jp.id, jp.title, e.name AS employer_name,
  e.sector AS employer_sector, jp.job_type, jp.weekly_hours,
  jp.compensation_type, jp.compensation_min, jp.compensation_max,
  jp.location_type, jp.city, jp.published_at`;

const SELECT_CATALOG = `SELECT ${CATALOG_COLUMNS}
FROM job_postings jp
JOIN employers e ON e.id = jp.employer_id
WHERE jp.status = 'active' AND e.status = 'active'
ORDER BY jp.published_at DESC, jp.id DESC
LIMIT 100`;

const SELECT_DETAIL = `SELECT ${CATALOG_COLUMNS}, jp.description, jp.closes_at
FROM job_postings jp
JOIN employers e ON e.id = jp.employer_id
WHERE jp.id = ? AND jp.status = 'active' AND e.status = 'active'`;

const SELECT_SKILLS = `SELECT job_posting_id, skill FROM job_posting_skills
ORDER BY job_posting_id, skill`;

const SELECT_SKILLS_FOR_ONE = `SELECT job_posting_id, skill
FROM job_posting_skills
WHERE job_posting_id = ?
ORDER BY skill`;

function toSummary(row: JobRow, skills: readonly string[]): JobPostingSummary {
  return {
    id: row.id,
    title: row.title,
    employerName: row.employer_name,
    employerSector: row.employer_sector,
    jobType: row.job_type as JobType,
    weeklyHours: row.weekly_hours,
    compensationType: row.compensation_type as CompensationType,
    compensationMin: row.compensation_min,
    compensationMax: row.compensation_max,
    locationType: row.location_type as LocationType,
    city: row.city,
    publishedAt: row.published_at,
    skills,
  };
}

function skillsByPosting(rows: readonly SkillRow[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const current = grouped.get(row.job_posting_id);
    if (current === undefined) {
      grouped.set(row.job_posting_id, [row.skill]);
    } else {
      current.push(row.skill);
    }
  }
  return grouped;
}

export async function selectJobCatalog(): Promise<
  readonly JobPostingSummary[]
> {
  const database = db;
  const rows = (await database.prepare(SELECT_CATALOG).all()) as JobRow[];
  const skillRows = (await database.prepare(SELECT_SKILLS).all()) as SkillRow[];
  const grouped = skillsByPosting(skillRows);
  return rows.map((row) => toSummary(row, grouped.get(row.id) ?? []));
}

export async function selectJobPostingDetail(
  jobId: string,
): Promise<JobPostingDetail | null> {
  const database = db;
  const row = (await database.prepare(SELECT_DETAIL).get(jobId)) as
    | JobDetailRow
    | undefined;
  if (row === undefined) return null;
  const skillRows = (await database
    .prepare(SELECT_SKILLS_FOR_ONE)
    .all(jobId)) as SkillRow[];
  return {
    ...toSummary(
      row,
      skillRows.map((skillRow) => skillRow.skill),
    ),
    description: row.description,
    closesAt: row.closes_at,
  };
}

export async function getJobCatalog(): Promise<readonly JobPostingSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("job-catalog");
  return selectJobCatalog();
}

export async function getJobPostingDetail(
  jobId: string,
): Promise<JobPostingDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("job-catalog");
  return selectJobPostingDetail(jobId);
}
