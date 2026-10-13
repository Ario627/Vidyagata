const MAX_LENGTH = 512;
const PROTOCOL_RELATIVE = /^\/\//;
const DISALLOWED_CHARS = /[\\\s]/;

export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (value.length === 0 || value.length > MAX_LENGTH) return null;
  if (!value.startsWith("/")) return null;
  if (PROTOCOL_RELATIVE.test(value)) return null;
  if (DISALLOWED_CHARS.test(value)) return null;
  return value;
}
