import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatIDR } from "@/lib/format/currency";
import { formatPercentFromBp } from "@/lib/format/percent";
import { cn } from "@/lib/utils";
import { buildLandingExample } from "./landing-example";

type BreakdownRowProps = {
  readonly label: string;
  readonly value: string;
  readonly emphasis?: boolean;
};

function BreakdownRow({ label, value, emphasis = false }: BreakdownRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt
        className={cn(
          "text-sm",
          emphasis ? "font-medium text-foreground" : "text-foreground-muted",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "tabular-nums",
          emphasis
            ? "text-base font-semibold text-foreground"
            : "text-sm font-medium text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function LandingExampleCard() {
  const example = buildLandingExample();
  return (
    <div className="rounded-xl border border-border bg-surface shadow-card">
      <div className="px-4 pt-4 sm:px-5 sm:pt-5">
        <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-subtle">
          Contoh simulasi
        </p>
        <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground">
          Pembiayaan {example.tenorMonths} bulan
        </h2>
      </div>
      <dl className="mt-2 divide-y divide-border px-4 sm:px-5">
        <BreakdownRow
          label="Biaya pendidikan"
          value={formatIDR(example.principal)}
        />
        <BreakdownRow
          label={`Margin ${formatPercentFromBp(example.marginRateBp)} per tahun`}
          value={formatIDR(example.margin)}
        />
        <BreakdownRow
          label={`Service fee ${formatPercentFromBp(example.serviceFeeRateBp)}`}
          value={formatIDR(example.serviceFee)}
        />
        <BreakdownRow
          label="Total dibayar"
          value={formatIDR(example.totalRepayment)}
          emphasis
        />
      </dl>
      <div className="px-4 pt-3 pb-4 sm:px-5 sm:pb-5">
        <div className="rounded-lg bg-primary-subtle px-4 py-3">
          <p className="text-2xs font-semibold uppercase tracking-wider text-primary-hover">
            Cicilan mulai dari
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-primary-hover tabular-nums">
            {formatIDR(example.installmentFrom)}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">
            per bulan · {example.tenorMonths} kali
          </p>
        </div>
        <p className="mt-3 text-xs leading-5 text-foreground-subtle">
          Angka contoh dari mesin simulasi Vidyagata. Hasil kamu bisa berbeda
          mengikuti biaya, durasi, dan hasil verifikasi.
        </p>
        <Link
          href="/cek-kelayakan"
          className="mt-2 inline-block text-sm font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
        >
          Hitung angka kamu sendiri
        </Link>
      </div>
    </div>
  );
}

function LandingHero() {
  return (
    <section>
      <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 pt-10 pb-14 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:pt-16 lg:pb-20">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-primary">
            Pembiayaan pendidikan + kerja part-time
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-balance text-foreground sm:text-5xl lg:text-[3.25rem]">
            Enggak pusing biaya kuliah.
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-pretty text-foreground-muted">
            Biaya kuliah cair ke rekening kampus, cicilannya diambil dari hasil
            kerja part-time-mu. Tanpa penjamin, dan semua angka terlihat sebelum
            kamu menyerahkan data apa pun.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/cek-kelayakan"
              className={buttonVariants({ size: "lg" })}
            >
              Cek Kelayakanmu
            </Link>
            <Link
              href="#cara-kerja"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Lihat cara kerjanya
            </Link>
          </div>
          <p className="mt-3 text-sm text-foreground-subtle">
            Simulasi tanpa daftar dan tanpa data pribadi.
          </p>
        </div>
        <LandingExampleCard />
      </div>
    </section>
  );
}

export { LandingHero };
