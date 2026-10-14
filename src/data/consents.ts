import "server-only";
import { type Db, db } from "@/lib/db/client";
import { inTransaction } from "@/lib/db/tx";
import { newId } from "@/lib/id";
import { getCurrentUser } from "@/lib/session";
import { appendAudit, prepareAudit } from "./audit";

export type ConsentGrantVia = "checkbox" | "form" | "otp";

export type ConsentGrant = {
  readonly key: string;
  readonly grantedVia: ConsentGrantVia;
};

export type ConsentRecord = {
  readonly id: string;
  readonly userId: string;
  readonly consentId: string;
  readonly consentVersion: number;
  readonly grantedAt: string;
  readonly grantedVia: ConsentGrantVia;
  readonly withdrawnAt: string | null;
};

export type ConsentDefinition = {
  readonly id: string;
  readonly key: string;
  readonly version: number;
  readonly title: string;
  readonly body: string;
  readonly legalBasis: string;
  readonly effectiveFrom: string;
};

type ConsentDefinitionRow = {
  id: string;
  key: string;
  version: number;
  title: string;
  body: string;
  legal_basis: string;
  effective_from: string;
};

const SELECT_ACTIVE_DEFINITION = `SELECT id, key, version, title, body, legal_basis, effective_from
FROM consents
WHERE key = ? AND effective_from <= ?
ORDER BY version DESC
LIMIT 1`;

const SELECT_ACTIVE_RECORD = `SELECT id FROM consent_records
WHERE user_id = ? AND consent_id = ? AND withdrawn_at IS NULL
LIMIT 1`;

const INSERT_CONSENT_RECORD = `INSERT INTO consent_records (
  id, user_id, granted_by_user_id, consent_id, consent_version,
  granted_at, granted_via, ip_address, user_agent, withdrawn_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`;

const WITHDRAW_CONSENT = `UPDATE consent_records
SET withdrawn_at = ?
WHERE id = ? AND user_id = ? AND withdrawn_at IS NULL`;

function toDefinition(row: ConsentDefinitionRow): ConsentDefinition {
  return {
    id: row.id,
    key: row.key,
    version: row.version,
    title: row.title,
    body: row.body,
    legalBasis: row.legal_basis,
    effectiveFrom: row.effective_from,
  };
}

async function activeDefinitionAt(
  database: Db,
  key: string,
  at: string,
): Promise<ConsentDefinition | null> {
  const row = (await database.prepare(SELECT_ACTIVE_DEFINITION).get(key, at)) as
    | ConsentDefinitionRow
    | undefined;
  return row === undefined ? null : toDefinition(row);
}

function isUniqueViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /UNIQUE constraint failed/i.test(message);
}

export async function activeConsentDefinition(
  key: string,
  at: string,
): Promise<ConsentDefinition | null> {
  return activeDefinitionAt(db, key, at);
}

export async function hasActiveConsent(key: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (user === null) return false;
  const definition = await activeDefinitionAt(
    db,
    key,
    new Date().toISOString(),
  );
  if (definition === null) return false;
  const row = await db
    .prepare(SELECT_ACTIVE_RECORD)
    .get(user.id, definition.id);
  return row !== undefined;
}

export async function recordConsent(
  grant: ConsentGrant,
): Promise<ConsentRecord> {
  const user = await getCurrentUser();
  if (user === null) throw new Error("unauthenticated");
  const occurredAt = new Date();
  const grantedAt = occurredAt.toISOString();
  const definition = await activeDefinitionAt(db, grant.key, grantedAt);
  if (definition === null) throw new Error("consent_not_defined");
  const record: ConsentRecord = {
    id: newId(occurredAt.getTime()),
    userId: user.id,
    consentId: definition.id,
    consentVersion: definition.version,
    grantedAt,
    grantedVia: grant.grantedVia,
    withdrawnAt: null,
  };
  const prepared = await prepareAudit({
    actorType: "user",
    actorId: user.id,
    action: "consent.granted",
    entityType: "consent_record",
    entityId: record.id,
    after: {
      key: grant.key,
      version: record.consentVersion,
      grantedVia: record.grantedVia,
    },
  });
  try {
    await inTransaction(db, async () => {
      await db
        .prepare(INSERT_CONSENT_RECORD)
        .run(
          record.id,
          record.userId,
          null,
          record.consentId,
          record.consentVersion,
          record.grantedAt,
          record.grantedVia,
          prepared.context.ipAddress,
          prepared.context.userAgent,
        );
      await appendAudit(db, prepared);
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new Error("consent_already_active");
    throw error;
  }
  return record;
}

export async function withdrawConsent(recordId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (user === null) throw new Error("unauthenticated");
  const prepared = await prepareAudit({
    actorType: "user",
    actorId: user.id,
    action: "consent.withdrawn",
    entityType: "consent_record",
    entityId: recordId,
  });
  const database = db;
  return inTransaction(database, async () => {
    const result = await database
      .prepare(WITHDRAW_CONSENT)
      .run(prepared.occurredAt.toISOString(), recordId, user.id);
    if (result.changes === 0) return false;
    await appendAudit(database, prepared);
    return true;
  });
}
