import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";

type QuickAction<T extends string = string> = {
  readonly href: Route<T>;
  readonly label: string;
  readonly icon: LucideIcon;
};

type QuickActionsProps<T extends string> = {
  readonly actions: readonly QuickAction<T>[];
  readonly className?: string;
};

function QuickActions<T extends string>({
  actions,
  className,
}: QuickActionsProps<T>) {
  return (
    <ul
      data-slot="quick-actions"
      className={cn("grid grid-cols-4 gap-1", className)}
    >
      {actions.map((action) => (
        <li key={action.href}>
          <Link
            href={action.href}
            className="group flex flex-col items-center gap-2 rounded-lg py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-surface text-primary transition-transform duration-150 ease-out group-active:scale-[0.96] motion-reduce:transform-none">
              <action.icon
                aria-hidden="true"
                strokeWidth={1.8}
                className="size-5"
              />
            </span>
            <span className="min-h-8 text-balance text-center text-2xs font-medium text-primary-foreground leading-4">
              {action.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export { QuickActions };
export type { QuickAction, QuickActionsProps };