import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Perlu masuk",
  robots: { index: false, follow: false },
};

export default function Unauthorized() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div>
        <span
          aria-hidden="true"
          className="block h-1 w-10 rounded-full bg-header-gradient"
        />
        <p className="mt-4 text-2xs font-semibold uppercase tracking-wider text-primary">
          401 · Perlu masuk
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-foreground">
          Masuk dulu untuk membuka halaman ini.
        </h1>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">
          Sesi kamu tidak ditemukan — mungkin belum masuk, atau sesi sebelumnya
          sudah berakhir karena didiamkan cukup lama.
        </p>
      </div>
      <div className="flex flex-col items-start gap-3">
        <Link
          href="/masuk"
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          Masuk ke akunmu
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
