"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  forwardFacilityAction,
  rejectFacilityAction,
} from "@/app/(operator)/operator/actions";
import { Button } from "@/components/ui/button";

type ReviewActionsProps = {
  readonly facilityId: string;
  readonly score: number;
  readonly minScore: number;
};

const ACTION_MESSAGES: Readonly<Record<string, string>> = {
  invalid_input: "Data keputusan tidak valid.",
  facility_not_found: "Pengajuan tidak lagi dalam portofoliomu.",
  invalid_transition: "Pengajuan ini sudah tidak bisa diputuskan.",
  reason_required: "Isi alasan dulu untuk keputusan ini.",
  lender_unavailable: "Belum ada mitra pembiayaan aktif.",
  eligibility_unavailable: "Penilaian kelayakan tidak tersedia.",
  mfa_required:
    "Aktifkan verifikasi dua langkah di halaman Keamanan sebelum mengambil keputusan.",
};

function messageFor(code: string): string {
  return (
    ACTION_MESSAGES[code] ??
    "Ada gangguan di sisi kami. Coba lagi sebentar lagi."
  );
}

function ReviewActions({ facilityId, score, minScore }: ReviewActionsProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"forward" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const belowThreshold = score < minScore;

  async function decide(decision: "forward" | "reject") {
    if (busy !== null) return;
    if (decision === "reject" && reason.trim() === "") {
      setError("Penolakan wajib disertai alasan yang bisa dibaca pengguna.");
      return;
    }
    if (decision === "forward" && belowThreshold && reason.trim() === "") {
      setError(
        `Skor ${score} di bawah ambang ${minScore}. Tulis alasan mengapa tetap diteruskan.`,
      );
      return;
    }
    setError(null);
    setBusy(decision);
    const result =
      decision === "forward"
        ? await forwardFacilityAction({ facilityId, reason })
        : await rejectFacilityAction({ facilityId, reason });
    setBusy(null);
    if (result.ok) {
      router.refresh();
      return;
    }
    if (result.code === "unauthenticated") {
      router.push("/masuk" as Route);
      return;
    }
    setError(messageFor(result.code));
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="operator-reason"
          className="text-sm font-medium text-foreground"
        >
          Catatan keputusan
        </label>
        <textarea
          id="operator-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          maxLength={500}
          placeholder={
            belowThreshold
              ? "Wajib: alasan meneruskan meski skor di bawah ambang"
              : "Wajib untuk penolakan; opsional untuk penerusan"
          }
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <p className="text-2xs leading-4 text-foreground-subtle">
          Catatan masuk ke audit log dan menjadi penjelasan bila pengguna
          meminta alasan keputusan.
        </p>
      </div>
      {error === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          className="flex-1"
          onClick={() => void decide("forward")}
          disabled={busy !== null}
        >
          {busy === "forward" ? "Meneruskan..." : "Teruskan ke mitra"}
        </Button>
        <Button
          variant="destructive"
          size="lg"
          className="flex-1"
          onClick={() => void decide("reject")}
          disabled={busy !== null}
        >
          {busy === "reject" ? "Menolak..." : "Tolak pengajuan"}
        </Button>
      </div>
    </div>
  );
}

export { ReviewActions };
