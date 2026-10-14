"use server";

import { z } from "zod";
import {
  claimFacility,
  forwardFacility,
  type OperatorWriteResult,
  rejectFacility,
} from "@/data/operator";

const FacilityIdInput = z.ulid();
const ReasonInput = z.string().max(500);

export async function claimFacilityAction(
  facilityId: unknown,
): Promise<OperatorWriteResult> {
  const parsed = FacilityIdInput.safeParse(facilityId);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  return claimFacility(parsed.data);
}

export async function forwardFacilityAction(
  input: unknown,
): Promise<OperatorWriteResult> {
  const parsed = z
    .object({ facilityId: FacilityIdInput, reason: ReasonInput.optional() })
    .strict()
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  return forwardFacility(parsed.data);
}

export async function rejectFacilityAction(
  input: unknown,
): Promise<OperatorWriteResult> {
  const parsed = z
    .object({ facilityId: FacilityIdInput, reason: ReasonInput })
    .strict()
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  if (parsed.data.reason.trim() === "") {
    return { ok: false, code: "reason_required" };
  }
  return rejectFacility(parsed.data);
}
