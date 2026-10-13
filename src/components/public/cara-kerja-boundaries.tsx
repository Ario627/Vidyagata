type Boundary = {
  readonly claim: string;
  readonly commitment: string;
};

const BOUNDARIES: readonly Boundary[] = [
  {
    claim: "“Dijamin disetujui, pasti cair.”",
    commitment:
      "Setiap pengajuan dinilai berdasarkan kelayakan, dan keputusan akhir ada di mitra pembiayaan. Klaim sebaliknya akan membuatmu mengambil keputusan dengan ekspektasi yang salah.",
  },
  {
    claim: "“Bunga mulai dari 0%.”",
    commitment:
      "Margin dan service fee selalu angka nyata. Total pembayaran tampil di simulasi dan di perjanjian — sebelum kamu menandatangani apa pun.",
  },
  {
    claim: "“Dana bisa dipakai bebas.”",
    commitment:
      "Dana selalu dibayarkan ke institusi pendidikan. Itu keputusan desain, supaya pembiayaan ini benar-benar membiayai kuliah.",
  },
  {
    claim: "“Aman 100%.”",
    commitment:
      "Kami sebut konkretnya: data terenkripsi saat transit dan saat disimpan, akses dibatasi per peran, dan kebijakan privasi yang menyebut kategori data serta siapa saja prosesornya.",
  },
];

function BoundaryItem({ boundary }: { boundary: Boundary }) {
  return (
    <li className="border-border border-t py-4">
      <p className="text-sm text-foreground-subtle line-through decoration-border-strong">
        {boundary.claim}
      </p>
      <p className="mt-1.5 text-sm leading-6 text-foreground">
        {boundary.commitment}
      </p>
    </li>
  );
}

function CaraKerjaBoundaries() {
  return (
    <section>
      <div className="mx-auto w-full max-w-5xl px-4 pb-14 sm:px-6 lg:pb-20">
        <div className="lg:grid lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-14">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <p className="text-2xs font-semibold uppercase tracking-wider text-primary">
              Kejujuran
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
              Kalimat yang tidak akan kamu temukan di sini.
            </h2>
            <p className="mt-3 text-sm leading-6 text-foreground-muted">
              Produk keuangan hidup dari kepercayaan. Ini janji-janji yang
              sengaja kami hindari, dan penggantinya.
            </p>
          </div>
          <ul className="mt-8 lg:mt-1">
            {BOUNDARIES.map((boundary) => (
              <BoundaryItem key={boundary.claim} boundary={boundary} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export { CaraKerjaBoundaries };