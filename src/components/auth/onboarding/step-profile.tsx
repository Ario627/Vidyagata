"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { FullNameInput } from "@/schemas/onboarding";

type StepProfileProps = {
  readonly onNext: () => void;
};

function StepProfile({ onNext }: StepProfileProps) {
  const [fullName, setFullName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [formIssue, setFormIssue] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const parsed = FullNameInput.safeParse(fullName);
    setNameError(
      parsed.success
        ? null
        : (parsed.error.issues[0]?.message ?? "Nama tidak valid"),
    );
    if (!parsed.success) return;
    setFormIssue(null);
    setPending(true);
    const updated = await authClient.updateUser({ name: parsed.data });
    if (updated.error) {
      setFormIssue(
        updated.error.message ??
          "Nama gagal disimpan. Coba lagi sebentar lagi.",
      );
      setPending(false);
      return;
    }
    onNext();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <TextField
        label="Nama lengkap"
        name="fullName"
        autoComplete="name"
        placeholder="Nama sesuai KTP"
        value={fullName}
        onChange={(event) => {
          setFullName(event.target.value);
          if (nameError !== null) setNameError(null);
        }}
        error={nameError ?? undefined}
        description="Dipakai di perjanjian dan dokumen resmi."
      />
      {formIssue === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {formIssue}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan & lanjut"}
      </Button>
    </form>
  );
}

export { StepProfile };
