import Link from "next/link";
import { Mascot } from "@/components/brand/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="bg-header-gradient">
        <div className="mx-auto flex w-full max-w-sm items-center justify-between gap-4 px-4 pt-6 pb-14">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-primary-foreground"
          >
            Vidyagata
          </Link>
          <span aria-hidden="true" className="sticker-pop">
            <span className="mascot-float flex size-10 items-center justify-center overflow-hidden rounded-full border border-primary-foreground/30 bg-surface shadow-raised">
              <Mascot
                name="sapa"
                eager
                sizes="40px"
                className="h-full w-full object-cover object-top"
              />
            </span>
          </span>
          <Link
            href="/cek-kelayakan"
            className="text-sm font-medium text-primary-foreground transition-opacity duration-150 ease-out hover:opacity-80"
          >
            Cek Kelayakan
          </Link>
        </div>
      </div>
      <main className="mx-auto -mt-10 w-full max-w-sm flex-1 px-4 pb-10">
        <div className="card-rise rounded-2xl border border-border bg-surface p-5 shadow-raised sm:p-6">
          {children}
        </div>
      </main>
      <footer className="px-4 pb-10">
        <p className="mx-auto w-full max-w-sm text-xs leading-5 text-foreground-subtle">
          Kode verifikasi berlaku sekali pakai — jangan pernah dibagikan ke
          siapa pun, termasuk yang mengaku tim Vidyagata.
        </p>
      </footer>
    </div>
  );
}
