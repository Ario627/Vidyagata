import { ReceiptText } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Tagihan",
  description: "Tagihan dan jadwal cicilan pembiayaan pendidikanmu.",
};

export default function TagihanPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        eyebrow="VidyaFund"
        title="Tagihan"
        description="Cicilan bulanan dari fasilitas pembiayaanmu muncul di sini — lengkap dengan jatuh tempo, jumlah, dan status pembayaran."
      />
      <EmptyState
        className="mt-6"
        icon={ReceiptText}
        title="Belum ada tagihan"
        description="Tagihan pertama terbit setelah dana pembiayaanmu dicairkan langsung ke rekening kampus."
        action={
          <Link
            href={"/cek-kelayakan" as Route}
            className={buttonVariants({ variant: "secondary" })}
          >
            Lihat simulasi cicilan
          </Link>
        }
      />
    </main>
  );
}
