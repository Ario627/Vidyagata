import { type Stage, StageList } from "./stage-list";

const STAGES: readonly Stage[] = [
  {
    title: "Ceritakan rencanamu",
    body: "Buat akun, isi data akademik dan ekonomi, lalu unggah dokumen pendukung. Data ini jadi dasar penilaian kelayakan — bukan syarat yang berubah di tengah jalan.",
  },
  {
    title: "Screening internal",
    body: "Tim Vidyagata memeriksa kelengkapan dan menghitung kelayakan serta plafonmu. Kamu menerima hasil awal sebelum apa pun diteruskan ke pihak lain.",
  },
  {
    title: "Verifikasi mitra pembiayaan",
    body: "Lembaga pembiayaan berizin melakukan verifikasi sendiri atas riwayat dan latar belakangmu. Dua sumber status ini selalu disinkronkan, dan yang kamu lihat di aplikasi selalu mengikuti keputusan terbaru.",
  },
  {
    title: "Perjanjian digital",
    body: "Setelah disetujui, perjanjian ditandatangani secara digital. Margin, service fee, dan total kewajibanmu terlihat penuh sebelum tanda tangan — tidak ada angka yang muncul belakangan.",
  },
  {
    title: "Pencairan ke rekening kampus",
    body: "Dana tidak pernah masuk ke rekening pribadimu. Pencairan langsung ke institusi pendidikan supaya tepat sasaran, dan statusnya bisa kamu lacak dari dashboard.",
  },
];

function CaraKerjaFlow() {
  return (
    <section>
      <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="lg:grid lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-14">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <p className="text-2xs font-semibold uppercase tracking-wider text-primary">
              Alur pembiayaan
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
              Dari pengajuan sampai lunas, bisa dilacak.
            </h2>
            <p className="mt-3 text-sm leading-6 text-foreground-muted">
              Lima tahap, dan setiap tahap adalah status yang tersimpan — bukan
              kotak hitam.
            </p>
          </div>
          <StageList stages={STAGES} className="mt-8 lg:mt-1" />
        </div>
      </div>
    </section>
  );
}

export { CaraKerjaFlow };