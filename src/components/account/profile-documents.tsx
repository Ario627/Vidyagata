"use client";

import { useRouter } from "next/navigation";
import { DocumentUpload } from "@/components/account/document-upload";
import type { StudentDocumentMeta } from "@/data/documents";

type ProfileDocumentsProps = {
  readonly documents: readonly StudentDocumentMeta[];
};

function ProfileDocuments({ documents }: ProfileDocumentsProps) {
  const router = useRouter();
  const byKind = new Map(
    documents.map((document) => [document.kind, document]),
  );
  const refresh = () => {
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3">
      <DocumentUpload
        kind="ktm"
        label="Foto KTM atau KTM digital"
        hint="Kartu mahasiswa terlihat jelas: nama, kampus, dan NIM terbaca."
        capture="environment"
        current={byKind.get("ktm") ?? null}
        onUploaded={refresh}
      />
      <DocumentUpload
        kind="selfie"
        label="Foto wajah (selfie verifikasi)"
        hint="Ambil dari depan dengan pencahayaan cukup, tanpa kacamata gelap atau topi."
        capture="user"
        current={byKind.get("selfie") ?? null}
        onUploaded={refresh}
      />
      <DocumentUpload
        kind="statement_signed"
        label="Unggahan surat bertanda tangan (opsional)"
        hint="Kalau surat sudah kamu tandatangani di kertas, unggah hasil pindaiannya di sini."
        allowPdf
        current={byKind.get("statement_signed") ?? null}
        onUploaded={refresh}
      />
    </div>
  );
}

export { ProfileDocuments };