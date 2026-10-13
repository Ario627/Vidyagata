"use client";

import type { InstitutionOption } from "@/data/institutions";
import { cn } from "@/lib/utils";

type StepInstitutionProps = {
  readonly options: readonly InstitutionOption[];
  readonly value: string | null;
  readonly onChange: (id: string) => void;
};

function StepInstitution({ options, value, onChange }: StepInstitutionProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">Pilih kampus tujuan pencairan</legend>
      <p className="text-sm font-medium text-foreground">
        Kampus tujuan pencairan
      </p>
      <p className="text-xs text-foreground-muted">
        Dana pembiayaan dikirim langsung ke rekening kampus ini — bukan ke
        rekening pribadimu.
      </p>
      <div className="mt-1 flex flex-col gap-2">
        {options.map((option) => (
          <label
            key={option.id}
            className={cn(
              "flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-surface px-4 py-3",
              "transition-colors duration-150 ease-out",
              value === option.id
                ? "border-primary bg-primary-subtle"
                : "border-border",
            )}
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {option.name}
              </span>
              <span className="text-xs text-foreground-muted">
                {option.city}, {option.province}
              </span>
            </span>
            <input
              type="radio"
              name="institution"
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="size-4 shrink-0 accent-primary"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export { StepInstitution };