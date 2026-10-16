"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { applyToJobAction } from "@/app/(app)/kerja/actions";
import {
  DocumentUpload,
  type UploadedDocument,
} from "@/components/account/document-upload";
import { Mascot } from "@/components/brand/brand";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { WithdrawApplicationButton } from "@/components/work/withdraw-application-button";
import type { ApplicationRef } from "@/data/applications";
import { cn } from "@/lib/utils";

type ApplyPanelProps = {
  readonly postingId: string;
  readonly postingTitle: string;
  readonly existing: ApplicationRef | null;
  readonly cvDocument: UploadedDocument | null;
};

const APPLY_MESSAGES: Readonly<Record<string, string>> = {
  invalid_input: "Data yang dikirim tidak valid.",
  student_profile_required:
    "Profil akademikmu belum ada. Profil dibuat otomatis saat kamu mengajukan pembiayaan.",
  cv_required:
    "Unggah CV-mu dulu di panel ini — mitra usaha selalu memintanya untuk menilai lamaran.",
  posting_not_found: "Lowongan tidak ditemukan.",
  posting_not_open: "Lowongan ini sudah tidak dibuka.",
  already_applied: "Kamu sudah melamar lowongan ini.",
};

const NOTE_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function ApplyPanel({
  postingId,
  postingTitle,
  existing,
  cvDocument,
}: ApplyPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cv, setCv] = useState<UploadedDocument | null>(cvDocument);

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await applyToJobAction({
      postingId,
      note: note.trim() === "" ? undefined : note,
    });
    setBusy(false);
    if (result.ok) {
      setOpen(false);
      setNote("");
      router.refresh();
      return;
    }
    if (result.code === "unauthenticated") {
      router.push("/masuk" as Route);
      return;
    }
    setError(
      APPLY_MESSAGES[result.code] ??
        "Ada gangguan di sisi kami. Coba lagi sebentar lagi.",
    );
  }

  if (existing === null) {
    const canApply = cv !== null;
    return (
      <>
        <Card className="mt-4">
          <CardContent className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle>1 · Siapkan CV-mu</CardTitle>
              <p className="text-xs leading-5 text-foreground-muted">
                Mitra usaha menjadikan CV sebagai penilaian pertama. Sekali
                unggah, CV ini dipakai untuk semua lamaranmu.
              </p>
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <DocumentUpload
              kind="cv"
              label="CV (PDF atau gambar)"
              hint="PDF paling disarankan. Maksimal 4 MB — cukup satu halaman rapi."
              allowPdf
              current={cv}
              onUploaded={setCv}
            />
          </CardContent>
        </Card>
        <Card className="mt-4">
          <CardContent>
            <CardTitle>2 · Kirim lamaran</CardTitle>
          </CardContent>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm leading-6 text-foreground-muted">
              {canApply
                ? "CV siap. Tambahkan catatan singkat kalau perlu, lalu kirim."
                : "Tombol lamar aktif setelah CV-mu terunggah di langkah pertama."}
            </p>
            <Button
              size="lg"
              disabled={!canApply}
              onClick={() => {
                setError(null);
                setOpen(true);
              }}
            >
              Lamar sekarang
            </Button>
          </CardContent>
        </Card>
        <DialogRoot
          open={open}
          onOpenChange={(next) => {
            if (busy) return;
            setOpen(next);
            if (!next) setError(null);
          }}
        >
          <DialogContent>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle>Kirim lamaran</DialogTitle>
              <DialogClose />
            </div>
            <p className="mt-3 text-sm leading-6 text-foreground-muted">
              {postingTitle}
            </p>
            <label className="mt-3 flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground">
                Catatan untuk mitra usaha (opsional)
              </span>
              <textarea
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={500}
                className={`${NOTE_CLASS} resize-none`}
                placeholder="mis. saya bisa mulai minggu depan, sore hari"
              />
              <span className="text-2xs leading-4 text-foreground-subtle">
                Maksimal 500 karakter.
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
                Batal
              </DialogClose>
              <Button
                size="lg"
                className="flex-1"
                onClick={() => void confirm()}
                disabled={busy}
              >
                {busy ? "Mengirim..." : "Kirim lamaran"}
              </Button>
            </div>
          </DialogContent>
        </DialogRoot>
      </>
    );
  }

  if (existing.status === "accepted") {
    return (
      <Card className="mt-4">
        <CardContent className="flex items-center gap-4">
          <Mascot name="pesta" sizes="80px" className="size-20 shrink-0" />
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle>Lamaran diterima</CardTitle>
            <p className="text-sm leading-6 text-foreground-muted">
              Selamat! Mitra usaha menerima lamaranmu untuk posisi ini. Detail
              penempatan akan dihubungi lewat kontak akunmu.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (existing.status === "shortlisted") {
    return (
      <Card className="mt-4">
        <CardContent className="flex items-center gap-4">
          <Mascot name="jempol" sizes="72px" className="size-18 shrink-0" />
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle>Masuk daftar pendek</CardTitle>
            <p className="text-sm leading-6 text-foreground-muted">
              Mitra usaha menandai lamaranmu sebagai kandidat kuat. Tetap pantau
              notifikasi — kabar berikutnya bisa datang kapan saja.
            </p>
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <WithdrawApplicationButton
            applicationId={existing.id}
            postingTitle={postingTitle}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardContent>
        <CardTitle>Lamaran terkirim</CardTitle>
      </CardContent>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm leading-6 text-foreground-muted">
          Mitra usaha akan meninjau CV dan catatanmu. Kamu bisa menariknya
          selama belum diputuskan.
        </p>
        <WithdrawApplicationButton
          applicationId={existing.id}
          postingTitle={postingTitle}
        />
      </CardContent>
    </Card>
  );
}

export { ApplyPanel };
