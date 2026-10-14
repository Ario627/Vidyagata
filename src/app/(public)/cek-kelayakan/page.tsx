import type { Metadata } from "next";
import { Mascot } from "@/components/brand/brand";
import { SimulationTool } from "./_components/simulation-tool";
export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: "Cek Kelayakan",
  description:
    "Hitung estimasi cicilan pembiayaan lengkap dengan rincian pokok, margin, dan biaya — tanpa daftar dan tanpa data pribadi.",
};

export default function CekKelayakanPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 lg:max-w-4xl lg:py-12">
      <header className="lg:mx-auto lg:max-w-2xl lg:text-center">
        <Mascot
          name="telusuri"
          eager
          sizes="96px"
          className="mascot-float mx-auto h-20 w-auto sm:h-24"
        />
        <p className="mt-3 text-2xs font-semibold text-primary uppercase tracking-wider">
          Simulasi tanpa daftar
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Cek Kelayakanmu
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Lihat estimasi cicilan lengkap — pokok, margin, sampai total yang kamu
          bayar — sebelum memberi satu pun data pribadi.
        </p>
      </header>
      <SimulationTool className="mt-8" />
    </div>
  );
}
