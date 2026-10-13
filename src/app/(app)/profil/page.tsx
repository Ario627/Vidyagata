import { ShieldCheck, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Profil",
  description:
    "Profil, verifikasi identitas, dan pengaturan data pribadimu di Vidyagata.",
};

const DATA_RIGHTS = [
  {
    title: "Unduh data pribadimu",
    description:
      "Kamu bisa meminta salinan data pribadi yang kami simpan, kapan saja.",
  },
  {
    title: "Hapus data pribadimu",
    description:
      "Kamu bisa meminta penghapusan data pribadi. Catatan keuangan tetap kami simpan sesuai kewajiban hukum, tetapi tidak lagi terhubung ke identitasmu.",
  },
] as const;

function DataRightsCard() {
  return (
    <Card className="mt-6">
      <CardContent className="flex items-center gap-2">
        <ShieldCheck
          aria-hidden="true"
          strokeWidth={1.8}
          className="size-4 shrink-0 text-foreground-muted"
        />
        <CardTitle>Hakmu atas data pribadi</CardTitle>
      </CardContent>
      <CardContent>
        <dl className="flex flex-col">
          {DATA_RIGHTS.map((right) => (
            <div
              key={right.title}
              className="flex flex-col gap-0.5 border-border border-t py-3 first:border-t-0 first:pt-0 last:pb-0"
            >
              <dt className="text-sm font-medium text-foreground">
                {right.title}
              </dt>
              <dd className="text-xs text-foreground-muted">
                {right.description}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export default function ProfilPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        eyebrow="Akun"
        title="Profil"
        description="Identitas, verifikasi, dan pengaturan datamu terkumpul di sini."
      />
      <EmptyState
        className="mt-6"
        icon={UserRound}
        title="Kamu belum masuk"
        description="Profil dan verifikasi identitas muncul setelah kamu masuk dengan nomor HP-mu."
      />
      <DataRightsCard />
    </main>
  );
}
