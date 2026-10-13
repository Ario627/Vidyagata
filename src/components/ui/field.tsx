"use client";

import { Field } from "@base-ui/react/field";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

function FieldRoot({ className, ...props }: ComponentProps<typeof Field.Root>) {
  return (
    <Field.Root
      data-slot="field"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function FieldLabel({
  className,
  ...props
}: ComponentProps<typeof Field.Label>) {
  return (
    <Field.Label
      data-slot="field-label"
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  );
}

function FieldDescription({
  className,
  ...props
}: ComponentProps<typeof Field.Description>) {
  return (
    <Field.Description
      data-slot="field-description"
      className={cn("text-sm text-foreground-muted", className)}
      {...props}
    />
  );
}

function FieldError({
  className,
  ...props
}: ComponentProps<typeof Field.Error>) {
  return (
    <Field.Error
      data-slot="field-error"
      className={cn("text-sm text-danger", className)}
      {...props}
    />
  );
}

type TextFieldProps = ComponentProps<typeof Input> & {
  label: ReactNode;
  description?: ReactNode;
  error?: string;
  containerClassName?: string;
};

function TextField({
  label,
  description,
  error,
  className,
  containerClassName,
  ...props
}: TextFieldProps) {
  return (
    <FieldRoot invalid={error !== undefined} className={containerClassName}>
      <FieldLabel>{label}</FieldLabel>
      <Input className={className} {...props} />
      {description !== undefined ? (
        <FieldDescription>{description}</FieldDescription>
      ) : null}
      {error !== undefined ? <FieldError match>{error}</FieldError> : null}
    </FieldRoot>
  );
}

export { FieldDescription, FieldError, FieldLabel, FieldRoot, TextField };
