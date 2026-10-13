import type { Route } from "next";
import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/cara-kerja", label: "Cara Kerja" },
  { href: "/cek-kelayakan", label: "Cek Kelayakan" },
  { href: "/masuk", label: "Masuk" },
  { href: "/daftar", label: "Daftar" },
] as const;

const LEGAL_LINKS = [
  { href: "/legal/biaya", label: "Biaya" },
  { href: "/legal/kebijakan-privasi", label: "Kebijakan Privasi" },
  { href: "/legal/syarat-ketentuan", label: "Syarat & Ketentuan" },
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
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs leading-5 text-foreground-subtle">
            © 2026 Vidyagata.
          </p>
          <nav aria-label="Dokumen legal">
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {LEGAL_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href as Route}
                    className="text-xs text-foreground-subtle transition-colors duration-150 ease-out hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export { PublicFooter };
