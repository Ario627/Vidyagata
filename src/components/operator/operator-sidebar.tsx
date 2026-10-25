"use client";

import {
  Banknote,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  ScrollText,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/(app)/session-actions";
import { isNavActive } from "@/components/app/nav-config";
import { initialsOf } from "@/components/app/profile-card";
import { cn } from "@/lib/utils";

type OperatorNavItem = {
  readonly href: Route;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly exact?: boolean;
};

const OPERATOR_NAV: readonly OperatorNavItem[] = [
  {
    href: "/operator" as Route,
    label: "Ringkasan",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/operator/antrian" as Route, label: "Antrian", icon: ClipboardList },
  { href: "/operator/pencairan" as Route, label: "Pencairan", icon: Wallet },
  {
    href: "/operator/pembayaran" as Route,
    label: "Pembayaran",
    icon: Banknote,
  },
  { href: "/operator/audit" as Route, label: "Audit", icon: ScrollText },
  {
    href: "/operator/keamanan" as Route,
    label: "Keamanan",
    icon: ShieldCheck,
  },
  { href: "/operator/profil" as Route, label: "Profil", icon: UserRound },
];

type OperatorSidebarProps = {
  readonly name: string;
  readonly email: string;
};

function OperatorSidebar({ name, email }: OperatorSidebarProps) {
  const pathname = usePathname();
  return (
    <aside
      data-slot="operator-sidebar"
      className="fixed inset-y-0 left-0 z-40 hidden w-[15.5rem] flex-col bg-sidebar print:hidden lg:flex"
    >
      <div className="flex h-16 items-center px-5">
        <Link
          href={"/operator" as Route}
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-lg bg-warning-600 text-sm font-bold text-ink-900"
          >
            V
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-semibold tracking-tight text-white">
              vidyagata
            </span>
            <span className="mt-1 text-[0.5625rem] font-medium uppercase tracking-[0.16em] text-sidebar-muted">
              Konsol operator
            </span>
          </span>
        </Link>
      </div>
      <nav
        aria-label="Navigasi operator"
        className="flex flex-col gap-1 px-3 pt-5"
      >
        <p className="px-3 pb-1 text-[0.5625rem] font-semibold uppercase tracking-[0.16em] text-sidebar-muted/70">
          Operasional
        </p>
        {OPERATOR_NAV.map((item) => {
          const active = isNavActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-out",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                active
                  ? "bg-white/10 text-white"
                  : "text-sidebar-muted hover:bg-white/5 hover:text-white",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-0 h-4 w-0.5 rounded-full bg-warning-500 transition-opacity duration-150 ease-out",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
              <item.icon
                aria-hidden="true"
                strokeWidth={1.8}
                className="size-4 shrink-0"
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-3 pb-4">
        <div className="flex items-center gap-2.5 rounded-xl border border-sidebar-line px-3 py-2.5">
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-warning-500/20 text-xs font-semibold text-warning-500"
          >
            {initialsOf(name)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs font-semibold text-white">
              {name}
            </span>
            <span className="truncate text-[0.625rem] text-sidebar-muted">
              {email}
            </span>
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              aria-label="Keluar dari akun operator"
              className="grid size-8 place-items-center rounded-lg text-sidebar-muted transition-colors duration-150 ease-out hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <LogOut aria-hidden="true" strokeWidth={1.8} className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

export { OperatorSidebar };
