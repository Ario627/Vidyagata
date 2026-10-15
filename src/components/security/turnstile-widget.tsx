"use client";

import { useEffect, useRef } from "react";

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileRenderOptions = {
  sitekey: string;
  action?: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "flexible" | "compact";
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

type TurnstileApi = {
  render: (element: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile !== undefined) return Promise.resolve(window.turnstile);
  if (scriptPromise !== null) return scriptPromise;
  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.getElementById(
      SCRIPT_ID,
    ) as HTMLScriptElement | null;
    const script: HTMLScriptElement =
      existing ?? document.createElement("script");
    const onReady = () => {
      if (window.turnstile !== undefined) resolve(window.turnstile);
      else reject(new Error("turnstile_unavailable"));
    };
    if (existing === null) {
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", onReady, { once: true });
      script.addEventListener(
        "error",
        () => reject(new Error("turnstile_script_failed")),
        { once: true },
      );
      document.head.append(script);
      return;
    }
    script.addEventListener("load", onReady, { once: true });
    if (window.turnstile !== undefined) onReady();
  });
  scriptPromise = scriptPromise.catch((error: unknown) => {
    scriptPromise = null;
    throw error;
  });
  return scriptPromise;
}

type TurnstileWidgetProps = {
  readonly siteKey: string;
  readonly action: string;
  readonly resetSignal: number;
  readonly onToken: (token: string | null) => void;
};

function TurnstileWidget({
  siteKey,
  action,
  resetSignal,
  onToken,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let disposed = false;
    loadTurnstile()
      .then((turnstile) => {
        if (disposed || containerRef.current === null) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: "light",
          size: "flexible",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => {
        onTokenRef.current(null);
      });
    return () => {
      disposed = true;
      const widgetId = widgetIdRef.current;
      widgetIdRef.current = null;
      if (widgetId !== null && window.turnstile !== undefined) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [siteKey, action]);

  useEffect(() => {
    if (resetSignal === 0) return;
    const widgetId = widgetIdRef.current;
    if (widgetId === null || window.turnstile === undefined) return;
    onTokenRef.current(null);
    window.turnstile.reset(widgetId);
  }, [resetSignal]);

  return <div ref={containerRef} data-captcha-widget="" />;
}

export { TurnstileWidget };