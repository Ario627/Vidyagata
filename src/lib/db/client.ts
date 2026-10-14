import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import type { DatabaseSync } from "node:sqlite";
import { getPostgresClient, type PostgresClient } from "./postgres";
import { openAuthDatabase } from "./sqlite";

export type SqlValue = string | number | bigint | boolean | null;

export type SqlStatement = {
  get<T>(...params: SqlValue[]): Promise<T | undefined>;
  all<T>(...params: SqlValue[]): Promise<T[]>;
  run(...params: SqlValue[]): Promise<{ changes: number }>;
};

export type DbDialect = "sqlite" | "postgres";

export type Db = {
  dialect(): Promise<DbDialect>;
  prepare(sql: string): SqlStatement;
  execute(sql: string): Promise<void>;
  transaction<T>(fn: () => Promise<T>): Promise<T>;
  columnNames(table: string): Promise<ReadonlySet<string>>;
};

const PLACEHOLDER_PATTERN = "?";

function toPgPlaceholders(sql: string): string {
  let out = "";
  let index = 0;
  let inString = false;
  for (let position = 0; position < sql.length; position += 1) {
    const character = sql[position] ?? "";
    if (inString) {
      out += character;
      if (character === "'") {
        if (sql[position + 1] === "'") {
          out += "'";
          position += 1;
          continue;
        }
        inString = false;
      }
      continue;
    }
    if (character === "'") {
      inString = true;
      out += character;
      continue;
    }
    if (character === "?") {
      index += 1;
      out += `$${index}`;
      continue;
    }
    out += character;
  }
  return out;
}

function normalizeRows<T>(rows: unknown[]): T[] {
  for (const row of rows) {
    if (row === null || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const value = record[key];
      if (typeof value === "bigint") {
        record[key] = Number(value);
        continue;
      }
      if (value instanceof Date) {
        record[key] = value.toISOString();
      }
    }
  }
  return rows as T[];
}

function bindSqlite(
  params: readonly SqlValue[],
): (string | number | bigint | null)[] {
  return params.map((value) =>
    typeof value === "boolean" ? (value ? 1 : 0) : value,
  );
}

function wrapSqlite(raw: DatabaseSync): Db {
  return {
    async dialect() {
      return "sqlite";
    },
    prepare(sql) {
      return {
        async get<T>(...params: SqlValue[]): Promise<T | undefined> {
          return raw.prepare(sql).get(...bindSqlite(params)) as T | undefined;
        },
        async all<T>(...params: SqlValue[]): Promise<T[]> {
          return raw.prepare(sql).all(...bindSqlite(params)) as T[];
        },
        async run(...params: SqlValue[]) {
          const result = raw.prepare(sql).run(...bindSqlite(params));
          return { changes: Number(result.changes) };
        },
      };
    },
    async execute(sql) {
      raw.exec(sql);
    },
    async transaction<T>(fn: () => Promise<T>): Promise<T> {
      raw.exec("BEGIN IMMEDIATE");
      try {
        const result = await fn();
        raw.exec("COMMIT");
        return result;
      } catch (error) {
        raw.exec("ROLLBACK");
        throw error;
      }
    },
    async columnNames(table) {
      const rows = raw.prepare(`PRAGMA table_info(${table})`).all() as {
        name: string;
      }[];
      return new Set(rows.map((row) => row.name));
    },
  };
}

function wrapPostgres(client: PostgresClient): Db {
  type Queryable = { unsafe: PostgresClient["unsafe"] };
  const storage = new AsyncLocalStorage<Queryable>();
  const current = (): Queryable => storage.getStore() ?? client;
  return {
    async dialect() {
      return "postgres";
    },
    prepare(sql) {
      const text = toPgPlaceholders(sql);
      return {
        async get<T>(...params: SqlValue[]): Promise<T | undefined> {
          const rows = await current().unsafe(text, params as never[]);
          return normalizeRows<T>([...rows])[0];
        },
        async all<T>(...params: SqlValue[]): Promise<T[]> {
          const rows = await current().unsafe(text, params as never[]);
          return normalizeRows<T>([...rows]);
        },
        async run(...params: SqlValue[]) {
          const result = await current().unsafe(text, params as never[]);
          return { changes: result.count ?? 0 };
        },
      };
    },
    async execute(sql) {
      await current().unsafe(sql);
    },
    transaction<T>(fn: () => Promise<T>): Promise<T> {
      return client.begin((tx) =>
        storage.run(tx as unknown as Queryable, fn),
      ) as Promise<T>;
    },
    async columnNames(table) {
      const rows = (await client.unsafe(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
        [table] as never[],
      )) as unknown as { column_name: string }[];
      return new Set(rows.map((row) => row.column_name));
    },
  };
}

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  const isTest =
    process.env.NODE_ENV === "test" || process.env.VITEST !== undefined;
  if (isTest || url === undefined || url === "") {
    if (process.env.VERCEL === "1") {
      throw new Error(
        "DATABASE_URL wajib diisi di Vercel. SQLite tidak bisa dipakai di serverless karena filesystem hanya-baca.",
      );
    }
    const { applyIdentitySeeds } = await import("./seed/identity");
    const { applyPlatformSeeds } = await import("./seed/platform");
    const { applyWorkSeeds } = await import("./seed/work");
    const database = wrapSqlite(openAuthDatabase());
    await applyPlatformSeeds(database);
    await applyIdentitySeeds(database);
    await applyWorkSeeds(database);
    return database;
  }
  const client = getPostgresClient();
  if (client === null) throw new Error("DATABASE_URL tidak valid");
  const database = wrapPostgres(client);
  const { migratePostgres } = await import("./postgres-migrate");
  await migratePostgres(database);
  return database;
}

let ready: Promise<Db> | null = null;

export function getDb(): Promise<Db> {
  ready ??= createDb();
  return ready;
}

export const db: Db = {
  dialect: () => getDb().then((real) => real.dialect()),
  prepare: (sql) => ({
    get: async (...params) => (await getDb()).prepare(sql).get(...params),
    all: async (...params) => (await getDb()).prepare(sql).all(...params),
    run: async (...params) => (await getDb()).prepare(sql).run(...params),
  }),
  execute: (sql) => getDb().then((real) => real.execute(sql)),
  transaction: (fn) => getDb().then((real) => real.transaction(fn)),
  columnNames: (table) => getDb().then((real) => real.columnNames(table)),
};

export function asFlag(value: unknown): boolean {
  return value === true || value === 1;
}
