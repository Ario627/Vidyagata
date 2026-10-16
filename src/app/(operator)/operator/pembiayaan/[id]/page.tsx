import type { Metadata, Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { PURPOSE_LABELS, STATUS_META } from "@/components/financing/labels";
import { ClaimFacility } from "@/components/operator/claim-facility";
import { ReviewActions } from "@/components/operator/review-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/data/dal";
import { getReviewDetail } from "@/data/operator";

const DOCUMENT_LABELS: Readonly<Record<string, string>> = {
  ktm: "Kartu mahasiswa",
  selfie: "Foto wajah",
  statement_signed: "Surat bertanda tangan",
  cv: "CV",
  purpose_proof: "Bukti penggunaan dana",
};

import { getFacilityDocumentsOverview } from "@/data/documents";
import type { EligibilityFactor } from "@/domain/financing/eligibility";
import { formatIDR } from "@/lib/format/currency";
import { formatInstantWib } from "@/lib/format/date";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tinjau pengajuan",
  robots: { index: false, follow: false },
};

export const instant = false;

const DIRECTION_MARKS: Readonly<
  Record<EligibilityFactor["direction"], string>
> = {
  up: "+",
  down: "−",
  neutral: "·",
};

function InfoRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-sm text-foreground-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

function FactorRow({ factor }: { readonly factor: EligibilityFactor }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <span className="flex min-w-0 items-start gap-2">
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 w-3 shrink-0 text-center font-mono text-sm",
            factor.direction === "up"
              ? "text-success"
              : factor.direction === "down"
                ? "text-danger"
                : "text-foreground-subtle",
          )}
        >
          {DIRECTION_MARKS[factor.direction]}
        </span>
        <span className="text-sm text-foreground-muted">{factor.value}</span>
      </span>
      <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
        {factor.points}
      </span>
    </div>
  );
}

