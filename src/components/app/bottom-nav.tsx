"use client";

import {
  Briefcase,
  House,
  type LucideIcon,
  ReceiptText,
  UserRound,
  Wallet,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  readonly href: Route;
  readonly label: string;
  readonly icon: LucideIcon;
};

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard" as Route, label: "Beranda", icon: House },
  { href: "/pembiayaan" as Route, label: "Pembiayaan", icon: Wallet },
  { href: "/kerja", label: "Kerja", icon: Briefcase },
  { href: "/tagihan", label: "Tagihan", icon: ReceiptText },
  { href: "/profil", label: "Profil", icon: UserRound },
];

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      data-slot="bottom-nav"
      aria-label="Navigasi utama"
      className={cn(
        "sticky bottom-0 z-40 border-border border-t bg-surface pb-safe print:hidden",
        className,
      )}
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 px-1 pt-1.5",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                  active ? "text-primary" : "text-foreground-muted",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-0.5 w-8 rounded-full",
                    active ? "bg-primary" : "bg-transparent",
                  )}
                />
                <item.icon
                  aria-hidden="true"
                  strokeWidth={active ? 2.2 : 1.8}
                  className="size-5 shrink-0"
                />
                <span
                  className={cn(
                    "text-2xs leading-3",
                    active ? "font-semibold" : "font-medium",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { BottomNav, isActivePath };
