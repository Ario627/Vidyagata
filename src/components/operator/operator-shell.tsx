import type { ReactNode } from "react";
import { OperatorHeader } from "@/components/operator/operator-header";
import { OperatorSidebar } from "@/components/operator/operator-sidebar";
import { OperatorTopbar } from "@/components/operator/operator-topbar";

type OperatorShellProps = {
  readonly name: string;
  readonly email: string;
  readonly children: ReactNode;
};

function OperatorShell({ name, email, children }: OperatorShellProps) {
  return (
    <div className="min-h-svh bg-background lg:pl-[15.5rem]">
      <OperatorSidebar name={name} email={email} />
      <div className="flex min-h-svh flex-col">
        <OperatorTopbar name={name} />
        <OperatorHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

export { OperatorShell };
