import type { Metadata } from "next";
import { buildLandingExample } from "@/components/public/landing-example";
import { PublicCta } from "@/components/public/public-cta";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { rupiah } from "@/domain/money/money";
import { formatIDR } from "@/lib/format/currency";
import { formatPercentFromBp } from "@/lib/format/percent";
import { FeeExplorer, type FeeItem } from "./_components/fee-explorer";

export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: "Biaya",
  description:
    "Struktur biaya VidyaFund sampai ke baris terkecil: apa yang kamu bayar, untuk apa, dan apa yang tidak dikenakan.",
  alternates: { canonical: "/legal/biaya" },
  robots: { index: false, follow: false },
};

function buildFeeItems(): readonly FeeItem[] {
  const example = buildLandingExample();
  const marginRate = formatPercentFromBp(example.marginRateBp);
  const serviceFeeRate = formatPercentFromBp(example.serviceFeeRateBp);
  const principal = formatIDR(example.principal);
  const margin = formatIDR(example.margin);
  const serviceFee = formatIDR(example.serviceFee);
  const total = formatIDR(example.totalRepayment);
  return [
    {
      id: "pokok",
      label: "Biaya pendidikan",
      value: principal,
      paragraphs: [
        "Pokok pembiayaan — jumlah yang dibayarkan untuk biaya pendidikanmu.",
        "Dana ini dikirim langsung ke rekening institusi pendidikan, tidak pernah ke rekening pribadi.",
      ],
      items: [`${principal} pada contoh di halaman ini.`],
    },
    {
      id: "margin",
      label: `Margin ${marginRate} per tahun`,
      value: margin,
      paragraphs: [
        "Margin adalah imbal hasil yang dikenakan atas pembiayaan. Dihitung dari pokok, bukan dari sisa utang — jadi nilainya tetap dan tidak berbunga-berbunga.",
        "Pada contoh ini, margin dihitung untuk seluruh tenor dan terbagi rata di setiap cicilan.",
      ],
      items: [
        `${marginRate} per tahun × ${principal} × 1 tahun = ${margin}.`,
        `Setara ${formatIDR(rupiah(Math.round(example.margin / 12)))} per bulan pada tenor ${example.tenorMonths} bulan.`,
        "Angka terkunci sejak perjanjian ditandatangani.",
      ],
    },
    {
      id: "service-fee",
      label: `Service fee ${serviceFeeRate}, sekali`,
      value: serviceFee,
      paragraphs: [
        "Biaya layanan satu kali untuk pemrosesan pengajuan, verifikasi, dan administrasi pembiayaan.",
        "Dikenakan sekali di awal — tidak berulang setiap bulan.",
      ],
      items: [
        `${serviceFeeRate} dari ${principal} = ${serviceFee}.`,
        "Sudah termasuk dalam total pembayaran di halaman ini.",
      ],
    },
    {
      id: "denda",
      label: "Denda keterlambatan",
      value: "Hanya jika telat",
      paragraphs: [
        "Denda bukan biaya rutin. Ia hanya berlaku jika pembayaran terlambat, dan ada masa tenggang sebelum konsekuensi apa pun diterapkan.",
        "Besarannya mengikuti ketentuan yang berlaku bagi mitra pembiayaan, dan selalu tertulis di perjanjianmu sebelum kamu menandatangani.",
      ],
      items: [
        "Masa tenggang dan konsekuensinya dijelaskan di perjanjian.",
        "Tidak ada denda yang ditetapkan diam-diam di luar dokumen itu.",
      ],
    },
    {
      id: "total",
      label: "Total dibayar",
      value: total,
      emphasis: true,
      paragraphs: [
        "Penjumlahan tiga baris di atas: pokok, margin, dan service fee.",
        "Selama pembayaran berjalan tepat waktu, tidak ada baris biaya lain yang muncul di luar tiga komponen ini.",
      ],
      items: [`${principal} + ${margin} + ${serviceFee} = ${total}.`],
    },
  ];
}

function FeeNotes() {
  return (
    <div className="my-10 grid gap-4 sm:grid-cols-2">
      <Card>
        <CardContent>
          <CardTitle>Kalau pembayaran terlambat</CardTitle>
        </CardContent>
        <CardContent>
          <p className="text-sm leading-6 text-foreground-muted">
            Denda bukan biaya rutin. Ada masa tenggang sebelum konsekuensi apa
            pun berlaku, dan aturannya tertulis di perjanjianmu sebelum tanda
            tangan.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <CardTitle>Sebelum tanda tangan</CardTitle>
        </CardContent>
        <CardContent>
          <p className="text-sm leading-6 text-foreground-muted">
            Semua angka di perjanjian berasal dari mesin simulasi yang sama
            dengan yang kamu pakai di halaman ini — tidak ada angka baru yang
            muncul belakangan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BiayaPage() {
  const example = buildLandingExample();
  return (
    <>
      <section>
        <div className="mx-auto w-full max-w-5xl px-4 pt-10 sm:px-6 lg:pt-16">
          <p className="text-2xs font-semibold uppercase tracking-wider text-primary">
            Biaya
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-balance text-foreground sm:text-4xl">
            Semua yang kamu bayar, ada angkanya.
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-pretty text-foreground-muted">
            Halaman ini membuka struktur biaya VidyaFund sampai ke baris
            terkecil: apa yang kamu bayar, untuk apa, dan apa yang tidak pernah
            kami kenakan.
          </p>
          <p className="mt-3 text-xs leading-5 text-foreground-subtle">
            Angka di halaman ini memakai satu contoh: biaya pendidikan{" "}
            {formatIDR(example.principal)} selama {example.tenorMonths} bulan
            dengan margin {formatPercentFromBp(example.marginRateBp)} per tahun
            dan service fee {formatPercentFromBp(example.serviceFeeRateBp)}.
          </p>
        </div>
      </section>
      <div className="mx-auto w-full max-w-5xl px-4 pt-8 sm:px-6">
        <div className="max-w-xl">
          <FeeExplorer items={buildFeeItems()} />
          <div className="mt-4 rounded-lg bg-primary-subtle px-4 py-3.5">
            <p className="text-2xs font-semibold uppercase tracking-wider text-primary-hover">
              Cicilan mulai dari
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-primary-hover tabular-nums">
              {formatIDR(example.installmentFrom)}
            </p>
            <p className="mt-1 text-xs text-foreground-muted">
              per bulan · {example.tenorMonths} kali — angka inilah yang masuk
              ke jadwal cicilanmu.
            </p>
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <FeeNotes />
      </div>
      <PublicCta
        title="Hitung dengan angkamu sendiri."
        body="Simulasi kelayakan gratis — tanpa daftar dan tanpa data pribadi."
        href="/cek-kelayakan"
        label="Cek Kelayakanmu"
      />
    </>
  );
}
