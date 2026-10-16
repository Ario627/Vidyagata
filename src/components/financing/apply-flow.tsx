"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  grantConsentAction,
  saveDraftAction,
  submitApplicationAction,
} from "@/app/(app)/pembiayaan/actions";
import type { UploadedDocument } from "@/components/account/document-upload";
import { Button } from "@/components/ui/button";
import type { ConsentDefinition } from "@/data/consents";
import type { InstitutionOption } from "@/data/institutions";
import type { LenderTerms } from "@/data/lenders";
import { cn } from "@/lib/utils";
import { type AcademicPurpose, RequestedAmount } from "@/schemas/financing";
import { StepAmount } from "./step-amount";
import { StepInstitution } from "./step-institution";
import { PURPOSE_NOTE_MIN_LENGTH, StepReview } from "./step-review";

export type ApplyDraftSeed = {
  readonly facilityId: string;
  readonly institutionId: string | null;
  readonly requestedAmount: number | null;
  readonly purpose: AcademicPurpose | null;
  readonly purposeNote: string | null;
};

type ApplyFlowProps = {
  readonly institutions: readonly InstitutionOption[];
  readonly terms: LenderTerms;
  readonly consent: ConsentDefinition;
  readonly consentGranted: boolean;
  readonly draft: ApplyDraftSeed | null;
  readonly proofDocument: UploadedDocument | null;
};

const STEPS = ["Kampus", "Nominal", "Tinjau"] as const;
type StepIndex = 0 | 1 | 2;

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  invalid_input: "Periksa kembali isianmu.",
  unauthenticated: "Sesi kamu berakhir. Masuk lagi untuk melanjutkan.",
  student_profile_required: "Lengkapi profil dan data akademikmu dulu.",
  facility_incomplete: "Masih ada data yang belum lengkap.",
  consent_required: "Setujui pemrosesan data untuk mengirim pengajuan.",
  purpose_note_required:
    "Rencana penggunaan dana belum terisi — minimal 40 karakter.",
  proof_required:
    "Dokumen bukti penggunaan dana belum terunggah. Unggah dulu sebelum mengirim.",
  active_facility_exists: "Kamu masih punya pengajuan yang berjalan.",
  invalid_transition: "Pengajuan ini sudah tidak bisa diubah.",
  facility_not_found: "Pengajuan tidak ditemukan.",
  institution_not_found: "Kampus yang dipilih tidak ditemukan.",
};

function messageFor(code: string): string {
  return (
    ERROR_MESSAGES[code] ??
    "Ada gangguan di sisi kami. Coba lagi sebentar lagi."
  );
}

function initialStepOf(draft: ApplyDraftSeed | null): StepIndex {
  if (draft === null || draft.institutionId === null) return 0;
  if (draft.requestedAmount !== null && draft.purpose !== null) return 2;
  return 1;
}

