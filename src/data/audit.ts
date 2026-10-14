import "server-only";
import { headers } from "next/headers";
import { type Db, db } from "@/lib/db/client";
import { newId } from "@/lib/id";

export type AuditActorType = "user" | "operator" | "system" | "external";

export type AuditEvent = {
  readonly actorType: AuditActorType;
  readonly actorId: string;
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly before?: unknown;
  readonly after?: unknown;
  readonly reason?: string;
  readonly ipAddress?: string | null;
  readonly userAgent?: string | null;
};

export type AuditContext = {
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
};

export type PreparedAudit = {
  readonly event: AuditEvent;
  readonly reason: string | null;
  readonly context: AuditContext;
  readonly occurredAt: Date;
};

const ACTION_PATTERN = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;
const MAX_IP_LENGTH = 64;
const MAX_USER_AGENT_LENGTH = 512;

const INSERT_AUDIT = `INSERT INTO audit_logs (
  id, actor_type, actor_id, action, entity_type, entity_id,
  before_json, after_json, reason, ip_address, user_agent, occurred_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

function toJson(value: unknown): string | null {
  if (value === undefined) return null;
  return JSON.stringify(value);
}

function truncate(value: string | null, limit: number): string | null {
  if (value === null) return null;
  return value.length > limit ? value.slice(0, limit) : value;
}

function clientIpFromHeaderList(headerList: Headers): string | null {
  const realIp = headerList.get("x-real-ip");
  if (realIp !== null && realIp !== "") return realIp;
  const forwardedFor = headerList.get("x-forwarded-for");
  const first = forwardedFor?.split(",")[0]?.trim();
  if (first !== undefined && first !== "") return first;
  return null;
}

async function requestContext(): Promise<AuditContext> {
  const headerList = await headers();
  return {
    ipAddress: truncate(clientIpFromHeaderList(headerList), MAX_IP_LENGTH),
    userAgent: truncate(headerList.get("user-agent"), MAX_USER_AGENT_LENGTH),
  };
}

export async function appendAudit(
  database: Db,
  prepared: PreparedAudit,
): Promise<void> {
  const { event, reason, context, occurredAt } = prepared;
  await database
    .prepare(INSERT_AUDIT)
    .run(
      newId(occurredAt.getTime()),
      event.actorType,
      event.actorId,
      event.action,
      event.entityType,
      event.entityId,
      toJson(event.before),
      toJson(event.after),
      reason,
      event.ipAddress === undefined ? context.ipAddress : event.ipAddress,
      event.userAgent === undefined ? context.userAgent : event.userAgent,
      occurredAt.toISOString(),
    );
}

export async function prepareAudit(event: AuditEvent): Promise<PreparedAudit> {
  const reason = event.reason?.trim();
  if (
    event.actorType === "operator" &&
    (reason === undefined || reason === "")
  ) {
    throw new Error("audit_reason_required");
  }
  if (!ACTION_PATTERN.test(event.action)) {
    throw new Error("audit_action_invalid");
  }
  return {
    event,
    reason: reason === undefined || reason === "" ? null : reason,
    context: await requestContext(),
    occurredAt: new Date(),
  };
}

export async function recordAudit(event: AuditEvent): Promise<void> {
  const prepared = await prepareAudit(event);
  await appendAudit(db, prepared);
}
