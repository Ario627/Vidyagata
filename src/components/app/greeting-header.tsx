import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

function HeaderSearch() {
  return (
    <search className="flex-1">
      <form action="/kerja" method="get">
        <label htmlFor="header-search" className="sr-only">
          Cari lowongan kerja part-time
        </label>
        <input
          id="header-search"
          type="search"
          name="q"
          placeholder="Cari apa hari ini?"
          autoComplete="off"
          enterKeyHint="search"
          className={cn(
            "h-11 w-full rounded-full border border-transparent bg-surface px-4 text-sm text-foreground",
            "placeholder:text-foreground-subtle",
            "focus-visible:border-primary focus-visible:outline-primary-foreground",
          )}
        />
      </form>
    </search>
  );
}

type GreetingHeaderProps = ComponentProps<"header"> & {
  title: string;
  avatar: ReactNode;
};

function GreetingHeader({
  title,
  avatar,
  children,
  className,
  ...props
}: GreetingHeaderProps) {
  return (
    <header
      data-slot="greeting-header"
      className={cn("bg-header-gradient rounded-b-3xl px-4 pt-safe", className)}
      {...props}
    >
      <div className="flex items-center gap-3 pt-3">
        <HeaderSearch />
        {avatar}
      </div>
      <h1 className="mt-4 text-xl font-semibold text-primary-foreground">
        {title}
      </h1>
      {children}
    </header>
  );
}

export { GreetingHeader };
export type { GreetingHeaderProps };