function ApplyFlow({
  institutions,
  terms,
  consent,
  consentGranted,
  draft,
  proofDocument: initialProof,
}: ApplyFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<StepIndex>(() => initialStepOf(draft));
  const [facilityId, setFacilityId] = useState<string | null>(
    draft?.facilityId ?? null,
  );
  const [institutionId, setInstitutionId] = useState<string | null>(
    draft?.institutionId ?? null,
  );
  const [amount, setAmount] = useState<number | null>(
    draft?.requestedAmount ?? null,
  );
  const [purpose, setPurpose] = useState<AcademicPurpose | null>(
    draft?.purpose ?? null,
  );
  const [purposeNote, setPurposeNote] = useState<string>(
    draft?.purposeNote ?? "",
  );
  const [proofDocument, setProofDocument] = useState<UploadedDocument | null>(
    initialProof,
  );
  const [consentChecked, setConsentChecked] = useState(consentGranted);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "submit" | null>(null);

  async function persist(input: {
    readonly institutionId?: string;
    readonly requestedAmount?: number;
    readonly purpose?: AcademicPurpose;
    readonly purposeNote?: string;
  }): Promise<boolean> {
    const result = await saveDraftAction(input);
    if (result.ok) {
      setFacilityId(result.facilityId);
      return true;
    }
    setError(messageFor(result.code));
    return false;
  }

  async function goToAmount() {
    if (institutionId === null) {
      setError("Pilih kampus tujuan dulu.");
      return;
    }
    setError(null);
    setBusy("save");
    const saved = await persist({ institutionId });
    setBusy(null);
    if (saved) setStep(1);
  }

  async function goToReview() {
    if (amount === null) {
      setError("Isi nominal pengajuan dulu.");
      return;
    }
    const parsed = RequestedAmount.safeParse(amount);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Nominal tidak valid.");
      return;
    }
    if (purpose === null) {
      setError("Pilih tujuan pembiayaan dulu.");
      return;
    }
    setError(null);
    setBusy("save");
    const saved = await persist({
      requestedAmount: amount,
      purpose,
    });
    setBusy(null);
    if (saved) setStep(2);
  }

  async function submit() {
    if (facilityId === null) {
      setError("Isi langkah sebelumnya dulu.");
      return;
    }
    if (purposeNote.trim().length < PURPOSE_NOTE_MIN_LENGTH) {
      setError(
        `Rencana penggunaan dana belum lengkap — tulis minimal ${PURPOSE_NOTE_MIN_LENGTH} karakter.`,
      );
      return;
    }
    if (proofDocument === null) {
      setError(
        "Unggah dulu dokumen bukti penggunaan dana sebelum mengirim pengajuan.",
      );
      return;
    }
    if (!consentGranted && !consentChecked) {
      setError("Centang persetujuan dulu sebelum mengirim.");
      return;
    }
    setError(null);
    setBusy("submit");
    const savedNote = await persist({ purposeNote: purposeNote.trim() });
    if (!savedNote) {
      setBusy(null);
      return;
    }
    if (!consentGranted) {
      const consentResult = await grantConsentAction();
      if (!consentResult.ok) {
        setBusy(null);
        setError(messageFor(consentResult.code));
        return;
      }
    }
    const result = await submitApplicationAction(facilityId);
    setBusy(null);
    if (result.ok) {
      router.push("/pembiayaan" as Route);
      return;
    }
    if (result.code === "unauthenticated") {
      router.push("/masuk" as Route);
      return;
    }
    setError(messageFor(result.code));
  }

  function handlePrimary() {
    if (step === 0) void goToAmount();
    else if (step === 1) void goToReview();
    else void submit();
  }

  function handleBack() {
    setError(null);
    setStep((current) => (current === 0 ? 0 : ((current - 1) as StepIndex)));
  }

  const institutionName =
    institutions.find((institution) => institution.id === institutionId)
      ?.name ?? "—";

  return (
    <div className="mt-6 flex flex-col gap-5">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-subtle">
          Langkah {step + 1} dari {STEPS.length} · {STEPS[step]}
        </p>
        <div aria-hidden="true" className="mt-2 flex gap-1.5">
          {STEPS.map((label, index) => (
            <span
              key={label}
              className={cn(
                "h-1 flex-1 rounded-full",
                index <= step ? "bg-primary" : "bg-ink-200",
              )}
            />
          ))}
        </div>
      </div>
      {step === 0 ? (
        <StepInstitution
          options={institutions}
          value={institutionId}
          onChange={setInstitutionId}
        />
      ) : null}
      {step === 1 ? (
        <StepAmount
          amount={amount}
          onAmountChange={setAmount}
          purpose={purpose}
          onPurposeChange={setPurpose}
          terms={terms}
        />
      ) : null}
      {step === 2 ? (
        <StepReview
          institutionName={institutionName}
          amount={amount ?? 0}
          purpose={purpose}
          terms={terms}
          purposeNote={purposeNote}
          onPurposeNoteChange={setPurposeNote}
          proofDocument={proofDocument}
          onProofUploaded={setProofDocument}
          consent={consent}
          consentGranted={consentGranted}
          consentChecked={consentChecked}
          onConsentChange={setConsentChecked}
        />
      ) : null}
      {error === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        {step === 0 ? null : (
          <Button
            variant="ghost"
            size="lg"
            onClick={handleBack}
            disabled={busy !== null}
          >
            Kembali
          </Button>
        )}
        <Button
          size="lg"
          className="flex-1"
          onClick={handlePrimary}
          disabled={busy !== null}
        >
          {busy === "save"
            ? "Menyimpan..."
            : busy === "submit"
              ? "Mengirim..."
              : step === 2
                ? "Kirim pengajuan"
                : "Lanjut"}
        </Button>
      </div>
    </div>
  );
}

export { ApplyFlow };
