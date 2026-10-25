import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageShell } from "@/components/app/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { APPLICATION_STATUS_META } from "@/components/work/labels";
import { WithdrawApplicationButton } from "@/components/work/withdraw-application-button";
import { listMyApplications, type MyApplication } from "@/data/applications";
import { formatInstantWib } from "@/lib/format/date";

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
    <Card className="gap-0 shadow-none">
      <CardContent className="flex items-start justify-between gap-3 pb-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            href={`/kerja/${item.postingId}` as Route}
            className="text-sm font-semibold text-foreground underline-offset-4 transition-colors duration-150 ease-out hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
        <CardContent className="pb-3">
          <p className="text-2xs leading-4 text-foreground-subtle">
            Catatanmu: {item.note}
          </p>
        </CardContent>
      )}
      {withdrawable ? (
        <CardContent className="border-border border-t pt-3">
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
    <PageShell
      eyebrow="Earn2Study"
      title="Lamaran saya"
      description="Semua lamaran kerja yang kamu kirim, lengkap dengan statusnya."
      actions={
        <Link
          href={"/kerja" as Route}
          className={buttonVariants({ variant: "secondary", size: "md" })}
        >
          Lihat katalog
        </Link>
      }
    >
      {applications.length === 0 ? (
        <EmptyState
          className="rounded-xl border border-border border-dashed bg-surface"
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
        <ul className="grid gap-3 md:grid-cols-2">
          {applications.map((item) => (
            <li key={item.id}>
              <ApplicationCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
