import type { Metadata } from "next";
import { CaraKerjaBoundaries } from "@/components/public/cara-kerja-boundaries";
import { CaraKerjaFlow } from "@/components/public/cara-kerja-flow";
import { CaraKerjaIncome } from "@/components/public/cara-kerja-income";
import { PublicCta } from "@/components/public/public-cta";

export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: "Cara Kerja",
  description:
    "Alur lengkap Vidyagata: pengajuan, verifikasi, pencairan ke kampus, sampai cicilan dipotong dari penghasilan kerja part-time — semua bisa dilacak.",
  alternates: { canonical: "/cara-kerja" },
};

export default function CaraKerjaPage() {
  return (
    <>
      <section>
        <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-2 sm:px-6 lg:pt-16">
          <p className="text-2xs font-semibold uppercase tracking-wider text-primary">
            Cara kerja
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-balance text-foreground sm:text-5xl">
            Uangnya, kerjanya, cicilannya — semuanya kelihatan.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-pretty text-foreground-muted">
            Dua alur di bawah ini menjelaskan jalan lengkapmu bersama Vidyagata:
            bagaimana pembiayaan diproses sampai dana sampai ke kampus, dan
            bagaimana cicilannya dilunasi dari hasil kerja.
          </p>
        </div>
      </section>
      <CaraKerjaFlow />
      <CaraKerjaIncome />
      <CaraKerjaBoundaries />
      <PublicCta
        title="Sudah paham alurnya? Mulai dari angkanya."
        body="Simulasi kelayakan gratis — tanpa daftar dan tanpa data pribadi."
        href="/cek-kelayakan"
        label="Cek Kelayakanmu"
      />
    </>
  );
}