import type { StatementState } from "@/data/documents";

function formatSignedAt(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

function SignatureBlock({ state }: { readonly state: StatementState }) {
  if (state.signedAt === null || state.signedName === null) {
    return (
      <div className="rounded-lg border border-border bg-surface-raised p-3">
        <p className="text-xs leading-5 text-foreground-muted">
          Belum ditandatangani. Surat ini perlu kamu tandatangani secara
          elektronik sebelum pengajuan pembiayaan bisa diproses.
        </p>
      </div>
    );
  }
  return (
    <dl className="flex flex-col gap-1 rounded-lg border border-border bg-surface-raised p-3 text-xs">
      <div className="flex justify-between gap-3">
        <dt className="text-foreground-muted">Ditandatangani oleh</dt>
        <dd className="font-medium text-foreground">{state.signedName}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-foreground-muted">Waktu</dt>
        <dd className="text-foreground">{formatSignedAt(state.signedAt)}</dd>
      </div>
      {state.statementHash === null ? null : (
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-foreground-muted">Kode verifikasi</dt>
          <dd className="truncate font-mono text-2xs text-foreground-subtle">
            {state.statementHash.slice(0, 16)}
          </dd>
        </div>
      )}
    </dl>
  );
}

function StatementBody({ state }: { readonly state: StatementState }) {
  return (
    <article className="flex flex-col gap-4">
      <header className="border-border border-b pb-3">
        <h2 className="text-base font-semibold text-foreground">
          {state.title}
        </h2>
        <p className="mt-1 text-2xs text-foreground-subtle">
          {state.version} · Vidyagata
        </p>
      </header>
      <div className="flex flex-col gap-3 text-sm leading-6 text-foreground">
        {state.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 40)} className="text-pretty">
            {paragraph}
          </p>
        ))}
        <p className="text-pretty text-foreground-muted">
          Dibuat dan ditandatangani di {state.city} melalui platform Vidyagata.
        </p>
      </div>
      <SignatureBlock state={state} />
    </article>
  );
}

export { StatementBody };