"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import {
  executeDisbursementAction,
  initiateDisbursementAction,
  recordAgreementAction,
  recordLenderDecisionAction,
  withdrawDisbursementAction,
} from "@/app/(operator)/operator/pencairan/actions";
import { FourEyesExplainer } from "@/components/operator/four-eyes-explainer";
import { PencairanDialog } from "@/components/operator/pencairan-dialog";
import { pencairanErrorMessage } from "@/components/operator/pencairan-messages";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import type { PencairanDetail } from "@/data/disbursements";
import type { OperatorWriteResult } from "@/data/operator";
import { formatIDR } from "@/lib/format/currency";
import { formatInstantWib } from "@/lib/format/date";

type MakerPanelProps = {
  readonly detail: PencairanDetail;
};

type MakerSheet =
  | "lender-approve"
  | "lender-reject"
  | "agreement"
  | "initiate"
  | "withdraw"
  | "execute";

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function PanelSection({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <h2 className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function MakerPanel({ detail }: MakerPanelProps) {
  const router = useRouter();
  const [sheet, setSheet] = useState<MakerSheet | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [agreementNote, setAgreementNote] = useState("");
  const [transferReference, setTransferReference] = useState("");

  const { permissions, latestRequest } = detail;

  function openSheet(next: MakerSheet) {
    setError(null);
    setSheet(next);
  }

  async function run(next: MakerSheet): Promise<OperatorWriteResult> {
    switch (next) {
      case "lender-approve":
        return recordLenderDecisionAction({
          facilityId: detail.facilityId,
          decision: "approved",
        });
      case "lender-reject":
        return recordLenderDecisionAction({
          facilityId: detail.facilityId,
          decision: "rejected",
          reason: rejectReason,
        });
      case "agreement":
        return recordAgreementAction({
          facilityId: detail.facilityId,
          note: agreementNote,
        });
      case "initiate":
        return initiateDisbursementAction(detail.facilityId);
      case "withdraw":
        return withdrawDisbursementAction(detail.facilityId);
      case "execute":
        return executeDisbursementAction({
          facilityId: detail.facilityId,
          transferReference,
        });
    }
  }

  async function confirm() {
    const current = sheet;
    if (current === null || busy) return;
    setBusy(true);
    setError(null);
    const result = await run(current);
    setBusy(false);
    if (result.ok) {
      setSheet(null);
      setRejectReason("");
      setAgreementNote("");
      setTransferReference("");
      router.refresh();
      return;
    }
    if (result.code === "unauthenticated") {
      router.push("/masuk" as Route);
      return;
    }
    setError(pencairanErrorMessage(result.code));
  }

  return (
    <div className="flex flex-col gap-4">
      {permissions.recordLenderDecision ? (
        <PanelSection title="Keputusan mitra">
          <p className="text-sm leading-6 text-foreground-muted">
            Catat keputusan mitra pembiayaan pilot di sini supaya alur berjalan
            tanpa portal mitra. Persetujuan menetapkan nominal, tenor, margin
            dan service fee final untuk pengajuan ini.
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => openSheet("lender-approve")}
            >
              Setujui
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => openSheet("lender-reject")}
            >
              Tolak
            </Button>
          </div>
        </PanelSection>
      ) : null}

      {permissions.recordAgreement ? (
        <PanelSection title="Perjanjian">
          <p className="text-sm leading-6 text-foreground-muted">
            Catat perjanjian yang sudah ditandatangani mahasiswa. Sertakan
            keterangan singkat sebagai jejak audit — nomor arsip atau kanal
            tanda tangan.
          </p>
          <Button size="lg" onClick={() => openSheet("agreement")}>
            Catat perjanjian
          </Button>
        </PanelSection>
      ) : null}

      {permissions.initiate ? (
        <PanelSection title="Ajukan pencairan">
          <p className="text-sm leading-6 text-foreground-muted">
            Ajukan pencairan{" "}
            {detail.approvedAmount === null
              ? ""
              : `${formatIDR(detail.approvedAmount)} `}
            ke rekening {detail.institutionName ?? "kampus"}. Setelah diajukan,
            persetujuan harus datang dari petugas lain. <FourEyesExplainer />
          </p>
          <Button size="lg" onClick={() => openSheet("initiate")}>
            Ajukan pencairan
          </Button>
        </PanelSection>
      ) : null}

      {permissions.withdraw && latestRequest !== null ? (
        <PanelSection title="Menunggu persetujuan">
          <p className="text-sm leading-6 text-foreground-muted">
            Diajukan {formatInstantWib(latestRequest.initiatedAt)}. Petugas lain
            harus menyetujui sebelum transfer bisa dicatat.
          </p>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => openSheet("withdraw")}
          >
            Batalkan permintaan
          </Button>
        </PanelSection>
      ) : null}

      {permissions.execute && latestRequest !== null ? (
        <PanelSection title="Catat bukti transfer">
          <p className="text-sm leading-6 text-foreground-muted">
            Disetujui
            {latestRequest.decidedByName === null
              ? ""
              : ` oleh ${latestRequest.decidedByName}`}
            . Setelah transfer bank dilakukan, catat nomor buktinya. Status
            berubah menjadi Dicairkan dan ledger mencatat pengeluaran ini.
          </p>
          <Button size="lg" onClick={() => openSheet("execute")}>
            Catat bukti transfer
          </Button>
        </PanelSection>
      ) : null}

      {permissions.awaitingOtherParty &&
      !permissions.withdraw &&
      latestRequest !== null ? (
        <PanelSection title="Menunggu petugas lain">
          <p className="text-sm leading-6 text-foreground-muted">
            {latestRequest.status === "requested"
              ? "Permintaan ini sudah kamu ajukan. Persetujuan datang dari petugas lain."
              : `Sudah disetujui${
                  latestRequest.decidedByName === null
                    ? ""
                    : ` oleh ${latestRequest.decidedByName}`
                }. Menunggu ${latestRequest.initiatedByName} mencatat bukti transfer.`}
          </p>
        </PanelSection>
      ) : null}

      <PencairanDialog
        open={sheet === "lender-approve"}
        onOpenChange={(next) => {
          if (!next) setSheet(null);
        }}
        title="Setujui pembiayaan ini?"
        confirmLabel="Setujui"
        busy={busy}
        error={error}
        onConfirm={() => void confirm()}
      >
        <p>
          Nominal disetujui mengikuti pengajuan:{" "}
          {detail.requestedAmount === null
            ? "belum ada"
            : formatIDR(detail.requestedAmount)}
          . Tenor {detail.tenorMonths ?? "-"} bulan.
        </p>
        <p>
          Margin dan service fee mengikuti parameter mitra pembiayaan yang
          berlaku — bukan angka yang bisa diubah dari sini.
        </p>
      </PencairanDialog>

      <PencairanDialog
        open={sheet === "lender-reject"}
        onOpenChange={(next) => {
          if (!next) setSheet(null);
        }}
        title="Tolak pembiayaan ini?"
        confirmLabel="Tolak"
        busy={busy}
        error={error}
        destructive
        onConfirm={() => void confirm()}
      >
        <p>
          Pengajuan {detail.publicRef} ditutup dan mahasiswa melihat
          penolakannya. Alasan wajib diisi dan tercatat di audit.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground">
            Alasan penolakan
          </span>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            className={`${INPUT_CLASS} resize-none`}
            placeholder="mis. dokumen akademik tidak sesuai"
          />
        </label>
      </PencairanDialog>

      <PencairanDialog
        open={sheet === "agreement"}
        onOpenChange={(next) => {
          if (!next) setSheet(null);
        }}
        title="Catat perjanjian ditandatangani"
        confirmLabel="Catat"
        busy={busy}
        error={error}
        onConfirm={() => void confirm()}
      >
        <p>
          Perjanjian menjadi dasar hukum pencairan. Catatan ini tersimpan di
          audit log dan tidak bisa diubah.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground">
            Keterangan perjanjian
          </span>
          <textarea
            rows={3}
            value={agreementNote}
            onChange={(event) => setAgreementNote(event.target.value)}
            className={`${INPUT_CLASS} resize-none`}
            placeholder="mis. ditandatangani daring 14 Okt 2026, arsip OP-2026-001"
          />
          <span className="text-2xs leading-4 text-foreground-subtle">
            Minimal 10 karakter.
          </span>
        </label>
      </PencairanDialog>

      <PencairanDialog
        open={sheet === "initiate"}
        onOpenChange={(next) => {
          if (!next) setSheet(null);
        }}
        title="Ajukan pencairan?"
        confirmLabel="Ajukan"
        busy={busy}
        error={error}
        onConfirm={() => void confirm()}
      >
        <p>
          {detail.approvedAmount === null
            ? "Nominal belum ditetapkan."
            : `${formatIDR(detail.approvedAmount)} `}
          dikirim ke rekening {detail.institutionName ?? "kampus"}. Sekali
          diajukan, kamu tidak bisa menyetujuinya sendiri.
        </p>
      </PencairanDialog>

      <PencairanDialog
        open={sheet === "withdraw"}
        onOpenChange={(next) => {
          if (!next) setSheet(null);
        }}
        title="Batalkan permintaan pencairan?"
        confirmLabel="Ya, batalkan"
        busy={busy}
        error={error}
        destructive
        onConfirm={() => void confirm()}
      >
        <p>
          Permintaan yang menunggu persetujuan akan ditarik. Kamu bisa
          mengajukan ulang kapan saja.
        </p>
      </PencairanDialog>

      <PencairanDialog
        open={sheet === "execute"}
        onOpenChange={(next) => {
          if (!next) setSheet(null);
        }}
        title="Catat bukti transfer"
        confirmLabel="Catat"
        busy={busy}
        error={error}
        onConfirm={() => void confirm()}
      >
        <p>
          Tulis nomor bukti transfer bank. Tanpa bukti, status tidak boleh
          berubah menjadi Dicairkan.
        </p>
        <TextField
          label="Nomor bukti transfer"
          value={transferReference}
          onChange={(event) => setTransferReference(event.target.value)}
          placeholder="mis. TRF-20261014-001"
        />
      </PencairanDialog>
    </div>
  );
}

export { MakerPanel };