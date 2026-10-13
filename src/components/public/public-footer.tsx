import type { Route } from "next";
import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/cara-kerja", label: "Cara Kerja" },
  { href: "/cek-kelayakan", label: "Cek Kelayakan" },
  { href: "/masuk", label: "Masuk" },
  { href: "/daftar", label: "Daftar" },
] as const;

function PublicFooter() {
  return (
    <footer data-slot="public-footer" className="border-border border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-sm">
          <p className="text-base font-semibold tracking-tight text-foreground">
            Vidyagata
          </p>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Pembiayaan pendidikan yang tersambung ke kerja part-time. Cicilan
            diambil dari penghasilan, transparan sejak awal.
          </p>
        </div>
        <nav aria-label="Halaman publik">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href as Route}
                  className="text-sm text-foreground-muted transition-colors duration-150 ease-out hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-border border-t">
        <p className="mx-auto w-full max-w-5xl px-4 py-4 text-xs leading-5 text-foreground-subtle sm:px-6">
          © 2026 Vidyagata.
        </p>
      </div>
    </footer>
  );
}

export { PublicFooter };
