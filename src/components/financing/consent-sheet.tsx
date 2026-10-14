"use client";

import {
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ConsentDefinition } from "@/data/consents";
import { formatInstantWib } from "@/lib/format/date";

type ConsentSheetProps = {
  readonly consent: ConsentDefinition;
};

function ConsentSheet({ consent }: ConsentSheetProps) {
  return (
    <DialogRoot>
      <DialogTrigger className="rounded-sm text-2xs font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Baca teks lengkap persetujuan
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-start justify-between gap-4">
          <DialogTitle>{consent.title}</DialogTitle>
          <DialogClose />
        </div>
        <p className="mt-1 text-2xs text-foreground-subtle">
          Versi {consent.version} · berlaku sejak{" "}
          {formatInstantWib(consent.effectiveFrom)}
        </p>
        <div className="mt-4 flex flex-col gap-3 text-sm leading-6 text-foreground-muted">
          {consent.body.split("\n").map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>
      </DialogContent>
    </DialogRoot>
  );
}

export { ConsentSheet };
