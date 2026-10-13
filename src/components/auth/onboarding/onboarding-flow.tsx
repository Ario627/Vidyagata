"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PlainDate } from "@/domain/time/plain-date";
import { OnboardingProgress } from "./onboarding-progress";
import { type AccountDraft, StepAccount } from "./step-account";
import { StepBirthdate } from "./step-birthdate";
import { StepDocuments } from "./step-documents";
import { StepEmailVerify } from "./step-email-verify";
import { StepProfile } from "./step-profile";

type OnboardingStep =
  | "birthdate"
  | "account"
  | "verify-email"
  | "profile"
  | "documents";

type OnboardingFlowProps = {
  readonly resendCooldownSeconds: number;
  readonly ttlMinutes: number;
};

const STEP_ORDER: readonly OnboardingStep[] = [
  "birthdate",
  "account",
  "verify-email",
  "profile",
  "documents",
];

const STEP_LABELS: Readonly<Record<OnboardingStep, string>> = {
  birthdate: "Tanggal lahir",
  account: "Akun",
  "verify-email": "Verifikasi email",
  profile: "Data diri",
  documents: "Dokumen",
};

function OnboardingFlow({
  resendCooldownSeconds,
  ttlMinutes,
}: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>("birthdate");
  const [birthdate, setBirthdate] = useState<PlainDate | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const stepIndex = STEP_ORDER.indexOf(step) + 1;

  function handleAccountCreated(draft: AccountDraft) {
    setEmail(draft.email);
    setStep("verify-email");
  }

  function finish() {
    router.replace("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <OnboardingProgress
        current={stepIndex}
        total={STEP_ORDER.length}
        label={STEP_LABELS[step]}
      />
      {step === "birthdate" ? (
        <StepBirthdate
          initialValue={birthdate}
          onNext={(value) => {
            setBirthdate(value);
            setStep("account");
          }}
        />
      ) : null}
      {step === "account" && birthdate !== null ? (
        <StepAccount birthdate={birthdate} onNext={handleAccountCreated} />
      ) : null}
      {step === "verify-email" && email !== null ? (
        <StepEmailVerify
          email={email}
          resendCooldownSeconds={resendCooldownSeconds}
          ttlMinutes={ttlMinutes}
          onNext={() => setStep("profile")}
        />
      ) : null}
      {step === "profile" ? (
        <StepProfile onNext={() => setStep("documents")} />
      ) : null}
      {step === "documents" ? <StepDocuments onComplete={finish} /> : null}
    </div>
  );
}

export { OnboardingFlow };