import type { ReactNode } from "react";
import { OperatorHeader } from "@/components/operator/operator-header";
import { requireRole } from "@/data/dal";

export const instant = false;

export default async function OperatorLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  await requireRole("operator");
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <OperatorHeader />
      {children}
    </div>
  );
}
