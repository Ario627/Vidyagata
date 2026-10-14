import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

export async function GET() {
  try {
    const database = await getDb();
    await database.prepare("SELECT 1").get();
    const engine = await database.dialect();
    return NextResponse.json(
      { ok: true, engine, time: new Date().toISOString() },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        engine: "unavailable",
        detail: error instanceof Error ? error.message : "database_unavailable",
        time: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
