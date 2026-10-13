import { headers } from "next/headers";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { jakartaPlainDateOf, MINIMUM_AGE_YEARS } from "@/domain/account/age";
import { findActiveAgeBan, fingerprintFromHeaders } from "@/lib/age-ban";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Usia belum cukup",
  description:
    "Untuk saat ini pembiayaan Vidyagata hanya untuk pengguna berusia 18 tahun ke atas. Kamu tetap bisa memakai simulasi dan halaman edukasi tanpa akun.",
  robots: { index: false, follow: false },
};

export const instant = false;

const LONG_DATE_FORMAT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function formatEligibleAt(eligibleAt: string): string {
  return LONG_DATE_FORMAT.format(new Date(`${eligibleAt}T00:00:00Z`));
}

export default async function UsiaBelumCukupPage() {
  const headerList = await headers();
  const today = jakartaPlainDateOf(new Date());
  const ban =
    today === null
      ? null
      : findActiveAgeBan({
          fingerprint: fingerprintFromHeaders(headerList),
          today,
        });

  return (
    <div className="flex flex-col gap-5">
      <p className="text-2xs font-semibold uppercase tracking-wider text-primary">
        Pendaftaran
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground">
        Untuk sekarang, pembiayaan Vidyagata hanya untuk usia{" "}
        {MINIMUM_AGE_YEARS} tahun ke atas.
      </h1>
      <p className="text-sm leading-6 text-foreground-muted">
        Aturan pelindungan data pribadi memperlakukan data pengguna di bawah
        umur secara khusus. Sampai alur persetujuan orang tua atau wali siap
        sepenuhnya, kami memilih tidak memproses pendaftaran pembiayaan untuk
        usia di bawah {MINIMUM_AGE_YEARS} tahun.
      </p>
      <p className="text-sm leading-6 text-foreground-muted">
        Tanggal lahirmu tidak kami simpan, dan tidak ada akun yang dibuat. Yang
        tercatat hanya perangkat ini beserta waktu pembatasannya berakhir.
      </p>
      {ban === null ? null : (
        <div className="rounded-lg bg-surface-raised px-4 py-3">
          <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-subtle">
            Perangkat ini tercatat
          </p>
          <p className="mt-1 text-sm leading-6 text-foreground">
            Pendaftaran dan masuk dari perangkat ini dibuka otomatis pada{" "}
            {formatEligibleAt(ban.eligibleAt)}. Catatannya hanya cap perangkat —
            alamat jaringan dan peramban yang digabung lalu diacak satu arah —
            jadi tidak bisa dibaca balik, dan tanggal lahir tidak tersimpan.
          </p>
        </div>
      )}
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
