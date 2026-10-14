import { cn } from "@/lib/utils";

type OnboardingProgressProps = {
  readonly current: number;
  readonly total: number;
  readonly label: string;
};

function OnboardingProgress({
  current,
  total,
  label,
}: OnboardingProgressProps) {
  const segments = Array.from({ length: total }, (_, index) => index);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-subtle">
          Langkah {current} dari {total}
        </p>
        <p className="text-2xs text-foreground-subtle">{label}</p>
      </div>
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {segments.map((index) => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full",
              index < current ? "bg-primary" : "bg-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export { OnboardingProgress };
