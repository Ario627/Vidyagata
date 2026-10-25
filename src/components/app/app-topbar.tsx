"use client";

import { Bell, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { pageMetaOf } from "@/components/app/nav-config";
import { initialsOf } from "@/components/app/profile-card";

type AppTopbarProps = {
  readonly name: string;
};

function TopbarSearch() {
  return (
    <search className="relative hidden w-64 xl:block">
      <form action="/kerja" method="get">
        <label htmlFor="topbar-search" className="sr-only">
          Cari lowongan
        </label>
        <Search
          aria-hidden="true"
          strokeWidth={1.8}
          className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-foreground-subtle"
        />
        <input
          id="topbar-search"
          type="search"
          name="q"
          placeholder="Cari lowongan, posisi, skill"
          autoComplete="off"
          className="h-9 w-full rounded-lg border border-border bg-surface pr-3 pl-9 text-xs text-foreground placeholder:text-foreground-subtle focus-visible:border-primary focus-visible:outline-none"
        />
      </form>
    </search>
  );
}

function AppTopbar({ name }: AppTopbarProps) {
  const pathname = usePathname();
  const meta = pageMetaOf(pathname);

  return (
    <header
      data-slot="app-topbar"
      className="sticky top-0 z-30 hidden h-16 border-border border-b bg-background/85 backdrop-blur-md print:hidden lg:block"
    >
      <div className="mx-auto flex h-full w-full max-w-[76rem] items-center justify-between gap-6 px-8">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <span className="text-2xs font-medium uppercase tracking-[0.14em] text-foreground-subtle">
            {meta.section}
          </span>
          <span aria-hidden="true" className="text-foreground-subtle">
            /
          </span>
          <span className="truncate text-sm font-semibold text-foreground">
            {meta.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TopbarSearch />
          <Link
            href={"/notifikasi" as Route}
            aria-label="Notifikasi"
            className="grid size-9 place-items-center rounded-lg text-foreground-muted transition-colors duration-150 ease-out hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Bell aria-hidden="true" strokeWidth={1.8} className="size-4" />
          </Link>
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
          <Link
            href={"/profil" as Route}
            aria-label="Buka profil"
            className="flex items-center gap-2.5 rounded-lg py-1 pr-2 pl-1 transition-colors duration-150 ease-out hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
              {initialsOf(name)}
            </span>
            <span className="max-w-28 truncate text-xs font-medium text-foreground">
              {name}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export { AppTopbar };
