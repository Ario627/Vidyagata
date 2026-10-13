import "server-only";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { IDENTITY_SCHEMA } from "./schema/identity";
import { PLATFORM_SCHEMA } from "./schema/platform";
import { REGULATORY_SCHEMA } from "./schema/regulatory";
import { applyPlatformSeeds } from "./seed/platform";

const DATA_DIRECTORY = ".data";
const DATABASE_FILE = "auth.db";
const BUSY_TIMEOUT_MS = 15_000;
const INIT_ATTEMPTS = 8;
const INIT_PAUSE_MS = 150;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  emailVerified INTEGER NOT NULL,
  image TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  phoneNumber TEXT,
  phoneNumberVerified INTEGER,
  username TEXT,
  displayUsername TEXT,
  birthdate TEXT
);
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expiresAt TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES user(id)
);
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES user(id),
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt TEXT,
  refreshTokenExpiresAt TEXT,
  scope TEXT,
  password TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS otp_challenge (
  phoneNumber TEXT PRIMARY KEY,
  codeHash TEXT NOT NULL,
  issuedAt INTEGER NOT NULL,
  expiresAt INTEGER NOT NULL,
  attempts INTEGER NOT NULL,
  lockCount INTEGER NOT NULL,
  lockedUntil INTEGER
);
CREATE TABLE IF NOT EXISTS rateLimit (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL,
  lastRequest INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS age_ban (
  fingerprint TEXT PRIMARY KEY,
  eligible_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  attempts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS session_user_id_index ON session (userId);
CREATE INDEX IF NOT EXISTS verification_identifier_index ON verification (identifier);
CREATE INDEX IF NOT EXISTS otp_challenge_expires_index ON otp_challenge (expiresAt);
CREATE UNIQUE INDEX IF NOT EXISTS user_username_unique ON user (username);
CREATE INDEX IF NOT EXISTS age_ban_eligible_index ON age_ban (eligible_at);
`;

function pauseSynchronously(milliseconds: number): void {
  const signal = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(signal, 0, 0, milliseconds);
}

function isBusyError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /database is locked|SQLITE_BUSY/i.test(message);
}

type AdditiveColumn = {
  readonly table: string;
  readonly column: string;
  readonly definition: string;
};

const ADDITIVE_COLUMNS: readonly AdditiveColumn[] = [
  { table: "user", column: "username", definition: "TEXT" },
  { table: "user", column: "displayUsername", definition: "TEXT" },
  { table: "user", column: "birthdate", definition: "TEXT" },
];

function ensureAdditiveColumns(database: DatabaseSync): void {
  for (const entry of ADDITIVE_COLUMNS) {
    const columns = database
      .prepare(`PRAGMA table_info(${entry.table})`)
      .all() as { name: string }[];
    const exists = columns.some((column) => column.name === entry.column);
    if (exists) continue;
    execWithRetry(
      database,
      `ALTER TABLE ${entry.table} ADD COLUMN ${entry.column} ${entry.definition}`,
    );
  }
}

function execWithRetry(database: DatabaseSync, sql: string): void {
  for (let attempt = 0; attempt < INIT_ATTEMPTS; attempt += 1) {
    try {
      database.exec(sql);
      return;
    } catch (error) {
      if (!isBusyError(error) || attempt === INIT_ATTEMPTS - 1) throw error;
      pauseSynchronously(INIT_PAUSE_MS);
    }
  }
}

let instance: DatabaseSync | null = null;

export function openAuthDatabase(): DatabaseSync {
  if (instance !== null) return instance;
  const file =
    process.env.VIDYAGATA_DB_FILE ??
    join(process.cwd(), DATA_DIRECTORY, DATABASE_FILE);
  mkdirSync(dirname(file), { recursive: true });
  const database = new DatabaseSync(file);
  database.exec(`PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS};`);
  database.exec("PRAGMA foreign_keys = ON;");
  execWithRetry(database, "PRAGMA journal_mode = WAL;");
  execWithRetry(database, SCHEMA);
  execWithRetry(database, PLATFORM_SCHEMA);
  execWithRetry(database, IDENTITY_SCHEMA);
  execWithRetry(database, REGULATORY_SCHEMA);
  ensureAdditiveColumns(database);
  applyPlatformSeeds(database);
  instance = database;
  return database;
}
