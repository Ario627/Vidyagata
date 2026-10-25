import { AppShell } from "@/components/app/app-shell";
import { requireUser } from "@/lib/session";

export const instant = false;

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  return (
    <AppShell name={user.name} email={user.email}>
      {children}
    </AppShell>
  );
}
