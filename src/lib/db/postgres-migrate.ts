import "server-only";
import type { Db } from "./client";
import {
  POSTGRES_ADDITIVE_MIGRATIONS,
  POSTGRES_SCHEMA,
} from "./schema/postgres";
import { applyDemoSeeds } from "./seed/demo";
import { applyIdentitySeeds } from "./seed/identity";
import { applyPlatformSeeds } from "./seed/platform";
import { applyWorkSeeds } from "./seed/work";

export const SCHEMA_VERSION = "0002_student_documents";
export const SEED_VERSION = "seed_v2_catalog";

const CREATE_MIGRATIONS_TABLE = `CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL
)`;

const RECORD_VERSION = `INSERT INTO schema_migrations (version, applied_at)
VALUES (?, ?)
ON CONFLICT (version) DO NOTHING`;

async function readVersions(database: Db): Promise<Set<string>> {
  const rows = await database
    .prepare("SELECT version FROM schema_migrations")
    .all<{ version: string }>();
  return new Set(rows.map((row) => row.version));
}

async function appliedVersions(database: Db): Promise<Set<string> | null> {
  try {
    return await readVersions(database);
  } catch {
    return null;
  }
}

function hasPendingWork(applied: ReadonlySet<string> | null): boolean {
  if (applied === null) return true;
  if (!applied.has(SCHEMA_VERSION)) return true;
  if (!applied.has(SEED_VERSION)) return true;
  return POSTGRES_ADDITIVE_MIGRATIONS.some(
    (migration) => !applied.has(migration.version),
  );
}

async function recordVersion(database: Db, version: string): Promise<void> {
  await database.prepare(RECORD_VERSION).run(version, new Date().toISOString());
}

export async function migratePostgres(database: Db): Promise<void> {
  const applied = await appliedVersions(database);
  if (hasPendingWork(applied)) {
    await database.transaction(async () => {
      await database
        .prepare("SELECT pg_advisory_xact_lock(hashtext('vidyagata_schema'))")
        .get();
      await database.execute(CREATE_MIGRATIONS_TABLE);
      const seen = await readVersions(database);
      if (!seen.has(SCHEMA_VERSION)) {
        await database.execute(POSTGRES_SCHEMA);
        await recordVersion(database, SCHEMA_VERSION);
      }
      for (const migration of POSTGRES_ADDITIVE_MIGRATIONS) {
        if (seen.has(migration.version)) continue;
        await database.execute(migration.statements);
        await recordVersion(database, migration.version);
      }
      if (!seen.has(SEED_VERSION)) {
        await applyPlatformSeeds(database);
        await applyIdentitySeeds(database);
        await applyWorkSeeds(database);
        await recordVersion(database, SEED_VERSION);
      }
    });
  }
  await applyDemoSeeds(database);
}
