import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ProfileCardProps<T extends string = string> = {
  name: string;
  institution: string;
  status: string;
  href: Route<T>;
  avatar?: ReactNode;
  className?: string;
};

export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function ProfileAvatar({ name, avatar }: { name: string; avatar?: ReactNode }) {
  if (avatar !== undefined) {
    return (
      <span className="flex size-14 shrink-0 overflow-hidden rounded-xl">
        {avatar}
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-lg font-semibold text-brand-900"
    >
      {initialsOf(name)}
    </span>
  );
}

function ProfileCard<T extends string>({
  name,
  institution,
  status,
  href,
  avatar,
  className,
}: ProfileCardProps<T>) {
  return (
    <Link
      data-slot="profile-card"
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-card",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      <ProfileAvatar name={name} avatar={avatar} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-semibold text-foreground">
          {name}
        </span>
        <span className="truncate text-sm text-foreground-muted">
          {institution}
        </span>
        <span className="mt-1 flex items-baseline gap-1 text-xs">
          <span className="text-foreground-subtle">Status</span>
          <span className="truncate font-medium text-foreground">{status}</span>
        </span>
        <span className="mt-1.5 text-2xs text-foreground-subtle">
          Klik untuk selengkapnya...
        </span>
      </span>
      <ChevronRight
        aria-hidden="true"
        strokeWidth={2}
        className="size-4 shrink-0 text-foreground-subtle"
      />
    </Link>
  );
}

export { ProfileCard };
export type { ProfileCardProps };
