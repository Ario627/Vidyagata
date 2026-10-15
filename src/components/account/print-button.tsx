"use client";

import { Button } from "@/components/ui/button";

function PrintButton() {
  return (
    <Button
      variant="secondary"
      size="md"
      onClick={() => {
        window.print();
      }}
    >
      Unduh / cetak PDF
    </Button>
  );
}

export { PrintButton };