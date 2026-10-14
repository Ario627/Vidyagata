"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { OPERATOR_MFA_PATH } from "@/domain/account/mfa-path";

export function MfaRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== OPERATOR_MFA_PATH) {
      window.location.replace(OPERATOR_MFA_PATH);
    }
  }, [pathname]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-4 px-4 py-10">
      <Card className="gap-2 p-5">
        <p className="text-foreground-muted text-sm">
          Akun operator wajib menyalakan verifikasi dua langkah.
        </p>
        <p className="font-medium text-base">
          Mengalihkan ke pengaturan keamanan akun...
        </p>
      </Card>
    </main>
  );
}
