import postgres from "postgres";
import { POSTGRES_SCHEMA } from "../src/lib/db/schema/postgres.ts";

const SCHEMA_VERSION = "0001_init";

if (process.loadEnvFile !== undefined) {
  try {
    process.loadEnvFile(".env");
  } catch {
    console.log("tanpa .env, memakai environment proses");
  }
}

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
  ssl:
    url.includes("localhost") || url.includes("127.0.0.1") ? false : "require",
});

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL
    )
  `;
  const rows = await sql`
    SELECT version FROM schema_migrations WHERE version = ${SCHEMA_VERSION}
  `;
  if (rows.length > 0) {
    console.log(`lewati ${SCHEMA_VERSION} (sudah diterapkan)`);
    await sql.end({ timeout: 5 });
    return;
  }
  console.log(`terapkan ${SCHEMA_VERSION}...`);
  await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtext('vidyagata_schema'))`;
    await tx.unsafe(POSTGRES_SCHEMA);
    await tx`
      INSERT INTO schema_migrations (version, applied_at)
      VALUES (${SCHEMA_VERSION}, ${new Date().toISOString()})
    `;
  });
  console.log(`selesai ${SCHEMA_VERSION}`);
  console.log(
    "Seed parameter, lembaga, dan lowongan berjalan otomatis saat request pertama aplikasi.",
  );
  await sql.end({ timeout: 5 });
}

main().catch(async (error) => {
  console.error(
    "Migrasi gagal:",
    error instanceof Error ? error.message : error,
  );
  await sql.end({ timeout: 5 }).catch(() => undefined);
  process.exit(1);
});
