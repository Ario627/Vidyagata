"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AuthHelp } from "@/components/auth/auth-help";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { evaluateAgeGate, localPlainDateOf } from "@/domain/account/age";
import type { PlainDate } from "@/domain/time/plain-date";
import { BirthdateInput } from "@/schemas/onboarding";
import { Route } from "next";

type StepBirthdateProps = {
  readonly initialValue: PlainDate | null;
  readonly onNext: (birthdate: PlainDate) => void;
};

const BIRTHDATE_MIN = "1900-01-01";

function StepBirthdate({ initialValue, onNext }: StepBirthdateProps) {
  const router = useRouter();
  const [value, setValue] = useState<string>(initialValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const today = localPlainDateOf(new Date());

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = BirthdateInput.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Tanggal lahir tidak valid");
      return;
    }
    const todayDate = localPlainDateOf(new Date());
    if (todayDate === null) {
      setError("Tanggal tidak bisa diverifikasi sekarang");
      return;
    }
    const decision = evaluateAgeGate(parsed.data, todayDate);
    if (decision.kind === "too_young") {
      router.push("/daftar/usia-belum-cukup" as Route);
      return;
    }
    setError(null);
    onNext(parsed.data);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <TextField
        label="Tanggal lahir"
        type="date"
        value={value}
        min={BIRTHDATE_MIN}
        max={today ?? BIRTHDATE_MIN}
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
            Kalau usiamu belum cukup, kamu diarahkan ke halaman edukasi tanpa
            akun dibuat — tanggalnya tidak dikirim ke mana pun.
          </p>
        </AuthHelp>
      </div>
      <Button type="submit" size="lg" className="w-full">
        Lanjut
      </Button>
    </form>
  );
}

export { StepBirthdate };