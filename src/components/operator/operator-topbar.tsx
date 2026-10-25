"use client";

import { usePathname } from "next/navigation";
import { initialsOf } from "@/components/app/profile-card";

const OPERATOR_TITLES: readonly { pattern: string; title: string }[] = [
  { pattern: "/operator/antrian", title: "Antrian pengajuan" },
  { pattern: "/operator/pencairan", title: "Pencairan" },
  { pattern: "/operator/pembayaran", title: "Pembayaran" },
  { pattern: "/operator/audit", title: "Jejak audit" },
  { pattern: "/operator/keamanan", title: "Keamanan" },
  { pattern: "/operator/profil", title: "Profil" },
  { pattern: "/operator", title: "Ringkasan" },
];

function OperatorTopbar({ name }: { readonly name: string }) {
  const pathname = usePathname();
  const title =
    OPERATOR_TITLES.find(
      (entry) =>
        pathname === entry.pattern || pathname.startsWith(`${entry.pattern}/`),
    )?.title ?? "Konsol operator";

  return (
    <header
      data-slot="operator-topbar"
      className="sticky top-0 z-30 hidden h-16 border-border border-b bg-background/85 backdrop-blur-md print:hidden lg:block"
    >
      <div className="mx-auto flex h-full w-full max-w-[76rem] items-center justify-between gap-6 px-8">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xs font-medium uppercase tracking-[0.14em] text-foreground-subtle">
            Konsol operator
          </span>
          <span aria-hidden="true" className="text-foreground-subtle">
            /
          </span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="rounded-md bg-warning-soft px-2 py-1 text-2xs font-semibold uppercase tracking-[0.1em] text-warning">
            Internal
          </span>
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-full bg-ink-900 text-xs font-semibold text-white"
          >
            {initialsOf(name)}
          </span>
        </div>
      </div>
    </header>
  );
}

export { OperatorTopbar };
