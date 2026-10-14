"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { decideDisbursementAction } from "@/app/(operator)/operator/pencairan/actions";
import { PencairanDialog } from "@/components/operator/pencairan-dialog";
import { pencairanErrorMessage } from "@/components/operator/pencairan-messages";
import { Button } from "@/components/ui/button";
import type { PencairanDetail } from "@/data/disbursements";
import type { OperatorWriteResult } from "@/data/operator";
import { formatIDR } from "@/lib/format/currency";
import { formatInstantWib } from "@/lib/format/date";

type CheckerPanelProps = {
  readonly detail: PencairanDetail;
};

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function CheckerPanel({ detail }: CheckerPanelProps) {
  const router = useRouter();
  const [sheet, setSheet] = useState<"approve" | "reject" | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = detail.latestRequest;

  async function run(next: "approve" | "reject"): Promise<OperatorWriteResult> {
    return decideDisbursementAction({
      facilityId: detail.facilityId,
      decision: next === "approve" ? "approved" : "rejected",
      reason: next === "reject" ? reason : undefined,
      confirmDestination: next === "approve" ? confirmed : false,
    });
  }

  async function confirm(next: "approve" | "reject") {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await run(next);
    setBusy(false);
    if (result.ok) {
      setSheet(null);
      setReason("");
      router.refresh();
      return;
    }
    if (result.code === "unauthenticated") {
      router.push("/masuk" as Route);
      return;
    }
    setError(pencairanErrorMessage(result.code));
  }

  if (request === null) return null;

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Periksa sebelum menyetujui
        </h2>
        <dl className="flex flex-col divide-y divide-border">
          <div className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-sm text-foreground-muted">Nominal</dt>
            <dd className="text-sm font-medium tabular-nums text-foreground">
              {formatIDR(request.amount)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-sm text-foreground-muted">Tujuan</dt>
            <dd className="text-right text-sm font-medium text-foreground">
              {request.destinationName}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-sm text-foreground-muted">Diajukan</dt>
            <dd className="text-right text-sm font-medium text-foreground">
              {request.initiatedByName} ·{" "}
              {formatInstantWib(request.initiatedAt)}
            </dd>
          </div>
        </dl>
        <label className="flex items-start gap-2.5 rounded-lg bg-surface-raised p-3">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span className="text-sm leading-6 text-foreground-muted">
            Saya sudah memverifikasi tujuan dan nominal pencairan ini sesuai
            dokumen.
          </span>
        </label>
        <div className="flex items-center gap-2">
          <Button
            size="lg"
            className="flex-1"
            disabled={!confirmed || busy}
            onClick={() => {
              setError(null);
              setSheet("approve");
            }}
          >
            Setujui
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => {
              setError(null);
              setSheet("reject");
            }}
          >
            Tolak
          </Button>
        </div>
        <p className="text-2xs leading-4 text-foreground-subtle">
          Persetujuan tercatat atas namamu di audit log. Kamu tidak bisa
          menyetujui permintaan yang kamu ajukan sendiri.
        </p>
      </section>

      <PencairanDialog
        open={sheet === "approve"}
        onOpenChange={(next) => {
          if (!next) setSheet(null);
        }}
        title="Setujui pencairan ini?"
        confirmLabel="Setujui"
        busy={busy}
        error={error}
        onConfirm={() => void confirm("approve")}
      >
        <p>
          {formatIDR(request.amount)} akan boleh ditransfer ke{" "}
          {request.destinationName} oleh petugas yang mengajukan.
        </p>
      </PencairanDialog>

      <PencairanDialog
        open={sheet === "reject"}
        onOpenChange={(next) => {
          if (!next) setSheet(null);
        }}
        title="Tolak permintaan pencairan?"
        confirmLabel="Tolak"
        busy={busy}
        error={error}
        destructive
        onConfirm={() => void confirm("reject")}
      >
        <p>
          Pengaju bisa memperbaiki dan mengajukan ulang. Alasan wajib diisi.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground">Alasan</span>
          <textarea
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={`${INPUT_CLASS} resize-none`}
            placeholder="mis. rekening tujuan berbeda dengan perjanjian"
          />
        </label>
      </PencairanDialog>
    </div>
  );
}

export { CheckerPanel };
