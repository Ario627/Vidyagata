"use client";

import type { ReactNode } from "react";
import {
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AuthHelpProps = {
  readonly label: string;
  readonly title: string;
  readonly children: ReactNode;
};

function AuthHelp({ label, title, children }: AuthHelpProps) {
  return (
    <DialogRoot>
      <DialogTrigger className="rounded-sm text-2xs font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        {label}
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-start justify-between gap-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogClose />
        </div>
        <div className="mt-3 flex flex-col gap-3 text-sm leading-6 text-foreground-muted">
          {children}
        </div>
      </DialogContent>
    </DialogRoot>
  );
}

export { AuthHelp };