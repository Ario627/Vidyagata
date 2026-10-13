import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { JobPostingSummary } from "@/data/jobs";
import { cn } from "@/lib/utils";
import {
  formatCompensation,
  JOB_TYPE_LABELS,
  LOCATION_TYPE_LABELS,
} from "./labels";

type JobCardProps = {
  readonly posting: JobPostingSummary;
};

function JobCard({ posting }: JobCardProps) {
  return (
    <Link
      href={`/kerja/${posting.id}` as Route}
      className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Card
        className={cn(
          "gap-3 transition-colors duration-150 ease-out hover:border-border-strong",
        )}
      >
        <CardContent className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-xs text-foreground-muted">
              {posting.employerName}
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">
              {posting.title}
            </span>
          </div>
          <Badge variant="info">{JOB_TYPE_LABELS[posting.jobType]}</Badge>
        </CardContent>
        <CardContent className="flex flex-col gap-1 text-xs text-foreground-muted">
          <span>
            {posting.city} · {LOCATION_TYPE_LABELS[posting.locationType]} ·{" "}
            {posting.weeklyHours} jam/minggu
          </span>
          <span className="text-sm font-medium text-foreground tabular-nums">
            {formatCompensation(posting)}
          </span>
        </CardContent>
        {posting.skills.length === 0 ? null : (
          <CardContent>
            <ul className="flex flex-wrap gap-1.5">
              {posting.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full bg-surface-raised px-2.5 py-1 text-2xs text-foreground-muted"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}

export { JobCard };