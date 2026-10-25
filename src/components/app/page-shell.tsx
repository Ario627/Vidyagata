import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  readonly title: string;
  readonly description?: string;
  readonly eyebrow?: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
};

function PageShell({
  title,
  description,
  eyebrow,
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <main
      data-slot="page-shell"
      className={cn(
        "mx-auto w-full max-w-[76rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:max-w-none print:p-0",
        className,
      )}
    >
      <header className="flex flex-col gap-4 border-border border-b pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8 print:hidden lg:pb-6">
        <div className="flex min-w-0 flex-col">
          {eyebrow === undefined ? null : (
            <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-primary">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground lg:text-[1.75rem]">
            {title}
          </h1>
          {description === undefined ? null : (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-muted">
              {description}
            </p>
          )}
        </div>
        {actions === undefined ? null : (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </header>
      <div className="mt-6 print:mt-0">{children}</div>
    </main>
  );
}

export { PageShell };
export type { PageShellProps };
