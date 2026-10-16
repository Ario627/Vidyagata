import type { Metadata, Route } from "next";
import Link from "next/link";
import { PrintButton } from "@/components/account/print-button";
import { StatementBody } from "@/components/account/statement-body";
import { StatementPaperUpload } from "@/components/account/statement-paper-upload";
import { StatementSignForm } from "@/components/account/statement-sign-form";
import { PageHeader } from "@/components/app/page-header";
import { Mascot } from "@/components/brand/brand";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getMyDocuments, getMyStatement } from "@/data/documents";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Surat pernyataan",
  description:
    "Baca, unduh, dan tandatangani surat pernyataan mahasiswa Vidyagata.",
};

export const instant = false;

export default async function SuratPernyataanPage() {
  await requireUser();
  const statement = await getMyStatement();

  if (statement === null) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
        <PageHeader eyebrow="Dokumen" title="Surat pernyataan" />
        <EmptyState
          className="mt-6"
          title="Lengkapi profil dulu"
          description="Surat pernyataan dibuat otomatis dari data profilmu — nama, kampus, dan semester perlu terisi lebih dulu."
          action={
            <Link
              href={"/profil/lengkapi" as Route}
              className={buttonVariants({})}
            >
              Lengkapi profil
            </Link>
          }
        />
      </main>
    );
  }

  const documents = await getMyDocuments();
  const paperUpload =
    documents.find((document) => document.kind === "statement_signed") ?? null;
  const signed = statement.signedAt !== null;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6 print:max-w-none print:px-0 print:py-0 lg:max-w-5xl">
      <div className="print:hidden">
        <PageHeader
          eyebrow="Dokumen"
          title="Surat pernyataan"
          description={
            signed
              ? "Surat ini sudah ditandatangani. Unduh salinannya untuk arsipmu."
              : "Baca isinya, lalu tanda tangani langsung di halaman ini atau unduh untuk ditandatangani di kertas."
          }
        />
      </div>
      <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8 print:mt-0 print:block">
        <div className="print:mt-0">
          <StatementBody state={statement} className="lg:px-10 lg:py-9" />
        </div>
        <aside className="mt-5 flex flex-col gap-4 print:hidden lg:sticky lg:top-6 lg:mt-0">
          {signed ? (
            <Card>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Mascot
                    name="pesta"
                    sizes="64px"
                    className="size-14 shrink-0"
                  />
                  <p className="text-sm font-semibold text-foreground">
                    Dokumen bertanda tangan
                  </p>
                </div>
                <p className="text-xs leading-5 text-foreground-muted">
                  Tanda tangan elektronik tersimpan di dalam surat di sebelah.
                  Unduh PDF untuk arsip pribadi atau keperluan verifikasi.
                </p>
                <PrintButton className="w-full" />
                <p className="text-2xs leading-4 text-foreground-subtle">
                  Gunakan opsi &ldquo;Simpan sebagai PDF&rdquo; di dialog cetak.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">
                      Tanda tangan elektronik
                    </p>
                    <p className="text-xs leading-5 text-foreground-muted">
                      Gambar tanda tanganmu langsung di area yang tersedia, lalu
                      simpan.
                    </p>
                  </div>
                  <StatementSignForm />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">
                      Atau tanda tangan di kertas
                    </p>
                    <p className="text-xs leading-5 text-foreground-muted">
                      Unduh surat, cetak, tanda tangani, lalu unggah hasil
                      pindaiannya.
                    </p>
                  </div>
                  <PrintButton className="w-full" label="Unduh surat (PDF)" />
                </CardContent>
              </Card>
            </>
          )}
          <StatementPaperUpload current={paperUpload} />
        </aside>
      </div>
    </main>
  );
}
