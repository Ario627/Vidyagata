import "server-only";
import postgres from "postgres";

const CONNECT_TIMEOUT_SECONDS = 10;
const MAX_CONNECTIONS = 5;
const IDLE_TIMEOUT_SECONDS = 20;

export type PostgresClient = ReturnType<typeof postgres>;

let client: PostgresClient | null = null;

export function databaseUrl(): string | null {
  const url = process.env.DATABASE_URL;
  return url === undefined || url === "" ? null : url;
}

export function getPostgresClient(): PostgresClient | null {
  const url = databaseUrl();
  if (url === null) return null;
  if (client === null) {
    client = postgres(url, {
      prepare: false,
      max: MAX_CONNECTIONS,
      idle_timeout: IDLE_TIMEOUT_SECONDS,
      connect_timeout: CONNECT_TIMEOUT_SECONDS,
      ssl:
        url.includes("localhost") || url.includes("127.0.0.1")
          ? false
          : "require",
    });
  }
  return client;
}

export async function pingPostgres(): Promise<boolean> {
  const sql = getPostgresClient();
  if (sql === null) return false;
  try {
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function closePostgres(): Promise<void> {
  if (client === null) return;
  const current = client;
  client = null;
  await current.end({ timeout: 5 });
}
