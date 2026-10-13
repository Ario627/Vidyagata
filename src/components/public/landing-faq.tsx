import Link from "next/link";
import type { ReactNode } from "react";

type FaqItem = {
  readonly question: string;
  readonly answer: ReactNode;
};

const FAQ_GROUP_NAME = "faq-vidyagata";

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "Perlu penjamin atau agunan?",
    answer:
      "Tidak. VidyaFund tidak meminta penjamin. Yang dinilai adalah rencana biaya dan status kuliah yang diverifikasi bersama kampus mitra.",
  },
  {
    question: "Dananya masuk ke rekening saya?",
    answer:
      "Tidak — dan itu memang disengaja. Dana dikirim langsung ke rekening kampus supaya pasti sampai ke biaya pendidikannya. Kamu tetap bisa memantau semuanya dari dashboard.",
  },
  {
    question: "Kalau penghasilan part-time saya turun?",
    answer:
      "Porsi pemotongan cicilan dari penghasilan ditetapkan sejak awal dan tertulis di perjanjian — begitu juga aturan saat terlambat, termasuk grace period dan penaltinya. Tidak ada kejutan di tengah jalan.",
  },
  {
    question: "Berapa biaya sesungguhnya?",
    answer: (
      <>
        Semua angka — pokok, margin, service fee, sampai total pembayaran —
        muncul di{" "}
        <Link
          href="/cek-kelayakan"
          className="font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
        >
          simulasi kelayakan
        </Link>{" "}
        sebelum kamu mendaftar.
      </>
    ),
  },
  {
    question: "Untuk apa data pribadi saya dipakai?",
    answer: (
      <>
        Untuk menilai kelayakan dan memverifikasi status kuliah, sesuai
        persetujuan yang kamu berikan. Hakmu atas data — akses, koreksi, sampai
        penghapusan — bisa dikelola lewat{" "}
        <Link
          href="/profil"
          className="font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
        >
          halaman Profil
        </Link>
        .
      </>
    ),
  },
];

function FaqDisclosure({ item }: { item: FaqItem }) {
  return (
    <details name={FAQ_GROUP_NAME} className="group border-border border-t">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
        {item.question}
        <span
          aria-hidden="true"
          className="relative mt-0.5 size-4 shrink-0 text-foreground-subtle"
        >
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current transition-transform duration-200 ease-out group-open:scale-y-0 motion-reduce:transition-none" />
        </span>
      </summary>
      <div className="max-w-xl pb-5 text-sm leading-6 text-foreground-muted">
        {item.answer}
      </div>
    </details>
  );
}

function LandingFaq() {
  return (
    <section>
      <div className="mx-auto w-full max-w-5xl px-4 pb-14 sm:px-6 lg:pb-20">
        <div className="lg:grid lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-14">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-primary">
              Tanya jawab
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
              Pertanyaan yang sering muncul.
            </h2>
          </div>
          <div className="mt-6 lg:mt-0">
            {FAQ_ITEMS.map((item) => (
              <FaqDisclosure key={item.question} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export { LandingFaq };
