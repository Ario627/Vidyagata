import { cn } from "@/lib/utils";

type Stage = {
  readonly title: string;
  readonly body: string;
};

type StageItemProps = {
  readonly index: number;
  readonly stage: Stage;
  readonly last: boolean;
};

function StageItem({ index, stage, last }: StageItemProps) {
  return (
    <li className="relative flex gap-4 pb-8 last:pb-0">
      {last ? null : (
        <span
          aria-hidden="true"
          className="absolute top-7 bottom-0 left-3 w-px bg-border"
        />
      )}
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-border-strong bg-surface text-2xs font-semibold text-foreground-muted tabular-nums">
        {index + 1}
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          {stage.title}
        </h3>
        <p className="mt-1.5 text-sm leading-6 text-foreground-muted">
          {stage.body}
        </p>
      </div>
    </li>
  );
}

function StageList({
  stages,
  className,
}: {
  stages: readonly Stage[];
  className?: string;
}) {
  return (
    <ol className={cn(className)}>
      {stages.map((stage, index) => (
        <StageItem
          key={stage.title}
          index={index}
          stage={stage}
          last={index === stages.length - 1}
        />
      ))}
    </ol>
  );
}

export { StageList };
export type { Stage };
