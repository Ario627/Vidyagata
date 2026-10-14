"use server";

import { z } from "zod";
import {
  type ApplicationResult,
  applyToJob,
  withdrawApplication,
} from "@/data/applications";

const PostingIdInput = z.ulid();
const ApplicationIdInput = z.ulid();
const NoteInput = z.string().trim().max(500);

export async function applyToJobAction(
  input: unknown,
): Promise<ApplicationResult> {
  const parsed = z
    .object({ postingId: PostingIdInput, note: NoteInput.optional() })
    .strict()
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  return applyToJob(parsed.data);
}

export async function withdrawApplicationAction(
  applicationId: unknown,
): Promise<ApplicationResult> {
  const parsed = ApplicationIdInput.safeParse(applicationId);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  return withdrawApplication(parsed.data);
}
