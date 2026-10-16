"use client";

import { useMemo, useState } from "react";
import {
  DocumentUpload,
  type UploadedDocument,
} from "@/components/account/document-upload";
import { StatementPanel } from "@/components/account/statement-panel";
import { Button } from "@/components/ui/button";

type StepDocumentsProps = {
  readonly onComplete: () => void;
};

function missingLabels(input: {
  readonly ktm: UploadedDocument | null;
  readonly selfie: UploadedDocument | null;
  readonly statementSigned: boolean;
}): readonly string[] {
  const list: string[] = [];
  if (input.ktm === null) list.push("foto KTM/KTM digital");
  if (input.selfie === null) list.push("foto wajah");
  if (!input.statementSigned) list.push("tanda tangan surat pernyataan");
  return list;
}

function StepDocuments({ onComplete }: StepDocumentsProps) {
  const [documents, setDocuments] = useState<
    Readonly<Record<string, UploadedDocument>>
  >({});
  const [statementSigned, setStatementSigned] = useState(false);

  const ktm = documents.ktm ?? null;
  const selfie = documents.selfie ?? null;
  const ready = ktm !== null && selfie !== null && statementSigned;
  const missing = useMemo(
    () => missingLabels({ ktm, selfie, statementSigned }),
    [ktm, selfie, statementSigned],
  );

  function register(document: UploadedDocument) {
    setDocuments((current) => ({ ...current, [document.kind]: document }));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">
          Verifikasi dokumen
        </p>
        <p className="text-sm leading-6 text-foreground-muted">
          Dua foto dan satu surat pernyataan bertanda tangan. Foto diproses di
          perangkatmu dulu supaya hemat kuota, dan hanya bisa dilihat olehmu
          serta petugas verifikasi.
        </p>
      </div>
      <DocumentUpload
        kind="ktm"
        label="Foto KTM atau KTM digital"
        hint="Kartu mahasiswa terlihat jelas: nama, kampus, dan NIM terbaca."
        capture="environment"
        current={ktm}
        onUploaded={register}
      />
      <DocumentUpload
        kind="selfie"
        label="Foto wajah (selfie verifikasi)"
        hint="Ambil dari depan dengan pencahayaan cukup, tanpa kacamata gelap atau topi."
        capture="user"
        current={selfie}
        onUploaded={register}
      />
      <StatementPanel onSigned={() => setStatementSigned(true)} />
      <DocumentUpload
        kind="statement_signed"
        label="Unggahan surat bertanda tangan (opsional)"
        hint="Kalau kamu mencetak dan menandatangani surat di atas kertas, unggah hasil pindaiannya di sini."
        allowPdf
        current={documents.statement_signed ?? null}
        onUploaded={register}
      />
      {ready ? null : (
        <p className="text-xs leading-5 text-foreground-subtle">
          Tinggal {missing.join(", ")} sebelum bisa lanjut.
        </p>
      )}
      <Button
        size="lg"
        className="w-full"
        disabled={!ready}
        onClick={onComplete}
      >
        Selesai & masuk dashboard
      </Button>
    </div>
  );
}

export { StepDocuments };
