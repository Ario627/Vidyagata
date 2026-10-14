"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { withdrawApplicationAction } from "@/app/(app)/kerja/actions";
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

type WithdrawApplicationButtonProps = {
  readonly applicationId: string;
  readonly postingTitle: string;
};

const WITHDRAW_MESSAGES: Readonly<Record<string, string>> = {
  invalid_input: "Data yang dikirim tidak valid.",
  not_found: "Lamaran tidak ditemukan.",
  invalid_transition: "Lamaran ini sudah tidak bisa ditarik.",
  student_profile_required: "Profil akademikmu belum lengkap.",
};

function WithdrawApplicationButton({
  applicationId,
  postingTitle,
}: WithdrawApplicationButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await withdrawApplicationAction(applicationId);
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
    setError(
      WITHDRAW_MESSAGES[result.code] ??
        "Ada gangguan di sisi kami. Coba lagi sebentar lagi.",
    );
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
        Tarik lamaran
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-start justify-between gap-4">
          <DialogTitle>Tarik lamaran ini?</DialogTitle>
          <DialogClose />
        </div>
        <p className="mt-3 text-sm leading-6 text-foreground-muted">
          Lamaranmu untuk {postingTitle} akan ditarik. Kamu bisa melamar lagi
          kapan saja selama lowongannya masih dibuka.
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
            {busy ? "Menarik..." : "Ya, tarik"}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}

export { WithdrawApplicationButton };
