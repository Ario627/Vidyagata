"use client";

import { Bell } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { initialsOf } from "@/components/app/profile-card";

type MobileTopbarProps = {
  readonly name: string;
};

const HIDDEN_ON = [
  "/dashboard",
  "/pembiayaan/ajukan",
  "/masuk/dua-faktor",
] as const;

function MobileTopbar({ name }: MobileTopbarProps) {
  const pathname = usePathname();
  if (HIDDEN_ON.some((path) => pathname === path)) return null;

  return (
    <header
      data-slot="mobile-topbar"
      className="sticky top-0 z-30 border-border border-b bg-background/90 pt-safe backdrop-blur-md print:hidden lg:hidden"
    >
      <div className="flex h-14 items-center justify-between gap-3 px-4">
        <Link
          href={"/dashboard" as Route}
          className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
          >
            V
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            vidyagata
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href={"/notifikasi" as Route}
            aria-label="Notifikasi"
            className="grid size-9 place-items-center rounded-lg text-foreground-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Bell
              aria-hidden="true"
              strokeWidth={1.8}
              className="size-[1.1rem]"
            />
          </Link>
          <Link
            href={"/profil" as Route}
            aria-label="Buka profil"
            className="grid size-8 place-items-center rounded-full bg-brand-100 text-2xs font-semibold text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {initialsOf(name)}
          </Link>
        </div>
      </div>
    </header>
  );
}

export { MobileTopbar };
