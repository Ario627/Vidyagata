import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type InfoChipProps = {
  label: string;
  value: string;
  hint?: string;
  children?: ReactNode;
  className?: string;
};

function InfoChipBody({
  label,
  value,
  hint,
}: Omit<InfoChipProps, "className">) {
  return (
    <>
      <span className="text-2xs text-foreground-muted">{label}</span>
      <span className="text-sm font-semibold text-foreground tabular-nums">
        {value}
      </span>
      {hint === undefined ? null : (
        <span className="text-2xs text-foreground-muted">{hint}</span>
      )}
    </>
  );
}

function InfoChip({ label, value, hint, children, className }: InfoChipProps) {
  const base = cn(
    "rounded-lg border border-border bg-surface px-3 py-2.5 shadow-card",
    className,
  );

  if (children === undefined) {
    return (
      <div data-slot="info-chip" className={cn(base, "flex flex-col gap-0.5")}>
        <InfoChipBody label={label} value={value} hint={hint} />
      </div>
    );
  }

  return (
    <details data-slot="info-chip" className={cn(base, "group")}>
      <summary
        className={cn(
          "flex cursor-pointer list-none flex-col gap-0.5",
          "[&::-webkit-details-marker]:hidden",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        )}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="text-2xs text-foreground-muted">{label}</span>
          <ChevronDown
            aria-hidden="true"
            strokeWidth={2}
            className="size-3.5 shrink-0 text-foreground-subtle transition-transform duration-150 ease-out group-open:rotate-180 motion-reduce:transition-none"
          />
        </span>
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {value}
        </span>
        {hint === undefined ? null : (
          <span className="text-2xs text-foreground-muted">{hint}</span>
        )}
      </summary>
      <div className="mt-2.5 border-border border-t pt-2.5">{children}</div>
    </details>
  );
}

export { InfoChip };
export type { InfoChipProps };
