"use client";

import { OTPField } from "@base-ui/react/otp-field";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldRoot,
  TextField,
} from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";

const TOTP_CODE_LENGTH = 6;
const TOTP_FIELD_ID = "kode-autentikator";
const TOTP_SLOTS = Array.from(
  { length: TOTP_CODE_LENGTH },
  (_, index) => index,
);

type AuthIssue = {
  readonly code?: string | undefined;
  readonly message?: string | undefined;
};

type ScanState = {
  readonly totpUri: string;
  readonly backupCodes: readonly string[];
};

const GENERIC_MESSAGE = "Ada gangguan di sisi kami. Coba lagi sebentar lagi.";

function enableIssueMessage(issue: AuthIssue): string {
  switch (issue.code) {
    case "INVALID_PASSWORD":
      return "Kata sandi tidak cocok.";
    case "TOO_MANY_REQUESTS":
      return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
    default:
      return issue.message ?? GENERIC_MESSAGE;
  }
}

function verifyIssueMessage(issue: AuthIssue): string {
  switch (issue.code) {
    case "INVALID_CODE":
      return "Kode tidak cocok. Hapus entri Vidyagata lama di aplikasi autentikatormu, pastikan jam perangkat akurat, lalu coba lagi.";
    case "TOTP_CODE_ALREADY_USED":
      return "Kode ini sudah dipakai. Tunggu kode berikutnya di aplikasi autentikatormu lalu coba lagi.";
    case "ACCOUNT_TEMPORARILY_LOCKED":
      return "Terlalu banyak kode salah. Akun terkunci sementara, coba lagi 15 menit kemudian.";
    case "TOO_MANY_REQUESTS":
      return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
    default:
      return issue.message ?? GENERIC_MESSAGE;
  }
}

function secretFromUri(uri: string): string {
  try {
    return new URL(uri).searchParams.get("secret") ?? "";
  } catch {
    return "";
  }
}

function groupSecret(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

function BackupCodes({ codes }: { readonly codes: readonly string[] }) {
  return (
    <ul className="grid grid-cols-2 gap-1.5">
      {codes.map((entry) => (
        <li
          key={entry}
          className="rounded-md bg-surface-raised px-2 py-1.5 text-center font-mono text-sm text-foreground"
        >
          {entry}
        </li>
      ))}
    </ul>
  );
}

function EnabledPanel({ scope }: { readonly scope: "operator" | "personal" }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold text-foreground">
        Verifikasi dua langkah aktif
      </p>
      <p className="text-sm leading-6 text-foreground-muted">
        {scope === "operator"
          ? "Setiap masuk ke akun operator ini butuh kode dari aplikasi autentikatormu. Kode pemulihan hanya tampil saat pengaturan awal — kalau hilang, minta admin mengatur ulang."
          : "Setiap masuk ke akunmu sekarang butuh kode dari aplikasi autentikator. Kode pemulihan hanya tampil saat pengaturan awal — simpan di tempat aman."}
      </p>
    </div>
  );
}

