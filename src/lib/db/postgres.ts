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
      },
    });
  }
  return client;
}
