"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { SignaturePad } from "@/components/account/signature-pad";
import { Button } from "@/components/ui/button";

type StatementSignFormProps = {
  readonly onSigned?: () => void;
};

type SignResponse = {
  ok?: boolean;
  message?: string;
  fieldError?: string;
};

function StatementSignForm({ onSigned }: StatementSignFormProps) {
  const router = useRouter();
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [formIssue, setFormIssue] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (signatureImage === null) {
      setSignatureError("Gambar tanda tanganmu dulu di kotak yang tersedia.");
      return;
    }
    if (!agreed) {
      setFormIssue(
        "Centang pernyataan persetujuan dulu sebelum menandatangani.",
      );
      return;
    }
    setSignatureError(null);
    setFormIssue(null);
    setPending(true);
    let result: SignResponse = {};
    try {
      const response = await fetch("/api/statement", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureImage }),
      });
      result = (await response.json()) as SignResponse;
    } catch {
      result = { ok: false, message: "Koneksi terputus. Coba lagi." };
    }
    setPending(false);
    if (result.ok !== true) {
      if (result.fieldError !== undefined) setSignatureError(result.fieldError);
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
      <SignaturePad
        onChange={(value) => {
          setSignatureImage(value);
          if (signatureError !== null) setSignatureError(null);
        }}
        disabled={pending}
      />
      {signatureError === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {signatureError}
        </p>
      )}
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
        {pending ? "Menyimpan tanda tangan..." : "Tandatangani surat"}
      </Button>
      <p className="text-2xs leading-4 text-foreground-subtle">
        Tanda tangan tersimpan bersama waktu, versi surat, dan kode verifikasi —
        dan tidak bisa diubah setelah tersimpan.
      </p>
    </form>
  );
}

export { StatementSignForm };