function TwoFactorSetup({
  enabled,
  scope = "personal",
}: {
  readonly enabled: boolean;
  readonly scope?: "operator" | "personal";
}) {
  const router = useRouter();
  const [scan, setScan] = useState<ScanState | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [enableIssue, setEnableIssue] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeIssue, setCodeIssue] = useState<string | null>(null);
  const [pending, setPending] = useState<"enable" | "verify" | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  async function handleEnable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending !== null) return;
    const nextPasswordError =
      password.length === 0 ? "Kata sandi wajib diisi" : null;
    setPasswordError(nextPasswordError);
    if (nextPasswordError !== null) return;
    setEnableIssue(null);
    setPending("enable");
    const { data, error } = await authClient.twoFactor.enable({ password });
    setPending(null);
    if (error) {
      setEnableIssue(enableIssueMessage(error));
      return;
    }
    if (!data || data.method !== "totp") {
      setEnableIssue(GENERIC_MESSAGE);
      return;
    }
    setPassword("");
    setScan({ totpUri: data.totpURI, backupCodes: data.backupCodes });
  }

  async function handleVerify(value: string) {
    if (pending !== null || value.length !== TOTP_CODE_LENGTH) return;
    setCodeIssue(null);
    setPending("verify");
    const { error } = await authClient.twoFactor.verifyTotp({ code: value });
    setPending(null);
    if (error) {
      setCodeIssue(verifyIssueMessage(error));
      setCode("");
      return;
    }
    setConfirmed(true);
    await authClient.revokeOtherSessions().catch(() => undefined);
    router.refresh();
  }

  if (enabled || confirmed) {
    return <EnabledPanel scope={scope} />;
  }

  if (scan === null) {
    return (
      <form noValidate onSubmit={handleEnable} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-semibold text-foreground">
            Verifikasi dua langkah belum aktif
          </p>
          <p className="text-sm leading-6 text-foreground-muted">
            Siapkan aplikasi autentikator (Google Authenticator, Authy, atau
            sejenisnya), lalu konfirmasi kata sandimu untuk mulai.
          </p>
        </div>
        <TextField
          label="Kata sandi"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Kata sandimu"
          description="Dipakai untuk mengonfirmasi bahwa ini benar kamu."
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (passwordError !== null) setPasswordError(null);
          }}
          error={passwordError ?? undefined}
        />
        {enableIssue === null ? null : (
          <p role="alert" className="text-sm text-danger">
            {enableIssue}
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={pending !== null}
        >
          {pending === "enable" ? "Menyiapkan..." : "Mulai pengaturan"}
        </Button>
      </form>
    );
  }

  const secret = secretFromUri(scan.totpUri);

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <p className="text-sm font-semibold text-foreground">Pindai kode QR</p>
        <p className="text-sm leading-6 text-foreground-muted">
          Buka aplikasi autentikator, tambah akun baru, lalu pindai kode ini.
        </p>
        <p className="text-2xs leading-4 text-foreground-subtle">
          Kode QR berubah setiap kali kamu memulai pengaturan ulang — hapus
          entri Vidyagata lama di aplikasi sebelum memindai yang baru.
        </p>
        <div className="w-fit rounded-lg border border-border bg-white p-3">
          <QRCodeSVG
            value={scan.totpUri}
            size={164}
            level="M"
            title="Kode QR autentikator"
          />
        </div>
        {secret === "" ? null : (
          <p className="text-xs leading-5 text-foreground-subtle">
            Tidak bisa memindai? Masukkan kunci ini secara manual:{" "}
            <span className="font-mono text-foreground">
              {groupSecret(secret)}
            </span>
          </p>
        )}
      </section>
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <p className="text-sm font-semibold text-foreground">
          Simpan kode pemulihan
        </p>
        <p className="text-sm leading-6 text-foreground-muted">
          Kode ini hanya ditampilkan sekali. Pakai salah satunya kalau perangkat
          autentikatormu hilang.
        </p>
        <BackupCodes codes={scan.backupCodes} />
      </section>
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
        <p className="text-sm font-semibold text-foreground">
          Konfirmasi kode dari aplikasi
        </p>
        <FieldRoot invalid={codeIssue !== null}>
          <FieldLabel htmlFor={TOTP_FIELD_ID}>Kode 6 digit</FieldLabel>
          <OTPField.Root
            id={TOTP_FIELD_ID}
            length={TOTP_CODE_LENGTH}
            value={code}
            disabled={pending !== null}
            onValueChange={(value) => {
              setCode(value);
              if (codeIssue !== null) setCodeIssue(null);
            }}
            onValueComplete={(value) => {
              void handleVerify(value);
            }}
            className="flex items-center gap-2"
          >
            {TOTP_SLOTS.map((index) => (
              <OTPField.Input
                key={index}
                autoFocus={index === 0}
                className="h-11 w-10 rounded-md border border-border-strong bg-surface text-center text-lg font-medium text-foreground data-disabled:bg-surface-raised data-invalid:border-danger"
              />
            ))}
          </OTPField.Root>
          <FieldDescription>Kode berganti setiap 30 detik.</FieldDescription>
          {codeIssue === null ? null : (
            <FieldError match>{codeIssue}</FieldError>
          )}
        </FieldRoot>
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            void handleVerify(code);
          }}
          disabled={pending !== null || code.length !== TOTP_CODE_LENGTH}
        >
          {pending === "verify"
            ? "Memverifikasi..."
            : "Aktifkan verifikasi dua langkah"}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="w-full"
          disabled={pending !== null}
          onClick={() => {
            setScan(null);
            setCode("");
            setCodeIssue(null);
          }}
        >
          Mulai ulang pengaturan
        </Button>
      </section>
    </div>
  );
}

export { TwoFactorSetup };
