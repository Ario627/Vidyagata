import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-4 px-4 pt-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          Vidyagata
        </Link>
        <Link
          href="/cek-kelayakan"
          className="text-sm font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
        >
          Cek Kelayakan
        </Link>
      </header>
      <main className="flex flex-1 flex-col justify-center px-4 py-10">
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </main>
      <footer className="px-4 pb-10">
        <p className="mx-auto w-full max-w-sm text-xs leading-5 text-foreground-subtle">
          Nomor HP adalah identitas akun Vidyagata. Kode verifikasi berlaku
          sekali pakai dan jangan pernah dibagikan ke siapa pun, termasuk yang
          mengaku tim Vidyagata.
        </p>
      </footer>
    </div>
  );
}