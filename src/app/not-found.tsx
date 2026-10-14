import type { Metadata, Route } from "next";
import Link from "next/link";
import { BrandLogo, Mascot } from "@/components/brand/brand";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-border border-b">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center px-4 sm:px-6">
          <Link href={"/" as Route} className="flex items-center">
            <BrandLogo eager className="h-7" />
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-14 text-center">
        <Mascot
          name="ceria"
          eager
          sizes="(min-width: 640px) 208px, 176px"
          className="mascot-sway h-44 w-auto sm:h-52"
        />
        <p className="mt-6 text-2xs font-semibold uppercase tracking-wider text-primary">
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-foreground">
          Halaman ini sepertinya pindah kos.
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-foreground-muted">
          Alamatnya mungkin salah ketik, atau halamannya sudah dipindahkan.
          Mulai lagi dari beranda, atau hitung dulu estimasi cicilanmu.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href={"/" as Route} className={buttonVariants({})}>
            Kembali ke beranda
          </Link>
          <Link
            href={"/cek-kelayakan" as Route}
            className={buttonVariants({ variant: "secondary" })}
          >
            Cek kelayakan
          </Link>
        </div>
      </main>
    </div>
  );
}
