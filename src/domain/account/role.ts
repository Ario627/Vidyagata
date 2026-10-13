export const ROLES = [
  "student",
  "employer",
  "operator",
  "institution_verifier",
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return ROLES.some((role) => role === value);
}
