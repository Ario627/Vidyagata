"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "h-11 w-full min-w-0 rounded-md border border-border-strong bg-surface px-3 text-base text-foreground",
  "placeholder:text-foreground-subtle",
  "transition-[color,background-color,border-color] duration-150 ease-out",
  "focus-visible:border-primary",
  "data-invalid:border-danger",
  "read-only:bg-surface-raised",
  "disabled:pointer-events-none disabled:bg-surface-raised disabled:text-foreground-subtle",
  "data-disabled:pointer-events-none data-disabled:bg-surface-raised data-disabled:text-foreground-subtle",
);

type InputProps = ComponentProps<typeof BaseInput>;

function Input({ className, ...props }: InputProps) {
  return (
    <BaseInput
      data-slot="input"
      className={cn(inputClassName, className)}
      {...props}
    />
  );
}

export { Input, inputClassName };
export type { InputProps };