import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";
import { BottomNav } from "@/components/app/bottom-nav";
import { MobileTopbar } from "@/components/app/mobile-topbar";

type AppShellProps = {
  readonly name: string;
  readonly email: string;
  readonly children: ReactNode;
};

function AppShell({ name, email, children }: AppShellProps) {
  return (
    <div className="min-h-svh lg:pl-[15.5rem]">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary focus:shadow-raised"
      >
        Langsung ke isi halaman
      </a>
      <AppSidebar name={name} email={email} />
      <div className="flex min-h-svh flex-col">
        <AppTopbar name={name} />
        <MobileTopbar name={name} />
        <div id="konten" className="flex flex-1 flex-col">
          {children}
        </div>
        <BottomNav className="mt-auto lg:hidden" />
      </div>
    </div>
  );
}

export { AppShell };
