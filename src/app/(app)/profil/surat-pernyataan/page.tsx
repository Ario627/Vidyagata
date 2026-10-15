import type { Metadata, Route } from "next";
import Link from "next/link";
import { PrintButton } from "@/components/account/print-button";
import { StatementBody } from "@/components/account/statement-body";
import { StatementSignForm } from "@/components/account/statement-sign-form";
import { PageHeader } from "@/components/app/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getMyStatement } from "@/data/documents";
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

  const signed = statement.signedAt !== null;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <div className="print:hidden">
        <PageHeader
          eyebrow="Dokumen"
          title="Surat pernyataan"
          description={
            signed
              ? "Surat ini sudah ditandatangani secara elektronik. Kamu bisa mengunduhnya kapan saja."
              : "Baca isinya dengan saksama, lalu tandatangani secara elektronik di bawah surat."
          }
        />
      </div>
      <Card className="mt-6 print:border-0 print:shadow-none">
        <CardContent>
          <StatementBody state={statement} />
        </CardContent>
      </Card>
      {signed ? (
        <div className="mt-4 flex flex-col gap-2 print:hidden">
          <PrintButton />
          <p className="text-2xs leading-4 text-foreground-subtle">
            Gunakan opsi &ldquo;Simpan sebagai PDF&rdquo; di dialog cetak.
          </p>
        </div>
      ) : (
        <Card className="mt-4 print:hidden">
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-foreground">
              Tanda tangan elektronik
            </p>
            <StatementSignForm fullName={statement.fullName} />
          </CardContent>
        </Card>
      )}
    </main>
  );
}