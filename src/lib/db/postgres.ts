import "server-only";
import postgres from "postgres";

const CONNECT_TIMEOUT_SECONDS = 10;
const MAX_CONNECTIONS = 3;
const IDLE_TIMEOUT_SECONDS = 20;

export type PostgresClient = ReturnType<typeof postgres>;

let client: PostgresClient | null = null;

export function databaseUrl(): string | null {
  const url = process.env.DATABASE_URL;
  return url === undefined || url === "" ? null : url;
}

const SUPABASE_DIRECT_HOST = /^db\.[a-z0-9]+\.supabase\.co$/i;

export function supabasePoolerHint(url: string): string | null {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  if (!SUPABASE_DIRECT_HOST.test(host)) return null;
  return [
    `Host ${host} hanya menyediakan alamat IPv6, sementara runtime serverless (Vercel/Railway) hanya bisa IPv4 — DNS gagal dengan ENOTFOUND.`,
    "Gunakan koneksi Pooler dari dashboard Supabase (Connect → Transaction pooler / Session pooler):",
    "postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres",
    "Pakai port 6543 (transaction) untuk aplikasi serverless, port 5432 (session) untuk menjalankan migrasi manual.",
  ].join("\n");
}

export async function assertPostgresReachable(
  client: PostgresClient,
): Promise<void> {
  const url = databaseUrl();
  try {
    await client.unsafe("SELECT 1");
  } catch (error) {
    const hint = url === null ? null : supabasePoolerHint(url);
    if (hint !== null) {
      throw new Error(`Tidak bisa menyambung ke database Supabase:\n${hint}`, {
        cause: error,
      });
    }
    throw error;
  }
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
      types: {
        bigint: {
          to: 20,
          from: [20],
          serialize: (value: bigint | number) => String(value),
          parse: (value: string) => Number(value),
        },
        date: {
          to: 1082,
          from: [1082],
          serialize: (value: string) => value,
          parse: (value: string) => value,
        },
        boolean: {
          to: 16,
          from: [16],
          serialize: (value: unknown) =>
            value === true || value === 1 ? "t" : "f",
          parse: (value: string) => (value === "t" ? 1 : 0),
        },
        json: {
          to: 3802,
          from: [114, 3802],
          serialize: (value: unknown) =>
            typeof value === "string" ? value : JSON.stringify(value),
          parse: (value: string) => value,
        },
      },
    });
  }
  return client;
}
