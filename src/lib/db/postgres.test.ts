import { describe, expect, it } from "vitest";
import { assertPostgresReachable, supabasePoolerHint } from "./postgres";
import postgres from "postgres";

describe("supabasePoolerHint", () => {
  it("memberi panduan saat host direct Supabase (IPv6-only)", () => {
    const hint = supabasePoolerHint(
      "postgresql://postgres:rahasia@db.rlfydiuixuybvqbwikoe.supabase.co:5432/postgres",
    );
    expect(hint).not.toBeNull();
    expect(hint).toContain("IPv6");
    expect(hint).toContain("pooler.supabase.com");
  });

  it("diam untuk host pooler Supabase", () => {
    expect(
      supabasePoolerHint(
        "postgresql://postgres.ref:rahasia@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres",
      ),
    ).toBeNull();
  });

  it("diam untuk host database biasa", () => {
    expect(
      supabasePoolerHint("postgres://postgres@127.0.0.1:5432/vidyagata"),
    ).toBeNull();
    expect(
      supabasePoolerHint("postgres://user:pass@db.example.com:5432/app"),
    ).toBeNull();
  });

  it("diam untuk URL yang tidak bisa diparse", () => {
    expect(supabasePoolerHint("bukan-url")).toBeNull();
  });
});

describe("assertPostgresReachable", () => {
  it("melempar pesan berisi panduan pooler saat host Supabase tidak terjangkau", async () => {
    const previous = process.env.DATABASE_URL;
    process.env.DATABASE_URL =
      "postgresql://postgres:rahasia@db.probekosongxyz.supabase.co:5432/postgres";
    const client = postgres(process.env.DATABASE_URL, {
      prepare: false,
      max: 1,
      connect_timeout: 5,
      ssl: "require",
    });
    try {
      await expect(assertPostgresReachable(client)).rejects.toThrow(
        /pooler\.supabase\.com/,
      );
    } finally {
      await client.end({ timeout: 1 }).catch(() => undefined);
      if (previous === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previous;
      }
    }
  }, 15_000);
});
