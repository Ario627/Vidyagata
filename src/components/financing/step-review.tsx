"use client";

import type { UploadedDocument } from "@/components/account/document-upload";
import { DocumentUpload } from "@/components/account/document-upload";
import type { ConsentDefinition } from "@/data/consents";
import type { LenderTerms } from "@/data/lenders";
import { rupiah } from "@/domain/money/money";
import { formatIDR } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import type { AcademicPurpose } from "@/schemas/financing";
import { ConsentSheet } from "./consent-sheet";
import { EstimatePanel } from "./estimate-panel";
import {
  PURPOSE_LABELS,
  PURPOSE_NOTE_PLACEHOLDER,
  PURPOSE_PROOF_GUIDANCE,
} from "./labels";

export const PURPOSE_NOTE_MIN_LENGTH = 40;

type StepReviewProps = {
  readonly institutionName: string;
  readonly amount: number;
  readonly purpose: AcademicPurpose | null;
  readonly terms: LenderTerms;
  readonly purposeNote: string;
  readonly onPurposeNoteChange: (value: string) => void;
  readonly proofDocument: UploadedDocument | null;
  readonly onProofUploaded: (document: UploadedDocument) => void;
  readonly consent: ConsentDefinition;
  readonly consentGranted: boolean;
  readonly consentChecked: boolean;
  readonly onConsentChange: (checked: boolean) => void;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-sm text-foreground-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

function RequirementRow({
  done,
  label,
}: {
  readonly done: boolean;
  readonly label: string;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
          done
            ? "border-success-600 bg-success-600 text-surface"
            : "border-border-strong text-transparent",
        )}
      >
        ✓
      </span>
      <span
        className={cn(
          "text-sm leading-5",
          done ? "text-foreground" : "text-foreground-muted",
        )}
      >
        {label}
      </span>
    </li>
  );
}

function StepReview({
  institutionName,
  amount,
  purpose,
  terms,
  purposeNote,
  onPurposeNoteChange,
  proofDocument,
  onProofUploaded,
  consent,
  consentGranted,
  consentChecked,
  onConsentChange,
}: StepReviewProps) {
  const noteReady = purposeNote.trim().length >= PURPOSE_NOTE_MIN_LENGTH;
  const proofReady = proofDocument !== null;
  const consentReady = consentGranted || consentChecked;
  return (
    <div className="flex flex-col gap-4">
      <dl className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface px-4">
        <SummaryRow label="Kampus tujuan" value={institutionName} />
        <SummaryRow
          label="Nominal pengajuan"
          value={formatIDR(rupiah(amount))}
        />
        <SummaryRow
          label="Tujuan"
          value={purpose === null ? "—" : PURPOSE_LABELS[purpose]}
        />
      </dl>
      <label className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-4">
        <span className="text-sm font-semibold text-foreground">
          Rencana penggunaan dana
        </span>
        <span className="text-xs leading-5 text-foreground-muted">
          Tulis dengan spesifik: untuk apa dananya, berapa peruntukannya, dan
          apa yang kamu lampirkan. Petugas memakai ini untuk menilai
          pengajuanmu.
        </span>
        <textarea
          rows={4}
          value={purposeNote}
          onChange={(event) => onPurposeNoteChange(event.target.value)}
          maxLength={600}
          placeholder={
            purpose === null ? undefined : PURPOSE_NOTE_PLACEHOLDER[purpose]
          }
          className="mt-1 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm leading-6 text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <span className="text-2xs leading-4 text-foreground-subtle">
          {purposeNote.trim().length}/{PURPOSE_NOTE_MIN_LENGTH} karakter minimal
          · maksimal 600
        </span>
      </label>
      <div className="flex flex-col gap-2">
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <p className="text-xs font-semibold text-foreground">
            Panduan bukti untuk tujuan ini
          </p>
          <p className="mt-1.5 text-sm leading-6 text-foreground-muted">
            {purpose === null
              ? "Pilih tujuan pembiayaan dulu di langkah sebelumnya."
              : PURPOSE_PROOF_GUIDANCE[purpose]}
          </p>
        </div>
        <DocumentUpload
          kind="purpose_proof"
          label="Dokumen bukti penggunaan dana"
          hint={
            purpose === null
              ? "Unggah dokumen pendukung sesuai tujuan pembiayaan."
              : PURPOSE_PROOF_GUIDANCE[purpose]
          }
          allowPdf
          current={proofDocument}
          onUploaded={onProofUploaded}
        />
      </div>
      <EstimatePanel amount={amount} terms={terms} />
      <div className="rounded-xl border border-border bg-surface p-4">
        {consentGranted ? (
          <p className="text-sm text-foreground-muted">
            Persetujuan pemrosesan data sudah tercatat sebelumnya.
          </p>
        ) : (
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(event) => onConsentChange(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span className="text-sm leading-6 text-foreground">
              Saya menyetujui{" "}
              <span className="font-medium">{consent.title}</span> versi{" "}
              {consent.version} untuk pengajuan ini.
            </span>
          </label>
        )}
        <div className="mt-3 border-border border-t pt-3">
          <ConsentSheet consent={consent} />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-sm font-semibold text-foreground">
          Sebelum bisa dikirim
        </p>
        <ul className="mt-3 flex flex-col gap-2.5">
          <RequirementRow
            done={noteReady}
            label={`Rencana penggunaan dana terisi (minimal ${PURPOSE_NOTE_MIN_LENGTH} karakter)`}
          />
          <RequirementRow
            done={proofReady}
            label="Dokumen bukti penggunaan dana terunggah"
          />
          <RequirementRow
            done={consentReady}
            label="Persetujuan pemrosesan data dicentang"
          />
        </ul>
      </div>
      <p className="text-2xs leading-4 text-foreground-subtle">
        Setelah dikirim, pengajuanmu ditinjau operator sebelum diteruskan ke
        mitra pembiayaan. Kamu bisa membatalkan selama belum dicairkan.
      </p>
    </div>
  );
}

export { StepReview };
