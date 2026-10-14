"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelApplicationAction } from "@/app/(app)/pembiayaan/actions";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type CancelFacilityProps = {
  readonly facilityId: string;
  readonly publicRef: string;
};

const CANCEL_MESSAGES: Readonly<Record<string, string>> = {
  invalid_input: "Pengajuan tidak dikenali.",
  unauthenticated: "Sesi kamu berakhir. Masuk lagi untuk melanjutkan.",
  facility_not_found: "Pengajuan tidak ditemukan.",
  invalid_transition: "Pengajuan ini sudah tidak bisa dibatalkan.",
};

function messageFor(code: string): string {
  return (
    CANCEL_MESSAGES[code] ??
    "Ada gangguan di sisi kami. Coba lagi sebentar lagi."
  );
}

function CancelFacility({ facilityId, publicRef }: CancelFacilityProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await cancelApplicationAction(facilityId);
    setBusy(false);
    if (result.ok) {
      setOpen(false);
      router.refresh();
      return;
    }
    if (result.code === "unauthenticated") {
      router.push("/masuk" as Route);
      return;
    }
    setError(messageFor(result.code));
  }

  return (
    <DialogRoot
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "lg" }),
          "w-full text-danger hover:bg-danger-soft hover:text-danger",
        )}
      >
        Batalkan pengajuan
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-start justify-between gap-4">
          <DialogTitle>Batalkan pengajuan ini?</DialogTitle>
          <DialogClose />
        </div>
        <p className="mt-3 text-sm leading-6 text-foreground-muted">
          Pengajuan {publicRef} akan dihentikan dan tidak bisa dilanjutkan lagi.
          Kamu bisa membuat pengajuan baru kapan saja.
        </p>
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
            Tidak jadi
          </DialogClose>
          <Button
            variant="destructive"
            size="lg"
            className="flex-1"
            onClick={() => void confirm()}
            disabled={busy}
          >
            {busy ? "Membatalkan..." : "Ya, batalkan"}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}

export { CancelFacility };