export default async function OperatorReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("operator");
  const { id } = await params;
  const detail = await getReviewDetail(id);
  if (detail === null) notFound();
  const documents = await getFacilityDocumentsOverview(id);
  const meta = STATUS_META[detail.status];
  const gpaText =
    detail.studentGpaHundredths === null
      ? "Belum ada"
      : (detail.studentGpaHundredths / 100).toFixed(2).replace(".", ",");

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        eyebrow={detail.publicRef}
        title={
          detail.requestedAmount === null
            ? "Pengajuan pembiayaan"
            : formatIDR(detail.requestedAmount)
        }
        description={detail.institutionName ?? "Kampus belum dipilih"}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={meta.variant}>{meta.label}</Badge>
        {detail.submittedAt === null ? null : (
          <span className="text-xs text-foreground-subtle">
            diajukan {formatInstantWib(detail.submittedAt)}
          </span>
        )}
      </div>
      <Card className="mt-6">
        <CardContent>
          <CardTitle>Profil mahasiswa</CardTitle>
        </CardContent>
        <CardContent>
          <dl className="flex flex-col divide-y divide-border">
            <InfoRow label="Nama" value={detail.studentName} />
            <InfoRow
              label="Semester"
              value={
                detail.studentSemester === null
                  ? "Belum diisi"
                  : String(detail.studentSemester)
              }
            />
            <InfoRow label="IPK" value={gpaText} />
            <InfoRow
              label="Tujuan pembiayaan"
              value={
                detail.academicPurpose === null
                  ? "Belum dipilih"
                  : PURPOSE_LABELS[detail.academicPurpose]
              }
            />
          </dl>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardContent className="flex items-center justify-between gap-3">
          <CardTitle>Rencana penggunaan dana</CardTitle>
          <Badge
            variant={detail.proofDocumentId === null ? "warning" : "success"}
          >
            {detail.proofDocumentId === null
              ? "Bukti belum ada"
              : "Bukti terlampir"}
          </Badge>
        </CardContent>
        <CardContent className="flex flex-col gap-3">
          {detail.purposeNote === null ? (
            <p className="text-sm text-foreground-muted">
              Mahasiswa belum menulis rencana penggunaan dana — minta
              melengkapinya sebelum meneruskan pengajuan.
            </p>
          ) : (
            <p className="text-sm leading-6 text-foreground">
              {detail.purposeNote}
            </p>
          )}
          {detail.proofDocumentId === null ? null : (
            <a
              href={`/api/documents/${detail.proofDocumentId}`}
              className="text-sm font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
            >
              Buka dokumen bukti
            </a>
          )}
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardContent className="flex items-center justify-between gap-3">
          <CardTitle>Dokumen mahasiswa</CardTitle>
          <Badge
            variant={
              documents.statementSignedAt === null ? "warning" : "success"
            }
          >
            {documents.statementSignedAt === null
              ? "Surat belum ditandatangani"
              : "Surat ditandatangani"}
          </Badge>
        </CardContent>
        <CardContent className="flex flex-col gap-3">
          {documents.documents.length === 0 ? (
            <p className="text-xs leading-5 text-foreground-muted">
              Mahasiswa belum mengunggah dokumen apa pun. Minta melengkapi lewat
              halaman profil sebelum meneruskan pengajuan.
            </p>
          ) : (
            documents.documents.map((document) => (
              <div key={document.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-foreground">
                    {DOCUMENT_LABELS[document.kind] ?? document.kind}
                  </span>
                  <a
                    href={`/api/documents/${document.id}`}
                    className="text-sm font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
                  >
                    {document.mime === "application/pdf"
                      ? "Unduh PDF"
                      : "Buka penuh"}
                  </a>
                </div>
                {document.mime.startsWith("image/") ? (
                  <Image
                    src={`/api/documents/${document.id}`}
                    alt="Dokumen mahasiswa"
                    width={720}
                    height={405}
                    unoptimized
                    className="h-40 w-full rounded-lg border border-border bg-surface-raised object-cover"
                  />
                ) : null}
              </div>
            ))
          )}
          {documents.statementHash === null ? null : (
            <p className="text-2xs text-foreground-subtle">
              Kode verifikasi surat:{" "}
              <span className="font-mono">
                {documents.statementHash.slice(0, 16)}
              </span>
            </p>
          )}
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardContent className="flex items-baseline justify-between gap-3">
          <CardTitle>Penilaian kelayakan</CardTitle>
          <span className="text-2xl font-semibold tabular-nums text-foreground">
            {detail.eligibility.score}
            <span className="text-xs font-medium text-foreground-subtle">
              {" "}
              / 100
            </span>
          </span>
        </CardContent>
        <CardContent>
          <div className="flex flex-col divide-y divide-border">
            {detail.eligibility.factors.map((factor) => (
              <FactorRow key={factor.code} factor={factor} />
            ))}
          </div>
        </CardContent>
        <CardContent className="border-border border-t pt-4">
          <p className="text-2xs leading-4 text-foreground-subtle">
            Ambang penerusan {detail.minScore}. Skor di bawah ambang tetap bisa
            diteruskan dengan alasan tertulis — keputusan akhir selalu di tangan
            operator, bukan mesin.
          </p>
        </CardContent>
      </Card>
      {detail.status === "submitted" ? (
        <div className="mt-4">
          <ClaimFacility facilityId={detail.id} />
        </div>
      ) : null}
      {detail.claimedByMe && detail.status === "under_review" ? (
        <div className="mt-4">
          <ReviewActions
            facilityId={detail.id}
            score={detail.eligibility.score}
            minScore={detail.minScore}
          />
        </div>
      ) : null}
      {detail.status === "forwarded_to_lender" ? (
        <p className="mt-4 text-sm text-foreground-muted">
          Sudah diteruskan ke mitra pembiayaan
          {detail.claimedByName === null
            ? "."
            : ` oleh ${detail.claimedByName}.`}
        </p>
      ) : null}
      <Link
        href={"/operator/antrian" as Route}
        className={cn(
          buttonVariants({ variant: "secondary", size: "lg" }),
          "mt-4 w-full",
        )}
      >
        Kembali ke antrian
      </Link>
    </main>
  );
}
