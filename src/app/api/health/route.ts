import { NextResponse } from "next/server";
import { pingPostgres } from "@/lib/db/postgres";
import { openAuthDatabase } from "@/lib/db/sqlite";

export async function GET() {
  let sqliteUp = false;
  try {
    openAuthDatabase().prepare("SELECT 1").get();
    sqliteUp = true;
  } catch {
    sqliteUp = false;
  }
  const postgresUp = await pingPostgres();
  const engine =
    process.env.DATABASE_URL === undefined || process.env.DATABASE_URL === ""
      ? "sqlite"
      : "postgres";
  const ok = engine === "postgres" ? postgresUp : sqliteUp;
  return NextResponse.json(
    {
      ok,
      engine,
      sqlite: sqliteUp ? "up" : "down",
      postgres: postgresUp ? "up" : "not_configured_or_down",
      time: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
