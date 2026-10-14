"use client";

import { MoneyInput } from "@/components/financing/money-input";
import { FieldDescription, FieldLabel, FieldRoot } from "@/components/ui/field";
import type { LenderTerms } from "@/data/lenders";
import { formatIDR } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import { MAX_MONEY_AMOUNT } from "@/schemas/common";
import { ACADEMIC_PURPOSES, type AcademicPurpose } from "@/schemas/financing";
import { EstimatePanel } from "./estimate-panel";
import { PURPOSE_LABELS } from "./labels";

type StepAmountProps = {
  readonly amount: number | null;
  readonly onAmountChange: (value: number | null) => void;
  readonly purpose: AcademicPurpose | null;
  readonly onPurposeChange: (value: AcademicPurpose) => void;
  readonly terms: LenderTerms;
};

function StepAmount({
  amount,
  onAmountChange,
  purpose,
  onPurposeChange,
  terms,
}: StepAmountProps) {
  const showEstimate =
    amount !== null && amount > 0 && amount <= MAX_MONEY_AMOUNT;

  return (
    <div className="flex flex-col gap-5">
      <FieldRoot>
        <FieldLabel>Nominal pengajuan</FieldLabel>
        <MoneyInput
          value={amount}
          onValueChange={onAmountChange}
          placeholder="5.000.000"
        />
        <FieldDescription>
          Dana dikirim ke rekening kampus, bukan ke rekening pribadimu. Plafon
          pilot saat ini hingga {formatIDR(terms.maxAmount)}.
        </FieldDescription>
      </FieldRoot>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">Tujuan pembiayaan</p>
        <div
          role="radiogroup"
          aria-label="Tujuan pembiayaan"
          className="grid grid-cols-3 gap-2"
        >
          {ACADEMIC_PURPOSES.map((option) => (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-lg border px-2 py-2.5 text-center text-xs font-medium",
                "transition-colors duration-150 ease-out",
                purpose === option
                  ? "border-primary bg-primary-subtle text-primary-hover"
                  : "border-border bg-surface text-foreground-muted",
              )}
            >
              <input
                type="radio"
                name="purpose"
                value={option}
                checked={purpose === option}
                onChange={() => onPurposeChange(option)}
                className="sr-only"
              />
              {PURPOSE_LABELS[option]}
            </label>
          ))}
        </div>
        <p className="text-2xs text-foreground-subtle">
          Tujuan pembiayaan tercatat di pengajuanmu untuk kepatuhan penggunaan
          produktif.
        </p>
      </div>
      {showEstimate ? <EstimatePanel amount={amount} terms={terms} /> : null}
    </div>
  );
}

export { StepAmount };
