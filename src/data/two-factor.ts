import "server-only";
import { cache } from "react";
import { type Actor, requireRole } from "@/data/dal";
import { openAuthDatabase } from "@/lib/db/sqlite";

export function isTwoFactorEnabled(userId: string): boolean {
  const row = openAuthDatabase()
    .prepare("SELECT twoFactorEnabled FROM user WHERE id = ?")
    .get(userId) as { twoFactorEnabled: number | null } | undefined;
  return row !== undefined && row.twoFactorEnabled === 1;
}

export type OperatorMfaGate = {
  readonly actor: Actor;
  readonly mfaRequired: boolean;
};

export const requireOperatorMfa = cache(async (): Promise<OperatorMfaGate> => {
  const actor = await requireRole("operator");
  return { actor, mfaRequired: !isTwoFactorEnabled(actor.id) };
});
