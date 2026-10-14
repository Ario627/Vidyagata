import type {
  TimelineStep,
  TimelineStepState,
} from "@/domain/financing/timeline";
import { formatInstantWib } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { STATUS_META } from "./labels";

type StatusTimelineProps = {
  readonly steps: readonly TimelineStep[];
};

const DOT_STYLES: Readonly<Record<TimelineStepState, string>> = {
  done: "bg-success",
  current: "bg-primary",
  upcoming: "border border-border-strong bg-surface",
  stopped: "bg-danger",
};

function StatusTimeline({ steps }: StatusTimelineProps) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const meta = STATUS_META[step.status];
        const isLast = index === steps.length - 1;
        const isUpcoming = step.state === "upcoming";
        return (
          <li
            key={step.status}
            aria-current={step.state === "current" ? "step" : undefined}
            className="flex gap-3"
          >
            <span className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1.5 size-2.5 shrink-0 rounded-full",
                  DOT_STYLES[step.state],
                )}
              />
              {isLast ? null : (
                <span aria-hidden="true" className="w-px flex-1 bg-border" />
              )}
            </span>
            <span
              className={cn("flex min-w-0 flex-col", isLast ? "pb-0" : "pb-4")}
            >
              <span
                className={cn(
                  "text-sm",
                  isUpcoming
                    ? "text-foreground-subtle"
                    : "font-medium text-foreground",
                )}
              >
                {meta.label}
              </span>
              {step.occurredAt === null ? null : (
                <span className="text-2xs text-foreground-subtle">
                  {formatInstantWib(step.occurredAt)}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export { StatusTimeline };
