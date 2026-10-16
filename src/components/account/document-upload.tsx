"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { compressImageFile } from "@/lib/images/compress";

export type UploadedDocument = {
  readonly id: string;
  readonly kind: string;
  readonly mime: string;
  readonly byteSize: number;
  readonly updatedAt: string;
};

type DocumentUploadProps = {
  readonly kind: string;
  readonly label: string;
  readonly hint: string;
  readonly capture?: "user" | "environment";
  readonly allowPdf?: boolean;
  readonly current: UploadedDocument | null;
  readonly onUploaded: (document: UploadedDocument) => void;
};

const MAX_CLIENT_BYTES = 4 * 1024 * 1024;

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  invalid_kind: "Jenis dokumen tidak dikenal.",
  invalid_type: "Format file tidak didukung. Pakai JPG, PNG, atau PDF.",
  too_large: "Ukuran file melebihi 4 MB setelah dikompres.",
  profile_incomplete: "Lengkapi profil akademik dulu sebelum mengunggah.",
  forbidden_origin: "Permintaan ditolak. Muat ulang halaman lalu coba lagi.",
};

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function DocumentUpload({
  kind,
  label,
  hint,
  capture,
  allowPdf = false,
  current,
  onUploaded,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploaded, setUploaded] = useState<UploadedDocument | null>(current);
  const [issue, setIssue] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  async function handleFile(file: File) {
    setIssue(null);
    setPending(true);
    try {
      const compressed = await compressImageFile(file);
      if (compressed.size > MAX_CLIENT_BYTES) {
        setIssue(ERROR_MESSAGES.too_large ?? null);
        return;
      }
      const form = new FormData();
      form.set("kind", kind);
      form.set("file", compressed);
      const response = await fetch("/api/documents", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        code?: string;
        message?: string;
        document?: UploadedDocument;
      } | null;
      if (
        !response.ok ||
        payload?.ok !== true ||
        payload.document === undefined
      ) {
        setIssue(
          payload?.message ??
            ERROR_MESSAGES[payload?.code ?? ""] ??
            "Unggahan gagal. Coba lagi.",
        );
        return;
      }
      setUploaded(payload.document);
      setPreviewKey((value) => value + 1);
      onUploaded(payload.document);
    } catch {
      setIssue("Koneksi terputus saat mengunggah. Coba lagi.");
    } finally {
      setPending(false);
      if (inputRef.current !== null) inputRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs leading-5 text-foreground-muted">{hint}</p>
        </div>
        <Badge variant={uploaded === null ? "neutral" : "success"}>
          {uploaded === null ? "Belum ada" : "Terunggah"}
        </Badge>
      </CardContent>
      {uploaded === null ? null : uploaded.mime.startsWith("image/") ? (
        <CardContent className="pt-0">
          <Image
            key={previewKey}
            src={`/api/documents/${uploaded.id}?v=${uploaded.updatedAt}`}
            alt={label}
            width={720}
            height={405}
            unoptimized
            className="h-36 w-full rounded-lg border border-border object-cover"
          />
          <p className="mt-2 text-2xs text-foreground-subtle">
            {formatSize(uploaded.byteSize)} · hanya kamu dan petugas verifikasi
            yang bisa melihat
          </p>
        </CardContent>
      ) : (
        <CardContent className="pt-0">
          <a
            href={`/api/documents/${uploaded.id}`}
            className="text-sm font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
          >
            Buka dokumen terunggah ({formatSize(uploaded.byteSize)})
          </a>
        </CardContent>
      )}
      <CardContent className="flex flex-col gap-2 pt-0">
        <input
          ref={inputRef}
          type="file"
          accept={
            allowPdf
              ? "image/jpeg,image/png,application/pdf"
              : "image/jpeg,image/png"
          }
          capture={capture}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file !== undefined) void handleFile(file);
          }}
        />
        <Button
          variant="secondary"
          size="md"
          className="w-full"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending
            ? "Mengunggah..."
            : uploaded === null
              ? "Pilih file"
              : "Ganti file"}
        </Button>
        {issue === null ? null : (
          <p role="alert" className="text-xs text-danger">
            {issue}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export { DocumentUpload };
