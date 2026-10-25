import { ArrowLeft } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/app/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ApplyPanel } from "@/components/work/apply-panel";
import {
  formatCompensation,
  JOB_TYPE_LABELS,
  LOCATION_TYPE_LABELS,
} from "@/components/work/labels";
import { getMyApplicationForPosting } from "@/data/applications";
import { getMyDocuments } from "@/data/documents";
import { getJobPostingDetail } from "@/data/jobs";
import { formatInstantWib } from "@/lib/format/date";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Detail lowongan",
  description:
    "Rincian lowongan kerja part-time dan project-based untuk mahasiswa.",
};

export const instant = false;

function InfoRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-xs text-foreground-muted">{label}</dt>
      <dd className="text-right text-xs font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

export default async function JobDetailPage({
  params,
}: PageProps<"/kerja/[jobId]">) {
  await requireUser();
  const { jobId } = await params;
  const job = await getJobPostingDetail(jobId);
  if (job === null) notFound();
  const existingApplication = await getMyApplicationForPosting(jobId);
  const documents = await getMyDocuments();
  const cvDocument =
    documents.find((document) => document.kind === "cv") ?? null;

  return (
    <PageShell
      eyebrow={job.employerName}
      title={job.title}
      description={`${job.employerSector} · ${job.city}`}
      actions={
        <Link
          href={"/kerja" as Route}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" strokeWidth={2} className="size-4" />
          Katalog
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{JOB_TYPE_LABELS[job.jobType]}</Badge>
            <Badge>{LOCATION_TYPE_LABELS[job.locationType]}</Badge>
            <span className="text-2xs text-foreground-subtle">
              {job.weeklyHours} jam/minggu
            </span>
          </div>
          <Card className="gap-0 shadow-none">
            <CardContent className="pb-2">
              <CardTitle>Ringkasan</CardTitle>
            </CardContent>
            <CardContent>
              <dl className="flex flex-col divide-y divide-border">
                <InfoRow
                  label="Lokasi"
                  value={`${job.city} · ${LOCATION_TYPE_LABELS[job.locationType]}`}
                />
                <InfoRow
                  label="Jam kerja"
                  value={`${job.weeklyHours} jam/minggu`}
                />
                <InfoRow label="Kompensasi" value={formatCompensation(job)} />
                {job.publishedAt === null ? null : (
                  <InfoRow
                    label="Ditayangkan"
                    value={formatInstantWib(job.publishedAt)}
                  />
                )}
                {job.closesAt === null ? null : (
                  <InfoRow
                    label="Ditutup"
                    value={formatInstantWib(job.closesAt)}
                  />
                )}
              </dl>
            </CardContent>
          </Card>
          <Card className="gap-0 shadow-none">
            <CardContent className="pb-2">
              <CardTitle>Tentang posisi ini</CardTitle>
            </CardContent>
            <CardContent className="flex flex-col gap-3 text-sm leading-6 text-foreground-muted">
              {job.description.split("\n").map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </CardContent>
          </Card>
          {job.skills.length === 0 ? null : (
            <Card className="gap-0 shadow-none">
              <CardContent className="pb-2">
                <CardTitle>Keterampilan yang dicari</CardTitle>
              </CardContent>
              <CardContent>
                <ul className="flex flex-wrap gap-1.5">
                  {job.skills.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-md bg-surface-raised px-2.5 py-1 text-2xs text-foreground-muted"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
          <ApplyPanel
            postingId={job.id}
            postingTitle={job.title}
            existing={existingApplication}
            cvDocument={cvDocument}
          />
          <p className="px-1 text-2xs leading-4 text-foreground-subtle">
            Vidyagata tidak memungut biaya apa pun dari pelamar. Laporkan kalau
            ada pihak yang meminta pembayaran.
          </p>
        </aside>
      </div>
    </PageShell>
  );
}
