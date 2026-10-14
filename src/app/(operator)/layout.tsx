import { headers } from "next/headers";
import type { ReactNode } from "react";
import { MfaRedirect } from "@/components/operator/mfa-redirect";
import { OperatorHeader } from "@/components/operator/operator-header";
import { requireOperatorMfa } from "@/data/two-factor";
import { OPERATOR_MFA_PATH } from "@/domain/account/mfa-path";

export const instant = false;

export default async function OperatorLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { mfaRequired } = await requireOperatorMfa();
  const pathname = (await headers()).get("x-pathname");
  const gateActive = mfaRequired && pathname !== OPERATOR_MFA_PATH;
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <OperatorHeader />
      {gateActive ? <MfaRedirect /> : children}
    </div>
  );
}
