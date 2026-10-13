import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MbakVidyaBannerProps<T extends string = string> = {
  href: Route<T>;
  title?: string;
  description?: string;
  avatar?: ReactNode;
  className?: string;
};

function MbakVidyaBanner<T extends string>({
  href,
  title = "Mbak Vidya",
  description = "Pembimbing AI yang siap membantumu job-matching!",
  avatar,
  className,
}: MbakVidyaBannerProps<T>) {
  return (
    <Link
      data-slot="mbak-vidya-banner"
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-primary-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground",
        className,
      )}
    >
      {avatar === undefined ? null : (
        <span className="flex size-9 shrink-0 overflow-hidden rounded-full">
          {avatar}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold leading-5">{title}</span>
        <span className="text-xs leading-4">{description}</span>
      </span>
      <ChevronRight
        aria-hidden="true"
        strokeWidth={2}
        className="size-4 shrink-0"
      />
    </Link>
  );
}

export { MbakVidyaBanner };
export type { MbakVidyaBannerProps };
