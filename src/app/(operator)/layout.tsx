import type { ReactNode } from "react";
import { OperatorShell } from "@/components/operator/operator-shell";
import { requireRole } from "@/data/dal";
import { getCurrentUser } from "@/lib/session";

export const instant = false;

export default async function OperatorLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  await requireRole("operator");
  const user = await getCurrentUser();
  return (
    <OperatorShell name={user?.name ?? "Operator"} email={user?.email ?? ""}>
      {children}
    </OperatorShell>
  );
}
