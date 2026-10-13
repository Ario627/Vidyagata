import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = Omit<ComponentProps<"div">, "title" | "children"> & {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center gap-3 px-6 py-10 text-center",
        className,
      )}
      {...props}
    >
      {Icon === undefined ? null : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-raised">
          <Icon
            aria-hidden="true"
            strokeWidth={1.8}
            className="size-5 text-foreground-muted"
          />
        </span>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {description === undefined ? null : (
          <p className="max-w-sm text-sm text-foreground-muted">
            {description}
          </p>
        )}
      </div>
      {action === undefined ? null : (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
