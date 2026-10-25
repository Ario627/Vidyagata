import type { Route } from "next";
import Link from "next/link";

const LINKS: readonly { readonly href: Route; readonly label: string }[] = [
  { href: "/operator" as Route, label: "Ringkasan" },
  { href: "/operator/antrian" as Route, label: "Antrian" },
  { href: "/operator/pencairan" as Route, label: "Pencairan" },
  { href: "/operator/pembayaran" as Route, label: "Pembayaran" },
  { href: "/operator/audit" as Route, label: "Audit" },
  { href: "/operator/keamanan" as Route, label: "Keamanan" },
  { href: "/operator/profil" as Route, label: "Profil" },
];

function OperatorHeader() {
  return (
    <header
      data-slot="operator-header"
      className="sticky top-0 z-30 bg-sidebar pt-safe print:hidden lg:hidden"
    >
      <div className="flex items-center justify-between gap-4 px-4 pt-3">
        <Link href={"/operator" as Route} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-md bg-warning-600 text-xs font-bold text-ink-900"
          >
            V
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight text-white">
              vidyagata
            </span>
            <span className="mt-0.5 text-[0.5rem] font-medium uppercase tracking-[0.16em] text-sidebar-muted">
              Konsol operator
            </span>
          </span>
        </Link>
        <span className="rounded-md bg-warning-500/15 px-2 py-1 text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-warning-500">
          Internal
        </span>
      </div>
      <nav
        aria-label="Navigasi operator"
        className="no-scrollbar mt-2 flex items-center gap-0.5 overflow-x-auto px-2 pb-2"
      >
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md px-2.5 py-2 text-xs font-medium whitespace-nowrap text-sidebar-muted transition-colors duration-150 ease-out hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export { OperatorHeader };
