"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const DialogRoot = BaseDialog.Root;

const DialogTrigger = BaseDialog.Trigger;

function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      data-slot="dialog-title"
      className={cn(
        "text-lg font-semibold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function DialogClose({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseDialog.Close>) {
  return (
    <BaseDialog.Close
      data-slot="dialog-close"
      aria-label={children === undefined ? "Tutup" : undefined}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full text-foreground-muted",
        "transition-colors duration-150 ease-out hover:bg-surface-raised hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
      {...props}
    >
      {children ?? <X aria-hidden="true" className="size-4" />}
    </BaseDialog.Close>
  );
}

function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseDialog.Popup>) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop
        data-slot="dialog-backdrop"
        className="fixed inset-0 z-50 bg-ink-900/40 transition-opacity duration-200 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0"
      />
      <BaseDialog.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-lg flex-col",
          "max-h-[85dvh] overflow-y-auto overscroll-contain",
          "rounded-t-2xl border border-border bg-surface px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-raised",
          "outline-none",
          "transition-[opacity,translate] duration-200 ease-out",
          "data-starting-style:translate-y-8 data-starting-style:opacity-0",
          "data-ending-style:translate-y-8 data-ending-style:opacity-0",
          "motion-reduce:transition-none",
          "sm:inset-y-0 sm:my-auto sm:h-fit sm:max-w-md sm:rounded-2xl",
          className,
        )}
        {...props}
      >
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export { DialogClose, DialogContent, DialogRoot, DialogTitle, DialogTrigger };
