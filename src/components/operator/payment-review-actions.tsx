"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  rejectPaymentAction,
  verifyPaymentAction,
} from "@/app/(operator)/operator/pembayaran/actions";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type PaymentReviewActionsProps = {
  readonly paymentId: string;
  readonly senderName: string;
};

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  payment_not_found: "Pembayaran tidak ditemukan.",
  payment_already_reviewed: "Pembayaran ini sudah ditinjau petugas lain.",
  reason_required: "Tulis alasan penolakan dulu.",
  invalid_input: "Alasan penolakan minimal 3 karakter.",
  facility_close_failed:
    "Gagal menutup fasilitas setelah cicilan terakhir — periksa data lalu coba lagi.",
};

function messageFor(code: string): string {
  return (
    ERROR_MESSAGES[code] ??
    "Ada gangguan di sisi kami. Coba lagi sebentar lagi."
  );
}

function PaymentReviewActions({
  paymentId,
  senderName,
}: PaymentReviewActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"verify" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    if (busy !== null) return;
    setBusy("verify");
    setError(null);
    const result = await verifyPaymentAction(paymentId);
    setBusy(null);
    if (result.ok) {
      router.refresh();
      return;
    }
    setError(messageFor(result.code));
  }

  async function reject() {
    if (busy !== null) return;
    if (reason.trim().length < 3) {
      setError("Tulis alasan penolakan dulu (minimal 3 karakter).");
      return;
    }
    setBusy("reject");
    setError(null);
    const result = await rejectPaymentAction({ paymentId, reason });
    setBusy(null);
    if (result.ok) {
      setOpen(false);
      setReason("");
      router.refresh();
      return;
    }
    setError(messageFor(result.code));
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="md"
          className="flex-1"
          onClick={() => void verify()}
          disabled={busy !== null}
        >
          {busy === "verify" ? "Memverifikasi..." : "Verifikasi & tandai lunas"}
        </Button>
        <Button
          size="md"
          variant="secondary"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
          disabled={busy !== null}
        >
          Tolak
        </Button>
      </div>
      {error === null ? null : (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      <DialogRoot
        open={open}
        onOpenChange={(next) => {
          if (busy !== null) return;
          setOpen(next);
          if (!next) {
            setReason("");
            setError(null);
          }
        }}
      >
        <DialogContent>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle>Tolak bukti transfer</DialogTitle>
            <DialogClose />
          </div>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">
            Kirim alasan yang jelas — mahasiswa melihat alasan ini di halaman
            Tagihan dan Notifikasi.
          </p>
          <label className="mt-3 flex flex-col gap-1.5">
            <span className="text-xs font-medium text-foreground">
              Alasan penolakan
            </span>
            <textarea
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={280}
              placeholder={`mis. nominal transfer tidak sesuai, atau bukti atas nama ${senderName} tidak terbaca`}
              className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm leading-6 text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
          </label>
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
              Batal
            </DialogClose>
            <Button
              size="lg"
              variant="destructive"
              className="flex-1"
              onClick={() => void reject()}
              disabled={busy !== null}
            >
              {busy === "reject" ? "Menolak..." : "Tolak bukti"}
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export { PaymentReviewActions };