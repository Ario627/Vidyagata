import "server-only";

export type CaptchaSettings = {
  readonly siteKey: string | null;
  readonly secretKey: string | null;
  readonly enabled: boolean;
};

function readEnv(name: string): string | null {
  const value = process.env[name];
  return value === undefined || value === "" ? null : value;
}

export function captchaSettings(): CaptchaSettings {
  const siteKey = readEnv("TURNSTILE_SITE_KEY");
  const secretKey = readEnv("TURNSTILE_SECRET_KEY");
  return {
    siteKey,
    secretKey,
    enabled: siteKey !== null && secretKey !== null,
  };
}
