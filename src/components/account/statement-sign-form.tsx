"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";

type StatementSignFormProps = {
  readonly fullName: string;
  readonly onSigned?: () => void;
};

function StatementSignForm({ fullName, onSigned }: StatementSignFormProps) {
  const router = useRouter();
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [formIssue, setFormIssue] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!agreed) {
      setFormIssue(
        "Centang pernyataan persetujuan dulu sebelum menandatangani.",
      );
      return;
    }
    setFormIssue(null);
    setNameError(null);
    setPending(true);
    let result: { ok?: boolean; message?: string; fieldError?: string } = {};
    try {
      const response = await fetch("/api/statement", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedName }),
      });
      result = (await response.json()) as typeof result;
    } catch {
      result = { ok: false, message: "Koneksi terputus. Coba lagi." };
    }
    setPending(false);
    if (result.ok !== true) {
      if (result.fieldError !== undefined) setNameError(result.fieldError);
      if (result.message !== undefined) setFormIssue(result.message);
      return;
    }
    if (onSigned !== undefined) {
      onSigned();
      return;
    }
    router.refresh();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label="Tulis nama lengkapmu sebagai tanda tangan"
        name="signedName"
        autoComplete="name"
        placeholder={fullName}
        value={signedName}
        onChange={(event) => {
          setSignedName(event.target.value);
          if (nameError !== null) setNameError(null);
        }}
        error={nameError ?? undefined}
        description="Nama harus sama persis dengan nama di profilmu."
      />
      <label className="flex items-start gap-2.5 text-sm leading-6 text-foreground">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => {
            setAgreed(event.target.checked);
            if (formIssue !== null) setFormIssue(null);
          }}
          className="mt-1 size-4 shrink-0 rounded border-border-strong accent-primary"
        />
        Saya sudah membaca seluruh isi surat pernyataan ini dan menyetujui
        seluruh ketentuannya.
      </label>
      {formIssue === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {formIssue}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Menandatangani..." : "Tandatangani elektronik"}
      </Button>
      <p className="text-2xs leading-4 text-foreground-subtle">
        Tanda tangan elektronik ini tercatat di sistem bersama waktu, versi
        surat, dan kode verifikasi — dan tidak bisa diubah setelah tersimpan.
      </p>
    </form>
  );
}

export { StatementSignForm };