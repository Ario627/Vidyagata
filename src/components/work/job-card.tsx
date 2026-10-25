import { ArrowUpRight, Clock, MapPin } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { JobPostingSummary } from "@/data/jobs";
import {
  formatCompensation,
  JOB_TYPE_LABELS,
  LOCATION_TYPE_LABELS,
} from "./labels";

type JobCardProps = {
  readonly posting: JobPostingSummary;
};

function employerInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function JobCard({ posting }: JobCardProps) {
  return (
    <Link
      href={`/kerja/${posting.id}` as Route}
      className="group flex h-full flex-col rounded-xl border border-border bg-surface p-4 transition-colors duration-150 ease-out hover:border-border-strong hover:bg-surface-raised/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-2xs font-semibold text-brand-700"
          >
            {employerInitials(posting.employerName)}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-2xs text-foreground-muted">
              {posting.employerName}
            </span>
            <span className="truncate text-sm font-semibold tracking-tight text-foreground">
              {posting.title}
            </span>
          </div>
        </div>
        <Badge variant="info">{JOB_TYPE_LABELS[posting.jobType]}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-foreground-muted">
        <span className="inline-flex items-center gap-1">
          <MapPin aria-hidden="true" strokeWidth={1.8} className="size-3" />
          {posting.city} · {LOCATION_TYPE_LABELS[posting.locationType]}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock aria-hidden="true" strokeWidth={1.8} className="size-3" />
          {posting.weeklyHours} jam/minggu
        </span>
      </div>

      {posting.skills.length === 0 ? null : (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {posting.skills.slice(0, 4).map((skill) => (
            <li
              key={skill}
              className="rounded-md bg-surface-raised px-2 py-0.5 text-2xs text-foreground-muted"
            >
              {skill}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-end justify-between gap-3 border-border border-t pt-3">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {formatCompensation(posting)}
        </span>
        <span className="inline-flex items-center gap-1 text-2xs font-semibold text-primary">
          Lihat detail
          <ArrowUpRight
            aria-hidden="true"
            strokeWidth={2}
            className="size-3 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </div>
    </Link>
  );
}

export { JobCard };
