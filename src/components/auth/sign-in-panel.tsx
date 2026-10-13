"use client";

import { useState } from "react";
import { EmailSignIn } from "@/components/auth/email-sign-in";
import { PhoneOtpFlow } from "@/components/auth/phone-otp-flow";
import { cn } from "@/lib/utils";

type SignInMethod = "phone" | "email";

type SignInPanelProps = {
  readonly resendCooldownSeconds: number;
  readonly ttlMinutes: number;
  readonly nextPath: string | null;
};

const METHODS: readonly { id: SignInMethod; label: string }[] = [
  { id: "phone", label: "Nomor HP" },
  { id: "email", label: "Email" },
];

function SignInPanel({
  resendCooldownSeconds,
  ttlMinutes,
  nextPath,
}: SignInPanelProps) {
  const [method, setMethod] = useState<SignInMethod>("phone");

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Cara masuk"
        className="flex gap-1 rounded-lg bg-surface-raised p-1"
      >
        {METHODS.map((entry) => {
          const active = entry.id === method;
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMethod(entry.id)}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ease-out",
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                active
                  ? "bg-surface text-foreground shadow-card"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              {entry.label}
            </button>
          );
        })}
      </div>
      {method === "phone" ? (
        <PhoneOtpFlow
          mode="masuk"
          resendCooldownSeconds={resendCooldownSeconds}
          ttlMinutes={ttlMinutes}
          nextPath={nextPath}
        />
      ) : (
        <EmailSignIn nextPath={nextPath} />
      )}
    </div>
  );
}

export { SignInPanel };