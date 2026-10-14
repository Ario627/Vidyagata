import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { APPLICATION_STATUS_META } from "@/components/work/labels";
import { WithdrawApplicationButton } from "@/components/work/withdraw-application-button";
import { listMyApplications, type MyApplication } from "@/data/applications";
import { formatInstantWib } from "@/lib/format/date";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Lamaran saya",
  description:
    "Status lamaran kerja part-time yang kamu kirim lewat Vidyagata.",
};

export const instant = false;

function ApplicationCard({ item }: { readonly item: MyApplication }) {
  const meta = APPLICATION_STATUS_META[item.status] ?? {
    variant: "neutral" as const,
    label: item.status,
  };
  const withdrawable =
    item.status === "submitted" || item.status === "shortlisted";
  return (
    <Card className="gap-2">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            href={`/kerja/${item.postingId}` as Route}
            className="text-base font-semibold text-foreground underline-offset-4 transition-colors duration-150 ease-out hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {item.postingTitle}
          </Link>
          <span className="text-xs text-foreground-muted">
            {item.employerName}
            {item.submittedAt === null
              ? ""
              : ` · dikirim ${formatInstantWib(item.submittedAt)}`}
          </span>
        </div>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </CardContent>
      {item.note === null ? null : (
        <CardContent>
          <p className="text-2xs leading-4 text-foreground-subtle">
            Catatanmu: {item.note}
          </p>
        </CardContent>
      )}
      {withdrawable ? (
        <CardContent>
          <WithdrawApplicationButton
            applicationId={item.id}
            postingTitle={item.postingTitle}
          />
        </CardContent>
      ) : null}
    </Card>
  );
}

export default async function LamaranPage() {
  const applications = await listMyApplications();
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        eyebrow="Earn2Study"
        title="Lamaran saya"
        description="Semua lamaran kerja yang kamu kirim, lengkap dengan statusnya."
      />
      {applications.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Belum ada lamaran"
          description="Buka katalog kerja, pilih lowongan yang cocok, lalu kirim lamaran pertamamu."
          action={
            <Link
              href={"/kerja" as Route}
              className={buttonVariants({ variant: "secondary" })}
            >
              Lihat katalog kerja
            </Link>
          }
        />
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {applications.map((item) => (
            <li key={item.id}>
              <ApplicationCard item={item} />
            </li>
          ))}
        </ul>
      )}
      <Link
        href={"/kerja" as Route}
        className={cn(
          buttonVariants({ variant: "secondary", size: "lg" }),
          "mt-4 w-full",
        )}
      >
        Kembali ke katalog
      </Link>
    </main>
  );
}
