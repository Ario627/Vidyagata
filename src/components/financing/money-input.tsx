"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import type { ChangeEvent, ComponentProps } from "react";
import { inputClassName } from "@/components/ui/input";
import { formatIDRDigits } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

type MoneyInputProps = Omit<
  ComponentProps<typeof BaseInput>,
  "type" | "value" | "defaultValue" | "onChange" | "onValueChange"
> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
};

function toDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function toAmount(digits: string): number | null {
  return digits === "" ? null : Number(digits);
}

function MoneyInput({
  value,
  onValueChange,
  className,
  ...props
}: MoneyInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onValueChange(toAmount(toDigits(event.target.value)));
  }

  return (
    <BaseInput
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      value={value === null ? "" : formatIDRDigits(String(value))}
      onChange={handleChange}
      className={cn(inputClassName, "tabular-nums", className)}
      {...props}
    />
  );
}

export { MoneyInput };
export type { MoneyInputProps };