"use server";

import { z } from "zod";
import { recordConsent } from "@/data/consents";
import {
  cancelMyFacility,
  saveMyDraft,
  submitMyFacility,
} from "@/data/financing";
import { ApplyDraftSchema } from "@/schemas/financing";

export type DraftSaveResult =
  | { readonly ok: true; readonly facilityId: string }
  | { readonly ok: false; readonly code: string };

export type ActionResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly code: string };

const FacilityIdInput = z.ulid();

function errorCode(error: unknown): string {
  return error instanceof Error ? error.message : "unknown";
}

export async function saveDraftAction(
  input: unknown,
): Promise<DraftSaveResult> {
  const parsed = ApplyDraftSchema.strict().safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const facility = await saveMyDraft({
      institutionId: parsed.data.institutionId ?? null,
      requestedAmount: parsed.data.requestedAmount ?? null,
      academicPurpose: parsed.data.purpose ?? null,
    });
    return { ok: true, facilityId: facility.id };
  } catch (error) {
    return { ok: false, code: errorCode(error) };
  }
}

export async function grantConsentAction(): Promise<ActionResult> {
  try {
    await recordConsent({ key: "data_processing", grantedVia: "checkbox" });
    return { ok: true };
  } catch (error) {
    if (errorCode(error) === "consent_already_active") return { ok: true };
    return { ok: false, code: errorCode(error) };
  }
}

export async function submitApplicationAction(
  facilityId: unknown,
): Promise<ActionResult> {
  const parsed = FacilityIdInput.safeParse(facilityId);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    await submitMyFacility(parsed.data);
    return { ok: true };
  } catch (error) {
    return { ok: false, code: errorCode(error) };
  }
}

export async function cancelApplicationAction(
  facilityId: unknown,
): Promise<ActionResult> {
  const parsed = FacilityIdInput.safeParse(facilityId);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    await cancelMyFacility(parsed.data);
    return { ok: true };
  } catch (error) {
    return { ok: false, code: errorCode(error) };
  }
}
