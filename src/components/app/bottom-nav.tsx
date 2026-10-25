"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive, MOBILE_NAV_ITEMS } from "@/components/app/nav-config";
import { cn } from "@/lib/utils";

function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      data-slot="bottom-nav"
      aria-label="Navigasi utama"
      className={cn(
        "sticky bottom-0 z-40 border-border border-t bg-surface/95 pb-safe backdrop-blur-md print:hidden",
        className,
      )}
    >
      <ul className="mx-auto flex max-w-lg items-stretch px-1">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[3.75rem] flex-col items-center justify-center gap-1 rounded-lg px-1 pt-1.5 pb-1",
                  "transition-colors duration-150 ease-out",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                  active ? "text-primary" : "text-foreground-subtle",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-12 place-items-center rounded-full transition-colors duration-150 ease-out",
                    active ? "bg-brand-50" : "bg-transparent",
                  )}
                >
                  <item.icon
                    aria-hidden="true"
                    strokeWidth={active ? 2.1 : 1.7}
                    className="size-[1.15rem] shrink-0"
                  />
                </span>
                <span
                  className={cn(
                    "text-[0.625rem] leading-3 tracking-tight",
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

export { BottomNav };
