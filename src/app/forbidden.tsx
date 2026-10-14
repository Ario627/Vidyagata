import type { Metadata, Route } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Akses ditolak",
  robots: { index: false, follow: false },
};

export default function Forbidden() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div>
        <span
          aria-hidden="true"
          className="block h-1 w-10 rounded-full bg-header-gradient"
        />
        <p className="mt-4 text-2xs font-semibold uppercase tracking-wider text-primary">
          403 · Akses ditolak
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-foreground">
          Halaman ini tidak terbuka untuk peran akunmu.
        </h1>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">
          Akses di Vidyagata ditentukan oleh peran akun — mahasiswa, mitra
          usaha, verifikator kampus, atau operator — bukan sekadar status sudah
          masuk.
        </p>
      </div>
      <div className="flex flex-col items-start gap-3">
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          Kembali ke dashboard
        </Link>
        <Link
          href={"/legal/pengaduan" as Route}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Merasa ini keliru? Kirim pengaduan
        </Link>
      </div>
    </main>
  );
}
