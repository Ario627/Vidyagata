import { BottomNav } from "@/components/app/bottom-nav";
import { requireUser } from "@/lib/session";

export const instant = false;

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireUser();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      {children}
      <BottomNav className="mt-auto" />
    </div>
  );
}
