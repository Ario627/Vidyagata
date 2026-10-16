import "server-only";
import { asFlag, db } from "@/lib/db/client";

export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
  const row = (await db
    .prepare('SELECT "twoFactorEnabled" FROM "user" WHERE "id" = ?')
    .get(userId)) as { twoFactorEnabled: number | boolean | null } | undefined;
  return row !== undefined && asFlag(row.twoFactorEnabled);
}
