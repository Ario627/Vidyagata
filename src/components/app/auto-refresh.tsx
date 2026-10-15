"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const MIN_REFRESH_INTERVAL_MS = 20_000;

function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    let lastRefreshAt = Date.now();
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRefreshAt < MIN_REFRESH_INTERVAL_MS) return;
      lastRefreshAt = now;
      router.refresh();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [router]);

  return null;
}

export { AutoRefresh };