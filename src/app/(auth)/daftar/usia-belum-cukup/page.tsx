import { buttonVariants } from "@/components/ui/button-variants";
import { MINIMUM_AGE_YEARS } from "@/domain/account/age";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const ensureStatic = "navigation";

export const metadata = {
  title: "Usia belum cukup",
  description:
    "Untuk saat ini pembiayaan Vidyagata hanya untuk pengguna berusia 18 tahun ke atas. Kamu tetap bisa memakai simulasi dan halaman edukasi tanpa akun.",
  robots: { index: false, follow: false },
};

export default function UsiaBelumCukupPage() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-2xs font-semibold uppercase tracking-wider text-primary">
        Pendaftaran
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground">
        Untuk sekarang, pembiayaan Vidyagata hanya untuk usia {MINIMUM_AGE_YEARS}{" "}
        tahun ke atas.
      </h1>
      <p className="text-sm leading-6 text-foreground-muted">
        Aturan pelindungan data pribadi memperlakukan data pengguna di bawah
        umur secara khusus. Sampai alur persetujuan orang tua atau wali siap
        sepenuhnya, kami memilih tidak memproses pendaftaran pembiayaan untuk
        usia di bawah {MINIMUM_AGE_YEARS} tahun.
      </p>
      <p className="text-sm leading-6 text-foreground-muted">
        Tanggal lahir yang tadi kamu isi tidak dikirim ke mana pun — tidak ada
        akun yang dibuat, dan tidak ada data yang tersimpan.
      </p>
      <div className="flex flex-col gap-3">
        <Link href="/cek-kelayakan" className={buttonVariants({ size: "lg" })}>
          Coba simulasi tanpa akun
        </Link>
        <Link
          href="/cara-kerja"
          className={cn(
            buttonVariants({ variant: "secondary", size: "lg" }),
            "w-full",
          )}
        >
          Pelajari cara kerjanya
        </Link>
      </div>
      <p className="text-xs leading-5 text-foreground-subtle">
        Kalau usiamu sudah mendekati {MINIMUM_AGE_YEARS} tahun, kamu bisa
        kembali ke halaman ini kapan saja setelah cukup umur.
      </p>
    </div>
  );
}