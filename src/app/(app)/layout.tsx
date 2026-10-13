import { BottomNav } from "@/components/app/bottom-nav";

export const ensureStatic = "shell";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      {children}
      <BottomNav className="mt-auto" />
    </div>
  );
}