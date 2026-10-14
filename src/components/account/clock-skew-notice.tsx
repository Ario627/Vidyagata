"use client";

import { useEffect, useState } from "react";

const SKEW_WARNING_MS = 25_000;

function ClockSkewNotice({ serverNow }: { readonly serverNow: string }) {
  const [offsetMs, setOffsetMs] = useState<number | null>(null);

  useEffect(() => {
    const parsed = Date.parse(serverNow);
    if (Number.isNaN(parsed)) return;
    setOffsetMs(Date.now() - parsed);
  }, [serverNow]);

  if (offsetMs === null || Math.abs(offsetMs) < SKEW_WARNING_MS) return null;
  const seconds = Math.round(Math.abs(offsetMs) / 1000);
  return (
    <p
      role="alert"
      className="rounded-xl bg-warning-soft p-3 text-sm leading-6 text-foreground"
    >
      Jam perangkatmu bergeser sekitar {seconds} detik dari server, jadi kode
      dari aplikasi autentikator bisa ditolak. Aktifkan pengaturan waktu
      otomatis di perangkatmu lalu coba lagi.
    </p>
  );
}

export { ClockSkewNotice };
