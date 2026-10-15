import "server-only";
import type { Db } from "./client";
import { POSTGRES_SCHEMA } from "./schema/postgres";
import { applyIdentitySeeds } from "./seed/identity";
import { applyPlatformSeeds } from "./seed/platform";
import { applyWorkSeeds } from "./seed/work";

export const SCHEMA_VERSION = "0001_init";

const CREATE_MIGRATIONS_TABLE = `CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL
)`;

const RECORD_VERSION = `INSERT INTO schema_migrations (version, applied_at)
VALUES (?, ?)
ON CONFLICT (version) DO NOTHING`;

export async function migratePostgres(database: Db): Promise<void> {
  const existing = await database
    .prepare("SELECT version FROM schema_migrations WHERE version = ?")
    .get(SCHEMA_VERSION)
    .catch(() => undefined);
  if (existing !== undefined) return;
  await database.transaction(async () => {
    await database
      .prepare("SELECT pg_advisory_xact_lock(hashtext('vidyagata_schema'))")
      .get();
    await database.execute(CREATE_MIGRATIONS_TABLE);
    await database.execute(POSTGRES_SCHEMA);
    await applyPlatformSeeds(database);
    await applyIdentitySeeds(database);
    await applyWorkSeeds(database);
    await database
      .prepare(RECORD_VERSION)
      .run(SCHEMA_VERSION, new Date().toISOString());
  });
}
