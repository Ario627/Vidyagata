import type { Metadata, Route } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/data/dal";
import { listMyRoleAssignments } from "@/data/roles";
import { isTwoFactorEnabled } from "@/data/two-factor";
import { formatInstantWib } from "@/lib/format/date";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Profil operator",
  robots: { index: false, follow: false },
};

export const instant = false;

const ROLE_LABELS: Readonly<Record<string, string>> = {
  student: "Mahasiswa",
  employer: "Mitra usaha",
  operator: "Operator",
  institution_verifier: "Verifikator kampus",
};

function InfoRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-sm text-foreground-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

export default async function OperatorProfilePage() {
  const actor = await requireRole("operator");
  const user = await getCurrentUser();
  const assignments = await listMyRoleAssignments();
  const mfaEnabled = await isTwoFactorEnabled(actor.id);
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-6">
      <PageHeader
        eyebrow="Operator"
        title="Profil operator"
        description="Identitas, peran, dan status keamanan akun konsol ini."
      />
      <Card className="mt-6">
        <CardContent>
          <CardTitle>Identitas</CardTitle>
        </CardContent>
        <CardContent>
          <dl className="flex flex-col divide-y divide-border">
            <InfoRow label="Nama" value={user?.name ?? "Tanpa nama"} />
            <InfoRow label="Email" value={user?.email ?? "-"} />
            <InfoRow
              label="Verifikasi dua langkah"
              value={mfaEnabled ? "Aktif" : "Belum aktif"}
            />
          </dl>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardContent>
          <CardTitle>Peran aktif</CardTitle>
        </CardContent>
        <CardContent className="flex flex-col gap-3">
          {assignments.map((assignment) => (
            <div
              key={`${assignment.role}-${assignment.grantedAt}`}
              className="flex items-start justify-between gap-3"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {ROLE_LABELS[assignment.role] ?? assignment.role}
                </span>
                {assignment.reason === null ? null : (
                  <span className="text-2xs leading-4 text-foreground-subtle">
                    {assignment.reason}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-xs text-foreground-muted">
                sejak {formatInstantWib(assignment.grantedAt)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Link
        href={"/operator/keamanan" as Route}
        className={cn(
          buttonVariants({ variant: "secondary", size: "lg" }),
          "mt-4 w-full",
        )}
      >
        Kelola keamanan akun
      </Link>
    </main>
  );
}
