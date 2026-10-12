"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium",
    "transition-[color,background-color,border-color,transform] duration-150 ease-out",
    "active:scale-[0.98] motion-reduce:transform-none",
    "disabled:pointer-events-none disabled:opacity-60",
    "data-disabled:pointer-events-none data-disabled:opacity-60",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary:
          "border border-border-strong bg-surface text-foreground hover:bg-surface-raised",
        ghost:
          "text-foreground-muted hover:bg-surface-raised hover:text-foreground",
        destructive: "bg-danger text-primary-foreground hover:bg-danger-hover",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-5 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<typeof BaseButton> &
  VariantProps<typeof buttonVariants>;

function Button({
  className,
  variant,
  size,
  type = "button",
  focusableWhenDisabled = true,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      type={type}
      focusableWhenDisabled={focusableWhenDisabled}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };