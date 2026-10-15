import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/data/dal";
import { listReviewQueue } from "@/data/operator";
import { isTwoFactorEnabled } from "@/data/two-factor";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Konsol operator",
  robots: { index: false, follow: false },
};

export const instant = false;

function MfaSuggestionCard() {
  return (
    <Card className="mt-4">
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-foreground">
          Verifikasi dua langkah belum aktif
        </p>
        <p className="text-xs leading-5 text-foreground-muted">
          Opsional, tapi sangat disarankan: dengan 2FA, kata sandi yang bocor
          saja tidak cukup untuk masuk ke konsol operator.
        </p>
        <Link
          href={"/operator/keamanan" as Route}
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
        >
          Aktifkan sekarang
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function OperatorHomePage() {
  const actor = await requireRole("operator");
  const twoFactorOn = await isTwoFactorEnabled(actor.id);
  const queue = await listReviewQueue();
  const pending = queue.filter((item) => item.status === "submitted").length;
  const inReview = queue.filter(
    (item) => item.status === "under_review",
  ).length;

  return (
    <main className="mx-auto -mt-2 flex w-full max-w-lg flex-col px-4 pb-10">
      <Card>
        <CardContent className="pt-2">
          <PageHeader
            title="Ringkasan antrian"
            description="Pengajuan yang menunggu peninjauan dan yang sedang ditangani petugas."
          />
        </CardContent>
        <CardContent className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-xl bg-surface-raised p-4">
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {pending}
            </span>
            <span className="text-xs text-foreground-muted">
              Menunggu ditinjau
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-surface-raised p-4">
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {inReview}
            </span>
            <span className="text-xs text-foreground-muted">
              Sedang ditinjau
            </span>
          </div>
        </CardContent>
        <CardContent>
          <Link
            href={"/operator/antrian" as Route}
            className={cn(buttonVariants({ size: "md" }), "w-full")}
          >
            Buka antrian
          </Link>
        </CardContent>
      </Card>
      {twoFactorOn ? null : <MfaSuggestionCard />}
    </main>
  );
}
