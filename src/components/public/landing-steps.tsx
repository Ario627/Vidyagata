type Step = {
  readonly index: string;
  readonly title: string;
  readonly body: string;
};

const STEPS: readonly Step[] = [
  {
    index: "01",
    title: "Cek kelayakan tanpa daftar",
    body: "Isi rencana biaya dan durasi. Cicilan, margin, sampai total pembayaran langsung terlihat — sebelum satu data pribadi pun kamu isi.",
  },
  {
    index: "02",
    title: "Dana cair ke kampus",
    body: "Pengajuan VidyaFund tanpa penjamin. Setelah status kuliahmu diverifikasi kampus mitra, dana dikirim ke rekening kampus — bukan rekening pribadi.",
  },
  {
    index: "03",
    title: "Cicilan jalan dari hasil kerja",
    body: "Earn2Study menyambungkan kerja part-time yang cocok dengan skill dan jadwal kuliahmu. Cicilan dipotong dari penghasilan itu — sisanya tetap milikmu.",
  },
];

function StepItem({ step }: { step: Step }) {
  return (
    <li className="border-border border-t pt-5">
      <p className="text-2xs font-semibold tracking-wider text-primary tabular-nums">
        {step.index}
      </p>
      <h3 className="mt-2 text-base font-semibold tracking-tight text-foreground">
        {step.title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-foreground-muted">
        {step.body}
      </p>
    </li>
  );
}

function LandingSteps() {
  return (
    <section id="cara-kerja" className="scroll-mt-16">
      <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
        <p className="text-2xs font-semibold uppercase tracking-wider text-primary">
          Cara kerja
        </p>
        <h2 className="mt-2 max-w-md text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
          Dari cek kelayakan sampai cicilan jalan.
        </h2>
        <ol className="mt-8 grid gap-8 lg:grid-cols-3 lg:gap-10">
          {STEPS.map((step) => (
            <StepItem key={step.index} step={step} />
          ))}
        </ol>
      </div>
    </section>
  );
}

export { LandingSteps };