"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type PencairanDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly confirmLabel: string;
  readonly busy: boolean;
  readonly error: string | null;
  readonly destructive?: boolean;
  readonly onConfirm: () => void;
  readonly children: ReactNode;
};

function PencairanDialog({
  open,
  onOpenChange,
  title,
  confirmLabel,
  busy,
  error,
  destructive = false,
  onConfirm,
  children,
}: PencairanDialogProps) {
  return (
    <DialogRoot
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <div className="flex items-start justify-between gap-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogClose />
        </div>
        <div className="mt-3 flex flex-col gap-3 text-sm leading-6 text-foreground-muted">
          {children}
        </div>
        {error === null ? null : (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-5 flex items-center gap-2">
          <DialogClose
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "flex-1",
            )}
          >
            Tutup
          </DialogClose>
          <Button
            variant={destructive ? "destructive" : "primary"}
            size="lg"
            className="flex-1"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Memproses..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}

export { PencairanDialog };