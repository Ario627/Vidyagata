"use server";

import { z } from "zod";
import {
  decideDisbursement,
  executeDisbursement,
  initiateDisbursement,
  recordAgreementSignature,
  recordLenderDecision,
  withdrawDisbursement,
} from "@/data/disbursements";
import type { OperatorWriteResult } from "@/data/operator";

const FacilityIdInput = z.ulid();
const ReasonInput = z.string().trim().max(500);
const NoteInput = z.string().trim().min(10).max(500);
const TransferReferenceInput = z
  .string()
  .trim()
  .min(4)
  .max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9/\-. ]{3,63}$/);

export async function recordLenderDecisionAction(
  input: unknown,
): Promise<OperatorWriteResult> {
  const parsed = z
    .object({
      facilityId: FacilityIdInput,
      decision: z.enum(["approved", "rejected"]),
      reason: ReasonInput.optional(),
    })
    .strict()
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  return recordLenderDecision(parsed.data);
}

export async function recordAgreementAction(
  input: unknown,
): Promise<OperatorWriteResult> {
  const parsed = z
    .object({ facilityId: FacilityIdInput, note: NoteInput })
    .strict()
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  return recordAgreementSignature(parsed.data);
}

export async function initiateDisbursementAction(
  facilityId: unknown,
): Promise<OperatorWriteResult> {
  const parsed = FacilityIdInput.safeParse(facilityId);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  return initiateDisbursement(parsed.data);
}

export async function decideDisbursementAction(
  input: unknown,
): Promise<OperatorWriteResult> {
  const parsed = z
    .object({
      facilityId: FacilityIdInput,
      decision: z.enum(["approved", "rejected"]),
      reason: ReasonInput.optional(),
      confirmDestination: z.boolean(),
    })
    .strict()
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  return decideDisbursement(parsed.data);
}

export async function withdrawDisbursementAction(
  facilityId: unknown,
): Promise<OperatorWriteResult> {
  const parsed = FacilityIdInput.safeParse(facilityId);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  return withdrawDisbursement(parsed.data);
}

export async function executeDisbursementAction(
  input: unknown,
): Promise<OperatorWriteResult> {
  const parsed = z
    .object({
      facilityId: FacilityIdInput,
      transferReference: TransferReferenceInput,
      deductionRate: z.union([z.literal(20), z.literal(40), z.literal(60)]),
    })
    .strict()
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  return executeDisbursement(parsed.data);
}
