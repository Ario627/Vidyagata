"use client";

import type { ConsentDefinition } from "@/data/consents";
import type { LenderTerms } from "@/data/lenders";
import { rupiah } from "@/domain/money/money";
import { formatIDR } from "@/lib/format/currency";
import type { AcademicPurpose } from "@/schemas/financing";
import { ConsentSheet } from "./consent-sheet";
import { EstimatePanel } from "./estimate-panel";
import { PURPOSE_LABELS } from "./labels";

type StepReviewProps = {
  readonly institutionName: string;
  readonly amount: number;
  readonly purpose: AcademicPurpose | null;
  readonly terms: LenderTerms;
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

function StepReview({
  institutionName,
  amount,
  purpose,
  terms,
  consent,
  consentGranted,
  consentChecked,
  onConsentChange,
}: StepReviewProps) {
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
      <p className="text-2xs leading-4 text-foreground-subtle">
        Setelah dikirim, pengajuanmu ditinjau operator sebelum diteruskan ke
        mitra pembiayaan. Kamu bisa membatalkan selama belum dicairkan.
      </p>
    </div>
  );
}

export { StepReview };