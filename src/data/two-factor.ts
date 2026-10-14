import "server-only";
import { cache } from "react";
import { type Actor, requireRole } from "@/data/dal";
import { asFlag, db } from "@/lib/db/client";

export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
  const row = (await db
    .prepare('SELECT "twoFactorEnabled" FROM "user" WHERE "id" = ?')
    .get(userId)) as { twoFactorEnabled: number | boolean | null } | undefined;
  return row !== undefined && asFlag(row.twoFactorEnabled);
}

export type OperatorMfaGate = {
  readonly actor: Actor;
  readonly mfaRequired: boolean;
};

export const requireOperatorMfa = cache(async (): Promise<OperatorMfaGate> => {
  const actor = await requireRole("operator");
  return { actor, mfaRequired: !(await isTwoFactorEnabled(actor.id)) };
});
