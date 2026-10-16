import "server-only";
import { createHash } from "node:crypto";
import { recordAudit } from "@/data/audit";
import { requireRole } from "@/data/dal";
import { rolesOf } from "@/data/roles";
import { jakartaPlainDateOf } from "@/domain/account/age";
import {
  buildStatementCanonical,
  buildStatementClauses,
  buildStatementClosing,
  buildStatementIdentity,
  STATEMENT_TITLE,
  STATEMENT_VERSION,
  type StatementIdentityRow,
  type StatementInput,
  statementDocumentNumber,
} from "@/domain/legal/statement";
import { db } from "@/lib/db/client";
import {
  MAX_DOCUMENT_BYTES,
  STUDENT_DOCUMENT_KINDS,
} from "@/lib/db/schema/documents";
import { newId } from "@/lib/id";
import { getCurrentUser } from "@/lib/session";

export type StudentDocumentKind = (typeof STUDENT_DOCUMENT_KINDS)[number];

export type StudentDocumentMeta = {
  readonly id: string;
  readonly kind: StudentDocumentKind;
  readonly mime: string;
  readonly byteSize: number;
  readonly updatedAt: string;
};

export type DocumentSaveResult =
  | { readonly ok: true; readonly document: StudentDocumentMeta }
  | {
      readonly ok: false;
      readonly code:
        | "invalid_kind"
        | "invalid_type"
        | "too_large"
        | "profile_incomplete";
    };

export type StatementState = {
  readonly title: string;
  readonly version: string;
  readonly documentNumber: string;
  readonly identityRows: readonly StatementIdentityRow[];
  readonly clauses: readonly string[];
  readonly closing: string;
  readonly issuedAt: string;
  readonly signedAt: string | null;
  readonly signedName: string | null;
  readonly signatureImage: string | null;
  readonly statementHash: string | null;
  readonly fullName: string;
  readonly city: string;
};

export type SignStatementResult =
  | { readonly ok: true; readonly signedAt: string }
  | {
      readonly ok: false;
      readonly code:
        | "profile_incomplete"
        | "invalid_signature"
        | "already_signed";
    };

const IMAGE_MIME: readonly string[] = ["image/jpeg", "image/png"];
const ALL_MIME: readonly string[] = [...IMAGE_MIME, "application/pdf"];
const SIGNATURE_PNG_PREFIX = "data:image/png;base64,";
const MIN_SIGNATURE_BYTES = 128;
const MAX_SIGNATURE_BYTES = 96 * 1024;

type DocumentRow = {
  id: string;
  kind: string;
  mime: string;
  byte_size: number;
  updated_at: string;
};

type StatementProfileRow = {
  id: string;
  full_name: string;
  academic_status: string;
  current_semester: number | null;
  province: string;
  city: string;
  institution_name: string | null;
};

type SignatureRow = {
  statement_hash: string;
  signed_name: string;
  signature_image: string | null;
  signed_at: string;
};

const SELECT_STUDENT_PROFILE = `SELECT s.id, s.full_name, s.academic_status,
  s.current_semester, s.province, s.city, i.name AS institution_name
FROM students s
LEFT JOIN institutions i ON i.id = s.institution_id
WHERE s.user_id = ?`;

const SELECT_MY_DOCUMENTS = `SELECT d.id, d.kind, d.mime, d.byte_size, d.updated_at
FROM student_documents d
JOIN students s ON s.id = d.student_id
WHERE s.user_id = ?
ORDER BY d.kind`;

const UPSERT_DOCUMENT = `INSERT INTO student_documents (
  id, student_id, kind, mime, byte_size, sha256, data, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(student_id, kind) DO UPDATE SET
  mime = excluded.mime,
  byte_size = excluded.byte_size,
  sha256 = excluded.sha256,
  data = excluded.data,
  updated_at = excluded.updated_at`;

const SELECT_DOCUMENT_FOR_VIEWER = `SELECT d.id, d.kind, d.mime, d.byte_size,
  d.updated_at, d.data, s.user_id AS owner_user_id
FROM student_documents d
JOIN students s ON s.id = d.student_id
WHERE d.id = ?`;

const SELECT_DOCUMENTS_BY_FACILITY = `SELECT d.id, d.kind, d.mime, d.byte_size,
  d.updated_at
FROM student_documents d
WHERE d.student_id = (
  SELECT student_id FROM financing_facilities WHERE id = ?
)
ORDER BY d.kind`;

const SELECT_SIGNATURE_BY_FACILITY = `SELECT s.statement_hash, s.signed_at
FROM student_statement_signatures s
WHERE s.student_id = (
  SELECT student_id FROM financing_facilities WHERE id = ?
)
ORDER BY s.signed_at DESC
LIMIT 1`;

const SELECT_DOCUMENT_ID = `SELECT id FROM student_documents
WHERE student_id = ? AND kind = ?`;

