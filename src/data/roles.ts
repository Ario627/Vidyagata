import "server-only";
import type { Route } from "next";
import { isRole, type Role } from "@/domain/account/role";
import { openAuthDatabase } from "@/lib/db/sqlite";
import { inTransaction } from "@/lib/db/tx";
import { newId } from "@/lib/id";
import { getCurrentUser } from "@/lib/session";
import { appendAudit, prepareAudit } from "./audit";

export type RoleActor = {
  readonly type: "operator" | "system";
  readonly id: string;
};

export type RoleAssignment = {
  readonly id: string;
  readonly userId: string;
  readonly role: Role;
  readonly grantedAt: string;
};

const SELECT_ACTIVE_ROLES = `SELECT role FROM user_roles
WHERE user_id = ? AND revoked_at IS NULL
ORDER BY granted_at, role`;

const INSERT_ROLE = `INSERT INTO user_roles (
  id, user_id, role, granted_by_user_id, granted_at, revoked_at, reason
) VALUES (?, ?, ?, ?, ?, NULL, ?)`;

const REVOKE_ROLE = `UPDATE user_roles
SET revoked_at = ?
WHERE user_id = ? AND role = ? AND revoked_at IS NULL`;

function roleWriteError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (
    /uq_user_roles_active|UNIQUE constraint failed: user_roles/i.test(message)
  ) {
    return new Error("role_already_active");
  }
  if (/ck_user_roles_no_self_grant/i.test(message)) {
    return new Error("role_self_grant_forbidden");
  }
  if (/FOREIGN KEY constraint failed/i.test(message)) {
    return new Error("user_not_found");
  }
  return error instanceof Error ? error : new Error(message);
}

export async function rolesOf(userId: string): Promise<ReadonlySet<Role>> {
  const rows = openAuthDatabase().prepare(SELECT_ACTIVE_ROLES).all(userId) as {
    role: string;
  }[];
  const roles = new Set<Role>();
  for (const row of rows) {
    if (isRole(row.role)) roles.add(row.role);
  }
  return roles;
}

export async function grantRole(input: {
  readonly userId: string;
  readonly role: Role;
  readonly actor: RoleActor;
  readonly reason?: string;
}): Promise<RoleAssignment> {
  const occurredAt = new Date();
  const grantedAt = occurredAt.toISOString();
  const prepared = await prepareAudit({
    actorType: input.actor.type,
    actorId: input.actor.id,
    action: "user.role_granted",
    entityType: "user",
    entityId: input.userId,
    after: { role: input.role },
    reason: input.reason,
  });
  const assignment: RoleAssignment = {
    id: newId(occurredAt.getTime()),
    userId: input.userId,
    role: input.role,
    grantedAt,
  };
  const database = openAuthDatabase();
  try {
    inTransaction(database, () => {
      database
        .prepare(INSERT_ROLE)
        .run(
          assignment.id,
          assignment.userId,
          assignment.role,
          input.actor.type === "operator" ? input.actor.id : null,
          grantedAt,
          prepared.reason,
        );
      appendAudit(database, prepared);
    });
  } catch (error) {
    throw roleWriteError(error);
  }
  return assignment;
}

export async function revokeRole(input: {
  readonly userId: string;
  readonly role: Role;
  readonly actor: RoleActor;
  readonly reason?: string;
}): Promise<boolean> {
  const occurredAt = new Date();
  const prepared = await prepareAudit({
    actorType: input.actor.type,
    actorId: input.actor.id,
    action: "user.role_revoked",
    entityType: "user",
    entityId: input.userId,
    before: { role: input.role },
    reason: input.reason,
  });
  const database = openAuthDatabase();
  return inTransaction(database, () => {
    const result = database
      .prepare(REVOKE_ROLE)
      .run(occurredAt.toISOString(), input.userId, input.role);
    if (Number(result.changes) === 0) return false;
    appendAudit(database, prepared);
    return true;
  });
}

export async function defaultLandingPath(): Promise<Route> {
  const user = await getCurrentUser();
  if (user === null) return "/masuk";
  const roles = await rolesOf(user.id);
  return roles.has("operator") ? "/operator" : "/dashboard";
}
