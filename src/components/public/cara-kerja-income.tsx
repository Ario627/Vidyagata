import Link from "next/link";
import { formatIDR } from "@/lib/format/currency";
import { buildDeductionExample } from "./cara-kerja-example";
import { type Stage, StageList } from "./stage-list";

const STAGES: readonly Stage[] = [
  {
    title: "Lengkapi profil kerja",
    body: "CV singkat, skill, dan jadwal kuliahmu. Jadwal dipakai untuk menyaring lowongan yang benar-benar muat di sela kelas — bukan sekadar yang tersedia.",
  },
  {
    title: "Matching dan lamaran",
    body: "Vidya AI mencocokkan lowongan dari mitra usaha dengan skill dan jadwalmu. Kamu yang memilih dan mengajukan lamaran, dan mitra usaha yang menyetujui.",
  },
  {
    title: "Gaji masuk, potongan jalan",
    body: "Setelah kamu bekerja, cicilan dipotong otomatis dari penghasilan sesuai porsi pilihanmu. Sisa penghasilan masuk penuh ke kamu.",
  },
];

function DeductionTable() {
  const example = buildDeductionExample();
  return (
    <div className="rounded-xl border border-border bg-surface shadow-card">
      <table className="w-full text-sm">
        <caption className="sr-only">
          Contoh potongan cicilan untuk tiap porsi
        </caption>
        <thead>
          <tr className="border-border border-b text-left text-2xs uppercase tracking-wider text-foreground-subtle">
            <th scope="col" className="py-3 pl-4 font-semibold sm:pl-5">
              Porsi
            </th>
            <th scope="col" className="py-3 text-right font-semibold">
              Potongan/bulan
            </th>
            <th
              scope="col"
              className="py-3 pr-4 text-right font-semibold sm:pr-5"
            >
              Perkiraan lunas
            </th>
          </tr>
        </thead>
        <tbody>
          {example.rows.map((row) => (
            <tr
              key={row.rate}
              className="border-border border-b last:border-b-0"
            >
              <th
                scope="row"
                className="py-3 pl-4 text-left font-semibold text-foreground tabular-nums sm:pl-5"
              >
                {row.rate}%
              </th>
              <td className="py-3 text-right text-foreground tabular-nums">
                {formatIDR(row.monthlyDeduction)}
              </td>
              <td className="py-3 pr-4 text-right text-foreground tabular-nums sm:pr-5">
                {row.payoffMonths === null
                  ? "—"
                  : `± ${row.payoffMonths} bulan`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-border border-t px-4 py-3 sm:px-5">
        <p className="text-xs leading-5 text-foreground-subtle">
          Contoh dari mesin simulasi: total pembayaran{" "}
          {formatIDR(example.outstanding)} dan penghasilan{" "}
          {formatIDR(example.monthlyEarnings)} per bulan, belum termasuk diskon
          VidyAppreciate. Angka nyatamu mengikuti hasil simulasi dan penghasilan
          aktual.
        </p>
        <Link
          href="/cek-kelayakan"
          className="mt-2 inline-block text-sm font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
        >
          Coba dengan angkamu sendiri
        </Link>
      </div>
    </div>
  );
}

function CaraKerjaIncome() {
  return (
    <section>
      <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="lg:grid lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-14">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <p className="text-2xs font-semibold uppercase tracking-wider text-primary">
              Alur penghasilan
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
              Cicilan datang dari hasil kerjamu.
            </h2>
            <p className="mt-3 text-sm leading-6 text-foreground-muted">
              Kamu yang memilih porsi pemotongan. Semakin besar porsinya,
              semakin cepat lunas — dan sisanya tetap milikmu.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-10 lg:mt-1">
            <StageList stages={STAGES} />
            <DeductionTable />
          </div>
        </div>
      </div>
    </section>
  );
}

export { CaraKerjaIncome };