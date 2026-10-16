"use client";

import { useRouter } from "next/navigation";
import {
  DocumentUpload,
  type UploadedDocument,
} from "@/components/account/document-upload";

type StatementPaperUploadProps = {
  readonly current: UploadedDocument | null;
};

function StatementPaperUpload({ current }: StatementPaperUploadProps) {
  const router = useRouter();
  return (
    <DocumentUpload
      kind="statement_signed"
      label="Unggah surat bertanda tangan"
      hint="Hasil pindaian surat yang sudah ditandatangani di kertas — JPG, PNG, atau PDF."
      allowPdf
      current={current}
      onUploaded={() => {
        router.refresh();
      }}
    />
  );
}

export { StatementPaperUpload };