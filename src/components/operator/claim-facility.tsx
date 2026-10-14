"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { claimFacilityAction } from "@/app/(operator)/operator/actions";
import { Button } from "@/components/ui/button";

type ClaimFacilityProps = {
  readonly facilityId: string;
};

const CLAIM_MESSAGES: Readonly<Record<string, string>> = {
  invalid_input: "Pengajuan tidak dikenali.",
  facility_not_found:
    "Pengajuan tidak ditemukan atau sudah ditangani petugas lain.",
  invalid_transition: "Pengajuan ini sudah ditangani petugas lain.",
  mfa_required:
    "Aktifkan verifikasi dua langkah di halaman Keamanan sebelum meninjau pengajuan.",
};

function ClaimFacility({ facilityId }: ClaimFacilityProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await claimFacilityAction(facilityId);
    setBusy(false);
    if (result.ok) {
      router.refresh();
      return;
    }
    if (result.code === "unauthenticated") {
      router.push("/masuk" as Route);
      return;
    }
    setError(
      CLAIM_MESSAGES[result.code] ??
        "Ada gangguan di sisi kami. Coba lagi sebentar lagi.",
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <p className="text-sm leading-6 text-foreground-muted">
        Klaim pengajuan ini untuk mulai meninjau. Setelah diklaim, hanya kamu
        yang bisa memutuskan sampai dikembalikan.
      </p>
      {error === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button size="lg" onClick={() => void claim()} disabled={busy}>
        {busy ? "Mengklaim..." : "Mulai tinjau"}
      </Button>
    </div>
  );
}

export { ClaimFacility };
