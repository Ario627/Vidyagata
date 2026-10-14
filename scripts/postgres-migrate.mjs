import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const MIGRATIONS_DIR = "db/postgres";

if (existsSync(".env")) process.loadEnvFile(".env");

const url = process.env.DATABASE_URL;
if (url === undefined || url === "") {
  console.error(
    "DATABASE_URL belum diisi. Contoh: postgres://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres",
  );
  process.exit(1);
}

const sql = postgres(url, {
  prepare: false,
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
  ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : "require",
});

async function ensureMigrationsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

async function appliedVersions() {
  const rows = await sql`SELECT version FROM schema_migrations`;
  return new Set(rows.map((row) => row.version));
}

function migrationFiles() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

async function main() {
  await ensureMigrationsTable();
  const applied = await appliedVersions();
  const files = migrationFiles();
  let ran = 0;
  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    if (applied.has(version)) {
      console.log(`lewati ${version} (sudah diterapkan)`);
      continue;
    }
    const content = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    console.log(`terapkan ${version}...`);
    await sql.begin(async (tx) => {
      await tx.unsafe(content);
      await tx`INSERT INTO schema_migrations (version) VALUES (${version})`;
    });
    ran += 1;
    console.log(`selesai ${version}`);
  }
  console.log(
    ran === 0
      ? "Tidak ada migrasi baru."
      : `${ran} migrasi diterapkan. Total ${files.length} file.`,
  );
  await sql.end({ timeout: 5 });
}

main().catch(async (error) => {
  console.error("Migrasi gagal:", error instanceof Error ? error.message : error);
  await sql.end({ timeout: 5 }).catch(() => undefined);
  process.exit(1);
});