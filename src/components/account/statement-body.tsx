import Image from "next/image";
import type { StatementState } from "@/data/documents";
import {
  STATEMENT_LETTERHEAD,
  STATEMENT_LETTERHEAD_TAGLINE,
} from "@/domain/legal/statement";

const JAKARTA_TIME_ZONE = "Asia/Jakarta";

function formatLetterDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: JAKARTA_TIME_ZONE,
  }).format(new Date(iso));
}

function formatSignedAt(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: JAKARTA_TIME_ZONE,
  }).format(new Date(iso));
}

function Letterhead({ number }: { readonly number: string }) {
  return (
    <header className="flex items-end justify-between gap-4 border-ink-900 border-b-2 pb-3">
      <div className="flex flex-col">
        <p className="text-lg font-semibold uppercase tracking-[0.22em] text-ink-900">
          {STATEMENT_LETTERHEAD}
        </p>
        <p className="mt-0.5 text-2xs text-foreground-muted">
          {STATEMENT_LETTERHEAD_TAGLINE}
        </p>
      </div>
      <dl className="text-right text-2xs">
        <dt className="text-foreground-subtle">Nomor dokumen</dt>
        <dd className="font-mono font-medium text-ink-900">{number}</dd>
      </dl>
    </header>
  );
}

function IdentityBlock({ state }: { readonly state: StatementState }) {
  return (
    <>
      <p className="text-sm leading-6 text-ink-900">
        Yang bertanda tangan di bawah ini:
      </p>
      <dl className="flex flex-col gap-1 pl-4 text-sm leading-6">
        {state.identityRows.map((row) => (
          <div key={row.label} className="flex gap-2">
            <dt className="w-32 shrink-0 text-foreground-muted">{row.label}</dt>
            <dd className="min-w-0 font-medium text-ink-900">
              <span className="mr-1 text-foreground-muted">:</span>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-sm leading-6 text-ink-900">
        selanjutnya disebut sebagai{" "}
        <span className="font-semibold">Mahasiswa</span>, dengan ini menyatakan
        hal-hal berikut:
      </p>
    </>
  );
}

function ClauseList({ state }: { readonly state: StatementState }) {
  return (
    <ol className="flex list-decimal flex-col gap-2.5 pl-5 text-sm leading-6 text-ink-900">
      {state.clauses.map((clause) => (
        <li key={clause.slice(0, 48)} className="text-pretty pl-1">
          {clause}
        </li>
      ))}
    </ol>
  );
}

function SignatureBlock({ state }: { readonly state: StatementState }) {
  const signed = state.signedAt !== null;
  return (
    <div className="flex justify-end">
      <div className="flex w-64 flex-col text-sm leading-6 text-ink-900">
        <p>
          {state.city}, {formatLetterDate(state.issuedAt)}
        </p>
        <p className="mt-1">Hormat saya,</p>
        <div className="flex h-20 items-center justify-center">
          {signed && state.signatureImage !== null ? (
            <Image
              src={state.signatureImage}
              alt={`Tanda tangan ${state.signedName ?? ""}`}
              width={256}
              height={80}
              unoptimized
              className="max-h-20 w-auto max-w-full object-contain"
            />
          ) : (
            <span className="h-full w-full border-border border-b border-dotted" />
          )}
        </div>
        <p className="border-ink-900 border-t pt-1 text-center font-semibold">
          {state.signedName ?? state.fullName}
        </p>
        <p className="mt-0.5 text-center text-2xs text-foreground-muted">
          Mahasiswa
        </p>
        {signed ? (
          <p className="mt-1 text-center text-2xs text-foreground-muted">
            Ditandatangani elektronik{" "}
            {state.signedAt === null ? "" : formatSignedAt(state.signedAt)}
          </p>
        ) : (
          <p className="mt-1 text-center text-2xs text-foreground-subtle">
            Belum ditandatangani
          </p>
        )}
      </div>
    </div>
  );
}

function StatementBody({ state }: { readonly state: StatementState }) {
  return (
    <article className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5 print:rounded-none print:border-0 print:p-0">
      <Letterhead number={state.documentNumber} />
      <h1 className="text-center text-base font-semibold uppercase tracking-[0.28em] text-ink-900">
        {state.title}
      </h1>
      <IdentityBlock state={state} />
      <ClauseList state={state} />
      <p className="text-sm leading-6 text-ink-900">{state.closing}</p>
      <SignatureBlock state={state} />
      <footer className="border-border border-t pt-2 text-2xs leading-4 text-foreground-subtle">
        Dokumen ini diterbitkan melalui platform Vidyagata.
        {state.statementHash === null
          ? " Belum ada tanda tangan elektronik tersimpan."
          : ` Kode verifikasi tanda tangan: ${state.statementHash.slice(0, 16)}.`}
      </footer>
    </article>
  );
}

export { StatementBody };
