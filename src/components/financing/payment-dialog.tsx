"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Mascot } from "@/components/brand/brand";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { compressImageFile } from "@/lib/images/compress";
import { cn } from "@/lib/utils";

export const PAYMENT_DESTINATION = {
  bank: "BCA",
  accountNumber: "8830 0177 4455",
  accountHolder: "PT Vidyagata Edukasi Nusantara",
  label: "Rekening escrow pembiayaan",
} as const;

const MAX_BYTES = 4 * 1024 * 1024;

const FIELD_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  installment_not_found: "Cicilan tidak ditemukan.",
  installment_settled: "Cicilan ini sudah lunas.",
  amount_mismatch: "Nominal tidak sama dengan tagihan.",
  invalid_proof: "Bukti harus JPG, PNG, atau PDF maksimal 4 MB.",
  payment_pending_exists:
    "Sudah ada bukti transfer untuk cicilan ini yang menunggu verifikasi.",
  forbidden_origin: "Permintaan ditolak. Muat ulang halaman lalu coba lagi.",
};

type PaymentDialogProps = {
  readonly installmentId: string;
  readonly periodNo: number;
  readonly total: number;
  readonly totalText: string;
  readonly dueDateText: string;
  readonly label: string;
  readonly variant?: "primary" | "secondary";
};

function formatAmountParts(total: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(total)
    .replace(/^Rp\s?/, "");
}

function PaymentDialog({
  installmentId,
  periodNo,
  total,
  totalText,
  dueDateText,
  label,
  variant = "primary",
}: PaymentDialogProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setSenderName("");
    setNote("");
    setFileName(null);
    setError(null);
    setDone(false);
    setBusy(false);
    if (fileRef.current !== null) fileRef.current.value = "";
  }

  async function submit() {
    const input = fileRef.current;
    const file = input?.files?.[0] ?? null;
    if (senderName.trim().length < 3) {
      setError("Isi nama pengirim sesuai yang tercantum di bukti transfer.");
      return;
    }
    if (file === null) {
      setError("Pilih foto atau PDF bukti transfernya dulu.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const compressed = await compressImageFile(file);
      if (compressed.size > MAX_BYTES) {
        setError("Ukuran file melebihi 4 MB setelah dikompres.");
        setBusy(false);
        return;
      }
      const form = new FormData();
      form.set("installmentId", installmentId);
      form.set("amount", String(total));
      form.set("senderName", senderName.trim());
      if (note.trim() !== "") form.set("note", note.trim());
      form.set("file", compressed);
      const response = await fetch("/api/payments", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        code?: string;
        message?: string;
      } | null;
      if (!response.ok || payload?.ok !== true) {
        setError(
          payload?.message ??
            ERROR_MESSAGES[payload?.code ?? ""] ??
            "Unggahan gagal. Coba lagi sebentar lagi.",
        );
        setBusy(false);
        return;
      }
      setDone(true);
      setBusy(false);
      router.refresh();
    } catch {
      setError("Koneksi terputus saat mengunggah. Coba lagi.");
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        size="md"
        variant={variant === "primary" ? "primary" : "secondary"}
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        {label}
      </Button>
      <DialogRoot
        open={open}
        onOpenChange={(next) => {
          if (busy) return;
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle>
              {done ? "Bukti terkirim" : `Bayar cicilan ${periodNo}`}
            </DialogTitle>
            <DialogClose />
          </div>
          {done ? (
            <div className="mt-4 flex items-center gap-4">
              <Mascot name="jempol" sizes="72px" className="size-18 shrink-0" />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-sm leading-6 text-foreground-muted">
                  Bukti transfermu masuk antrean verifikasi petugas, maksimal 1
                  hari kerja. Cicilan akan berubah lunas setelah diverifikasi.
                </p>
                <p className="text-2xs leading-4 text-foreground-subtle">
                  Pantau halaman Notifikasi untuk kabar verifikasinya.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-3 rounded-xl border border-border bg-surface-raised p-4">
                <p className="text-xs text-foreground-muted">
                  Transfer tepat sebesar
                </p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
                  Rp{formatAmountParts(total)}
                </p>
                <dl className="mt-3 flex flex-col gap-1.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-foreground-muted">Bank</dt>
                    <dd className="font-medium text-foreground">
                      {PAYMENT_DESTINATION.bank}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-foreground-muted">Nomor rekening</dt>
                    <dd className="font-mono font-medium text-foreground">
                      {PAYMENT_DESTINATION.accountNumber}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-foreground-muted">Atas nama</dt>
                    <dd className="text-right font-medium text-foreground">
                      {PAYMENT_DESTINATION.accountHolder}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-2xs leading-4 text-foreground-subtle">
                  {PAYMENT_DESTINATION.label} · jatuh tempo {dueDateText} ·
                  nominal harus sama persis ({totalText})
                </p>
              </div>
              <label className="mt-4 flex flex-col gap-1.5">
                <span className="text-xs font-medium text-foreground">
                  Nama pengirim di bukti transfer
                </span>
                <input
                  value={senderName}
                  onChange={(event) => setSenderName(event.target.value)}
                  maxLength={120}
                  placeholder="Sesuai nama di rekening pengirim"
                  className={FIELD_CLASS}
                />
              </label>
              <label className="mt-3 flex flex-col gap-1.5">
                <span className="text-xs font-medium text-foreground">
                  Catatan (opsional)
                </span>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={280}
                  placeholder="mis. transfer dari rekening orang tua"
                  className={`${FIELD_CLASS} resize-none`}
                />
              </label>
              <label className="mt-3 flex flex-col gap-1.5">
                <span className="text-xs font-medium text-foreground">
                  Bukti transfer
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setFileName(file?.name ?? null);
                    setError(null);
                  }}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-raised file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-foreground"
                />
                <span className="text-2xs leading-4 text-foreground-subtle">
                  {fileName ?? "JPG, PNG, atau PDF — maksimal 4 MB."}
                </span>
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
                  Nanti saja
                </DialogClose>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => void submit()}
                  disabled={busy}
                >
                  {busy ? "Mengunggah..." : "Kirim bukti transfer"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </DialogRoot>
    </>
  );
}

export { PaymentDialog };