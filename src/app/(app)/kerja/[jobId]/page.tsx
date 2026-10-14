import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  formatCompensation,
  JOB_TYPE_LABELS,
  LOCATION_TYPE_LABELS,
} from "@/components/work/labels";
import { getJobPostingDetail } from "@/data/jobs";
import { formatInstantWib } from "@/lib/format/date";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

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
      <dt className="text-sm text-foreground-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

export default async function JobDetailPage({
  params,
}: {
  readonly params: Promise<{ readonly jobId: string }>;
}) {
  await requireUser();
  const { jobId } = await params;
  const job = await getJobPostingDetail(jobId);
  if (job === null) notFound();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        eyebrow={job.employerName}
        title={job.title}
        description={`${job.employerSector} · ${job.city}`}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="info">{JOB_TYPE_LABELS[job.jobType]}</Badge>
        <Badge>{LOCATION_TYPE_LABELS[job.locationType]}</Badge>
      </div>
      <Card className="mt-6">
        <CardContent>
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
              <InfoRow label="Ditutup" value={formatInstantWib(job.closesAt)} />
            )}
          </dl>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardContent>
          <CardTitle>Tentang posisi ini</CardTitle>
        </CardContent>
        <CardContent className="flex flex-col gap-3 text-sm leading-6 text-foreground-muted">
          {job.description.split("\n").map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </CardContent>
      </Card>
      {job.skills.length === 0 ? null : (
        <Card className="mt-4">
          <CardContent>
            <CardTitle>Keterampilan yang dicari</CardTitle>
          </CardContent>
          <CardContent>
            <ul className="flex flex-wrap gap-1.5">
              {job.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full bg-surface-raised px-2.5 py-1 text-2xs text-foreground-muted"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <p className="mt-4 text-2xs leading-4 text-foreground-subtle">
        Pelamaran langsung dari aplikasi sedang disiapkan dan akan dibuka
        bertahap. Lowongan ini sudah diverifikasi tim Vidyagata.
      </p>
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
