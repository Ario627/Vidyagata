import "server-only";
import { forbidden, unauthorized } from "next/navigation";
import { cache } from "react";
import type { Role } from "@/domain/account/role";
import { getCurrentUser } from "@/lib/session";
import { rolesOf } from "./roles";

export type Actor = {
  readonly id: string;
  readonly roles: ReadonlySet<Role>;
};

export const requireRole = cache(
  async (...required: readonly Role[]): Promise<Actor> => {
    const user = await getCurrentUser();
    if (user === null) unauthorized();
    const roles = await rolesOf(user.id);
    if (!required.some((role) => roles.has(role))) forbidden();
    return { id: user.id, roles };
  },
);
