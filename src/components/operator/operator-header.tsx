import type { Route } from "next";
import Link from "next/link";

const LINKS: readonly { readonly href: Route; readonly label: string }[] = [
  { href: "/operator" as Route, label: "Ringkasan" },
  { href: "/operator/antrian" as Route, label: "Antrian" },
  { href: "/operator/pencairan" as Route, label: "Pencairan" },
  { href: "/operator/keamanan" as Route, label: "Keamanan" },
  { href: "/operator/profil" as Route, label: "Profil" },
];

function OperatorHeader() {
  return (
    <header className="bg-header-gradient pb-4">
      <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-4 px-4 pt-6">
        <div className="flex flex-col">
          <span className="text-lg font-semibold tracking-tight text-primary-foreground">
            Vidyagata
          </span>
          <span className="text-2xs font-medium text-primary-foreground/80">
            Konsol operator
          </span>
        </div>
        <nav
          aria-label="Navigasi operator"
          className="flex min-w-0 items-center gap-0.5 overflow-x-auto"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2.5 py-2 text-sm font-medium whitespace-nowrap text-primary-foreground transition-opacity duration-150 ease-out hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export { OperatorHeader };
