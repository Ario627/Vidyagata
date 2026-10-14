import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type StepDocumentsProps = {
  readonly onComplete: () => void;
};

const DOCUMENT_POINTS = [
  {
    title: "Yang akan diminta",
    body: "Foto KTP dan selfie verifikasi — hanya jika kamu melanjutkan ke pengajuan pembiayaan.",
  },
  {
    title: "Kenapa diperlukan",
    body: "Mitra pembiayaan berizin wajib memverifikasi identitas sebelum memproses pengajuan apa pun.",
  },
  {
    title: "Cara kami menjaganya",
    body: "Dokumen diproses oleh penyedia verifikasi berlisensi, tidak pernah tampil di antarmuka biasa, dan setiap aksesnya tercatat.",
  },
];

function StepDocuments({ onComplete }: StepDocumentsProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">
          Verifikasi dokumen
        </p>
        <Badge variant="info">Segera hadir</Badge>
      </div>
      <p className="text-sm leading-6 text-foreground-muted">
        Akunmu sudah siap. Verifikasi dokumen dibuka nanti, tepat sebelum kamu
        mengajukan pembiayaan — supaya datamu hanya diproses saat benar-benar
        diperlukan.
      </p>
      <ul className="flex flex-col gap-3">
        {DOCUMENT_POINTS.map((point) => (
          <li
            key={point.title}
            className="rounded-lg bg-surface-raised px-4 py-3"
          >
            <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-subtle">
              {point.title}
            </p>
            <p className="mt-1 text-sm leading-6 text-foreground">
              {point.body}
            </p>
          </li>
        ))}
      </ul>
      <Button size="lg" className="w-full" onClick={onComplete}>
        Masuk ke dashboard
      </Button>
      <p className="text-center text-2xs text-foreground-subtle">
        Kamu akan diminta melengkapi dokumen ini sebelum pengajuan pembiayaan.
      </p>
    </div>
  );
}

export { StepDocuments };
