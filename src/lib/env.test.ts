import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env";

const BASE = {
  NODE_ENV: "development",
  OTP_PEPPER: "x".repeat(40),
};

const PRODUCTION_CAPTCHA = {
  TURNSTILE_SITE_KEY: "site-key",
  TURNSTILE_SECRET_KEY: "secret-key",
};

describe("parseServerEnv", () => {
  it("menerima konfigurasi minimal di development", () => {
    const parsed = parseServerEnv(BASE);
    expect(parsed.ok).toBe(true);
  });

  it("menolak DATABASE_URL yang bukan postgres", () => {
    const parsed = parseServerEnv({ ...BASE, DATABASE_URL: "mysql://x" });
    expect(parsed.ok).toBe(false);
  });

  it("menolak site key tanpa secret key", () => {
    const parsed = parseServerEnv({
      ...BASE,
      TURNSTILE_SITE_KEY: "site-key",
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error.some((issue) => issue.includes("TURNSTILE"))).toBe(
      true,
    );
  });

  it("menolak secret key tanpa site key", () => {
    const parsed = parseServerEnv({
      ...BASE,
      TURNSTILE_SECRET_KEY: "secret-key",
    });
    expect(parsed.ok).toBe(false);
  });

  it("menerima pasangan kunci Turnstile lengkap", () => {
    const parsed = parseServerEnv({ ...BASE, ...PRODUCTION_CAPTCHA });
    expect(parsed.ok).toBe(true);
  });

  it("mewajibkan captcha di produksi Vercel", () => {
    const parsed = parseServerEnv({ ...BASE, VERCEL_ENV: "production" });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(
      parsed.error.some((issue) => issue.includes("TURNSTILE_SECRET_KEY")),
    ).toBe(true);
  });

  it("menerima produksi dengan captcha lengkap", () => {
    const parsed = parseServerEnv({
      ...BASE,
      VERCEL_ENV: "production",
      ...PRODUCTION_CAPTCHA,
    });
    expect(parsed.ok).toBe(true);
  });

  it("menolak HIBP dimatikan di produksi", () => {
    const parsed = parseServerEnv({
      ...BASE,
      VERCEL_ENV: "production",
      ...PRODUCTION_CAPTCHA,
      HIBP_ENABLED: "false",
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error.some((issue) => issue.includes("HIBP_ENABLED"))).toBe(
      true,
    );
  });

  it("mengizinkan HIBP dimatikan di development", () => {
    const parsed = parseServerEnv({ ...BASE, HIBP_ENABLED: "false" });
    expect(parsed.ok).toBe(true);
  });
});
