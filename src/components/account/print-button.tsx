"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PrintButtonProps = {
  readonly className?: string;
  readonly label?: string;
};

function PrintButton({ className, label = "Unduh PDF" }: PrintButtonProps) {
  return (
    <Button
      variant="secondary"
      size="md"
      className={cn(className)}
      onClick={() => {
        window.print();
      }}
    >
      {label}
    </Button>
  );
}

export { PrintButton };
