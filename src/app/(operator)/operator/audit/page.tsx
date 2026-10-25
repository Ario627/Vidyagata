import { ScrollText, Search } from "lucide-react";
import type { Metadata } from "next";
import Form from "next/form";
import { PageShell } from "@/components/app/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/data/dal";
import { type AuditTrailItem, listAuditTrail } from "@/data/operator";
import { formatInstantWib } from "@/lib/format/date";

export const metadata: Metadata = {
  title: "Jejak audit",
  robots: { index: false, follow: false },
};

export const instant = false;

const ACTION_GROUPS: Readonly<Record<string, string>> = {
  financing: "Pembiayaan",
  installment: "Pembayaran",
  job: "Lamaran",
  student: "Mahasiswa",
  user: "Akun",
  auth: "Auth",
};

function actionGroup(action: string): string {
  const prefix = action.split(".")[0] ?? action;
  return ACTION_GROUPS[prefix] ?? prefix;
}

function AuditRow({ item }: { readonly item: AuditTrailItem }) {
  return (
    <li className="flex flex-col gap-1.5 py-3.5 first:pt-0 last:pb-0 lg:grid lg:grid-cols-[10rem_minmax(0,1fr)_9rem] lg:items-start lg:gap-4">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-surface-raised px-1.5 py-0.5 text-2xs font-medium text-foreground-muted">
          {actionGroup(item.action)}
        </span>
        <span className="font-mono text-2xs text-foreground-subtle lg:hidden">
          {formatInstantWib(item.occurredAt)}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-mono text-xs font-medium text-foreground">
          {item.action}
        </span>
        <span className="text-2xs text-foreground-muted">
          {item.actorName ?? item.actorType} · {item.entityType} ·{" "}
          <span className="font-mono">{item.entityId}</span>
        </span>
        {item.reason === null ? null : (
          <span className="text-2xs leading-4 text-foreground-subtle">
            Alasan: {item.reason}
          </span>
        )}
        <span className="text-2xs text-foreground-subtle">
          Rekaman: {item.hasBefore ? "sebelum" : "—"} /{" "}
          {item.hasAfter ? "sesudah" : "—"}
        </span>
      </div>
      <span className="hidden text-right text-2xs text-foreground-subtle lg:block">
        {formatInstantWib(item.occurredAt)}
      </span>
    </li>
  );
}

export default async function OperatorAuditPage({
  searchParams,
}: PageProps<"/operator/audit">) {
  await requireRole("operator");
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (raw ?? "").trim().slice(0, 60);
  const items = await listAuditTrail({ query, limit: 100 });

  return (
    <PageShell
      title="Jejak audit"
      description="Setiap perubahan status, keputusan, dan pencatatan uang tersimpan append-only. Gunakan pencarian untuk menelusuri aksi atau entitas."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <section className="flex min-w-0 flex-col gap-4">
          <Form action={"/operator/audit"} className="relative">
            <label htmlFor="audit-search" className="sr-only">
              Cari jejak audit
            </label>
            <Search
              aria-hidden="true"
              strokeWidth={1.8}
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-foreground-subtle"
            />
            <Input
              id="audit-search"
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Cari aksi, tipe entitas, atau ID"
              autoComplete="off"
              enterKeyHint="search"
              className="h-10 rounded-lg pr-4 pl-10 text-sm"
            />
          </Form>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-2xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
              {query === "" ? "100 aktivitas terakhir" : `Hasil untuk "${query}"`}
            </h2>
            <span className="text-2xs text-foreground-subtle">
              {items.length} baris
            </span>
          </div>
          {items.length === 0 ? (
            <EmptyState
              className="rounded-xl border border-border border-dashed bg-surface"
              icon={ScrollText}
              title="Tidak ada jejak yang cocok"
              description="Coba kata kunci lain, misalnya nama aksi seperti financing.status_changed."
            />
          ) : (
            <Card className="gap-0 shadow-none">
              <CardContent>
                <ul className="divide-y divide-border">
                  {items.map((item) => (
                    <AuditRow key={item.id} item={item} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </section>
        <aside className="flex flex-col gap-3">
          <Card className="gap-0 shadow-none">
            <CardContent className="pb-3">
              <h2 className="text-sm font-semibold text-foreground">
                Cara membaca
              </h2>
            </CardContent>
            <CardContent className="flex flex-col gap-2 text-xs leading-5 text-foreground-muted">
              <p>
                Baris audit tidak bisa diubah atau dihapus. Koreksi dilakukan
                dengan mencatat aksi baru, bukan menimpa yang lama.
              </p>
              <p>
                Aksi operator selalu menyertakan alasan. Kalau alasan kosong,
                sistem menolak mencatatnya.
              </p>
              <p className="text-2xs text-foreground-subtle">
                Data pribadi diminimalkan. Snapshot hanya memuat field yang
                berubah.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