const SELECT_LATEST_DEDUCTION_RATE = `SELECT payroll_deduction_rate
FROM financing_facilities
WHERE student_id = ? AND payroll_deduction_rate IS NOT NULL
ORDER BY created_at DESC, id DESC
LIMIT 1`;

const SELECT_SIGNATURE = `SELECT statement_hash, signed_name, signature_image,
  signed_at
FROM student_statement_signatures
WHERE student_id = ? AND statement_version = ?
ORDER BY signed_at DESC
LIMIT 1`;

const INSERT_SIGNATURE = `INSERT INTO student_statement_signatures (
  id, student_id, statement_version, statement_hash, signed_name,
  signature_image, ip_address, user_agent, signed_at, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(student_id, statement_version) DO NOTHING`;

function sniffMime(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (
    bytes.length >= png.length &&
    png.every((byte, index) => bytes[index] === byte)
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return "application/pdf";
  }
  return null;
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function toMeta(row: DocumentRow): StudentDocumentMeta {
  return {
    id: row.id,
    kind: row.kind as StudentDocumentKind,
    mime: row.mime,
    byteSize: row.byte_size,
    updatedAt: row.updated_at,
  };
}

function isKind(value: string): value is StudentDocumentKind {
  return (STUDENT_DOCUMENT_KINDS as readonly string[]).includes(value);
}

function allowedMimeFor(kind: StudentDocumentKind): readonly string[] {
  return kind === "statement_signed" ? ALL_MIME : IMAGE_MIME;
}

async function selectStatementProfile(
  userId: string,
): Promise<StatementProfileRow | null> {
  const row = (await db.prepare(SELECT_STUDENT_PROFILE).get(userId)) as
    | StatementProfileRow
    | undefined;
  return row ?? null;
}

async function selectSignature(
  studentId: string,
): Promise<SignatureRow | null> {
  const row = (await db
    .prepare(SELECT_SIGNATURE)
    .get(studentId, STATEMENT_VERSION)) as SignatureRow | undefined;
  return row ?? null;
}

async function selectDeductionRate(studentId: string): Promise<number | null> {
  const row = (await db.prepare(SELECT_LATEST_DEDUCTION_RATE).get(studentId)) as
    | { payroll_deduction_rate: number }
    | undefined;
  return row?.payroll_deduction_rate ?? null;
}

export async function getMyDocuments(): Promise<
  readonly StudentDocumentMeta[]
> {
  const user = await getCurrentUser();
  if (user === null) return [];
  const rows = (await db.prepare(SELECT_MY_DOCUMENTS).all(user.id)) as
    | DocumentRow[]
    | undefined;
  return (rows ?? []).map(toMeta);
}

export async function saveStudentDocument(input: {
  readonly kind: string;
  readonly bytes: Uint8Array;
}): Promise<DocumentSaveResult> {
  const user = await getCurrentUser();
  if (user === null) return { ok: false, code: "profile_incomplete" };
  if (!isKind(input.kind)) return { ok: false, code: "invalid_kind" };
  const kind = input.kind;
  if (input.bytes.length === 0 || input.bytes.length > MAX_DOCUMENT_BYTES) {
    return { ok: false, code: "too_large" };
  }
  const mime = sniffMime(input.bytes);
  if (mime === null || !allowedMimeFor(kind).includes(mime)) {
    return { ok: false, code: "invalid_type" };
  }
  const profile = await selectStatementProfile(user.id);
  if (profile === null) return { ok: false, code: "profile_incomplete" };
  const occurredAt = new Date();
  const stamp = occurredAt.toISOString();
  const digest = sha256Hex(input.bytes);
  await db
    .prepare(UPSERT_DOCUMENT)
    .run(
      newId(occurredAt.getTime()),
      profile.id,
      kind,
      mime,
      input.bytes.length,
      digest,
      input.bytes,
      stamp,
      stamp,
    );
  await recordAudit({
    actorType: "user",
    actorId: user.id,
    action: "student.document_uploaded",
    entityType: "student_document",
    entityId: profile.id,
    after: { kind, mime, byteSize: input.bytes.length, sha256: digest },
  });
  const stored = (await db.prepare(SELECT_DOCUMENT_ID).get(profile.id, kind)) as
    | { id: string }
    | undefined;
  if (stored === undefined) return { ok: false, code: "invalid_kind" };
  return {
    ok: true,
    document: {
      id: stored.id,
      kind,
      mime,
      byteSize: input.bytes.length,
      updatedAt: stamp,
    },
  };
}

function statementInputOf(
  profile: StatementProfileRow,
  deductionRate: number | null,
): StatementInput {
  return {
    fullName: profile.full_name,
    institutionName: profile.institution_name,
    academicStatus: profile.academic_status,
    currentSemester: profile.current_semester,
    city: profile.city,
    province: profile.province,
    deductionRate,
  };
}

export async function getMyStatement(): Promise<StatementState | null> {
  const user = await getCurrentUser();
  if (user === null) return null;
  const profile = await selectStatementProfile(user.id);
  if (profile === null) return null;
  const deductionRate = await selectDeductionRate(profile.id);
  const signature = await selectSignature(profile.id);
  const issuedAt = signature?.signed_at ?? new Date().toISOString();
  const issuedPlain = jakartaPlainDateOf(new Date(issuedAt));
  const year = Number((issuedPlain ?? issuedAt.slice(0, 10)).slice(0, 4));
  const input = statementInputOf(profile, deductionRate);
  return {
    title: STATEMENT_TITLE,
    version: STATEMENT_VERSION,
    documentNumber: statementDocumentNumber(profile.id, year),
    identityRows: buildStatementIdentity(input),
    clauses: buildStatementClauses(input),
    closing: buildStatementClosing(),
    issuedAt,
    signedAt: signature?.signed_at ?? null,
    signedName: signature?.signed_name ?? null,
    signatureImage:
      signature?.signature_image == null
        ? null
        : `${SIGNATURE_PNG_PREFIX}${signature.signature_image}`,
    statementHash: signature?.statement_hash ?? null,
    fullName: profile.full_name,
    city: profile.city,
  };
}

export async function signMyStatement(input: {
  readonly signaturePng: Uint8Array;
}): Promise<SignStatementResult> {
  const user = await getCurrentUser();
  if (user === null) return { ok: false, code: "profile_incomplete" };
  const profile = await selectStatementProfile(user.id);
  if (profile === null) return { ok: false, code: "profile_incomplete" };
  if ((await selectSignature(profile.id)) !== null) {
    return { ok: false, code: "already_signed" };
  }
  const bytes = input.signaturePng;
  if (
    bytes.length < MIN_SIGNATURE_BYTES ||
    bytes.length > MAX_SIGNATURE_BYTES ||
    sniffMime(bytes) !== "image/png"
  ) {
    return { ok: false, code: "invalid_signature" };
  }
  const occurredAt = new Date();
  const stamp = occurredAt.toISOString();
  const plain = jakartaPlainDateOf(occurredAt);
  const year = Number((plain ?? stamp.slice(0, 10)).slice(0, 4));
  const deductionRate = await selectDeductionRate(profile.id);
  const canonical = buildStatementCanonical({
    ...statementInputOf(profile, deductionRate),
    documentNumber: statementDocumentNumber(profile.id, year),
  });
  const digest = sha256Hex(new TextEncoder().encode(canonical));
  await db
    .prepare(INSERT_SIGNATURE)
    .run(
      newId(occurredAt.getTime()),
      profile.id,
      STATEMENT_VERSION,
      digest,
      profile.full_name,
      Buffer.from(bytes).toString("base64"),
      null,
      null,
      stamp,
      stamp,
    );
  await recordAudit({
    actorType: "user",
    actorId: user.id,
    action: "student.statement_signed",
    entityType: "student_statement",
    entityId: profile.id,
    after: {
      version: STATEMENT_VERSION,
      statementHash: digest,
      signature: "drawn",
    },
  });
  return { ok: true, signedAt: stamp };
}

export async function readDocumentForViewer(input: {
  readonly documentId: string;
}): Promise<{
  readonly meta: StudentDocumentMeta;
  readonly bytes: Uint8Array;
} | null> {
  const user = await getCurrentUser();
  if (user === null) return null;
  const row = (await db
    .prepare(SELECT_DOCUMENT_FOR_VIEWER)
    .get(input.documentId)) as
    | (DocumentRow & { data: Uint8Array; owner_user_id: string })
    | undefined;
  if (row === undefined) return null;
  const isOwner = row.owner_user_id === user.id;
  const isOperator = isOwner ? false : (await rolesOf(user.id)).has("operator");
  if (!isOwner && !isOperator) return null;
  return { meta: toMeta(row), bytes: row.data };
}

export type FacilityDocumentsOverview = {
  readonly documents: readonly StudentDocumentMeta[];
  readonly statementSignedAt: string | null;
  readonly statementHash: string | null;
};

export async function getFacilityDocumentsOverview(
  facilityId: string,
): Promise<FacilityDocumentsOverview> {
  await requireRole("operator");
  const rows = (await db
    .prepare(SELECT_DOCUMENTS_BY_FACILITY)
    .all(facilityId)) as DocumentRow[] | undefined;
  const signature = (await db
    .prepare(SELECT_SIGNATURE_BY_FACILITY)
    .get(facilityId)) as
    | { statement_hash: string; signed_at: string }
    | undefined;
  return {
    documents: (rows ?? []).map(toMeta),
    statementSignedAt: signature?.signed_at ?? null,
    statementHash: signature?.statement_hash ?? null,
  };
}
