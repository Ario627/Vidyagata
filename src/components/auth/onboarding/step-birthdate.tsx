"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { AuthHelp } from "@/components/auth/auth-help";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { localPlainDateOf } from "@/domain/account/age";
import type { PlainDate } from "@/domain/time/plain-date";
import { BirthdateInput } from "@/schemas/onboarding";

type StepBirthdateProps = {
  readonly initialValue: PlainDate | null;
  readonly onNext: (birthdate: PlainDate) => void;
};

const BIRTHDATE_MIN = "1900-01-01";

function StepBirthdate({ initialValue, onNext }: StepBirthdateProps) {
  const router = useRouter();
  const [value, setValue] = useState<string>(initialValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [today, setToday] = useState<PlainDate | null>(null);

  useEffect(() => {
    setToday(localPlainDateOf(new Date()));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checking) return;
    const parsed = BirthdateInput.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Tanggal lahir tidak valid");
      return;
    }
    setError(null);
    setChecking(true);
    try {
      const response = await fetch("/api/age-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthdate: parsed.data }),
      });
      if (!response.ok) {
        setError("Pemeriksaan usia gagal. Coba lagi sebentar lagi.");
        setChecking(false);
        return;
      }
      const data = (await response.json()) as { eligible?: boolean };
      if (data.eligible !== true) {
        router.push("/daftar/usia-belum-cukup" as Route);
        return;
      }
      onNext(parsed.data);
    } catch {
      setError("Koneksi bermasalah. Periksa jaringan lalu coba lagi.");
      setChecking(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <TextField
        label="Tanggal lahir"
        type="date"
        value={value}
        min={BIRTHDATE_MIN}
        max={today ?? undefined}
        autoComplete="bday"
        onChange={(event) => {
          setValue(event.target.value);
          if (error !== null) setError(null);
        }}
        error={error ?? undefined}
        description="Kami perlu tahu usiamu sebelum memproses data lain."
      />
      <div className="flex justify-end">
        <AuthHelp
          label="Kenapa tanggal lahir?"
          title="Kenapa kami menanyakan tanggal lahir"
        >
          <p>
            Aturan pelindungan data pribadi memperlakukan data pengguna di bawah
            umur secara khusus. Untuk layanan pembiayaan, kami hanya bisa
            memproses pengguna berusia 18 tahun ke atas.
          </p>
          <p>
            Kalau usiamu belum cukup, kamu diarahkan ke halaman penjelasan tanpa
            akun dibuat. Perangkat yang dipakai dicatat sementara agar
            pendaftaran ulang sebelum cukup umur bisa kami tolak — hanya
            gabungan alamat jaringan dan peramban yang diacak, tanpa tanggal
            lahir.
          </p>
        </AuthHelp>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={checking}>
        {checking ? "Memeriksa..." : "Lanjut"}
      </Button>
    </form>
  );
}

export { StepBirthdate };
