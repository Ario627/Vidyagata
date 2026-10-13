"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { type ButtonVariantProps, buttonVariants } from "./button-variants";

type ButtonProps = ComponentProps<typeof BaseButton> & ButtonVariantProps;

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

export { Button };
export type { ButtonProps };
