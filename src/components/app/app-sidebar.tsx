"use client";

import { LogOut, MessageCircle, Sparkles } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/(app)/session-actions";
import { APP_NAV_GROUPS, isNavActive } from "@/components/app/nav-config";
import { initialsOf } from "@/components/app/profile-card";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  readonly name: string;
  readonly email: string;
};

function BrandLockup() {
  return (
    <Link
      href={"/dashboard" as Route}
      className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
    >
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-lg bg-brand-500 text-sm font-bold text-white"
      >
        V
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-semibold tracking-tight text-white">
          vidyagata
        </span>
        <span className="mt-1 text-[0.5625rem] font-medium uppercase tracking-[0.16em] text-sidebar-muted">
          Ruang mahasiswa
        </span>
      </span>
    </Link>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  readonly href: Route;
  readonly label: string;
  readonly icon: typeof Sparkles;
  readonly active: boolean;
}) {
  return (
    <Link
      href={href}
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
          "absolute left-0 h-4 w-0.5 rounded-full bg-brand-300 transition-opacity duration-150 ease-out",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <Icon aria-hidden="true" strokeWidth={1.8} className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
      {active ? (
        <span
          aria-hidden="true"
          className="ml-auto size-1.5 rounded-full bg-brand-300"
        />
      ) : null}
    </Link>
  );
}

function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi utama" className="flex flex-col gap-5 px-3 pt-5">
      {APP_NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[0.5625rem] font-semibold uppercase tracking-[0.16em] text-sidebar-muted/70">
            {group.label}
          </p>
          {group.items.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isNavActive(pathname, item)}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

function AppSidebar({ name, email }: AppSidebarProps) {
  return (
    <aside
      data-slot="app-sidebar"
      className="fixed inset-y-0 left-0 z-40 hidden w-[15.5rem] flex-col bg-sidebar print:hidden lg:flex"
    >
      <div className="flex h-16 items-center px-5">
        <BrandLockup />
      </div>
      <SidebarNav />
      <div className="mt-auto flex flex-col gap-3 px-3 pb-4">
        <Link
          href={"/mbak-vidya" as Route}
          className="group flex flex-col gap-1 rounded-xl border border-sidebar-line bg-sidebar-raised p-3.5 transition-colors duration-150 ease-out hover:border-sidebar-muted/40"
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-white">
            <Sparkles
              aria-hidden="true"
              strokeWidth={1.8}
              className="size-3.5 text-brand-300"
            />
            Mbak Vidya
          </span>
          <span className="text-2xs leading-4 text-sidebar-muted">
            Tanya soal cicilan, kelayakan, atau kerja part-time.
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-2xs font-medium text-white/80">
            <MessageCircle
              aria-hidden="true"
              strokeWidth={1.8}
              className="size-3"
            />
            Mulai percakapan
          </span>
        </Link>
        <div className="flex items-center gap-2.5 rounded-xl border border-sidebar-line px-3 py-2.5">
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white"
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
              aria-label="Keluar dari akun"
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

export { AppSidebar };
export type { AppSidebarProps };
