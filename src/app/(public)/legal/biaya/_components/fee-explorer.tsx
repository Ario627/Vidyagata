"use client";

import {
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type FeeItem = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly emphasis?: boolean;
  readonly paragraphs: readonly string[];
  readonly items?: readonly string[];
};

function FeeRow({ item }: { item: FeeItem }) {
  return (
    <li>
      <DialogRoot>
        <DialogTrigger
          className={cn(
            "flex w-full items-baseline justify-between gap-4 px-4 py-3.5 text-left sm:px-5",
            "transition-colors duration-150 ease-out hover:bg-surface-raised",
            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
          )}
        >
          <span
            className={cn(
              "underline decoration-border-strong decoration-dotted underline-offset-4",
              item.emphasis
                ? "text-sm font-medium text-foreground"
                : "text-sm text-foreground-muted",
            )}
          >
            {item.label}
          </span>
          <span
            className={cn(
              "shrink-0 tabular-nums",
              item.emphasis
                ? "text-base font-semibold text-foreground"
                : "text-sm font-medium text-foreground",
            )}
          >
            {item.value}
          </span>
        </DialogTrigger>
        <DialogContent>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle>{item.label}</DialogTitle>
            <DialogClose />
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {item.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-sm leading-6 text-foreground-muted"
              >
                {paragraph}
              </p>
            ))}
          </div>
          {item.items === undefined ? null : (
            <ul className="mt-3 flex flex-col gap-2">
              {item.items.map((detail) => (
                <li
                  key={detail}
                  className="flex gap-2.5 text-sm leading-6 text-foreground"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary"
                  />
                  {detail}
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </DialogRoot>
    </li>
  );
}

function FeeExplorer({ items }: { items: readonly FeeItem[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-card">
      <div className="border-border border-b px-4 py-3 sm:px-5">
        <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-subtle">
          Rincian biaya — ketuk baris untuk penjelasan
        </p>
      </div>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <FeeRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

export { FeeExplorer };
export type { FeeItem };
