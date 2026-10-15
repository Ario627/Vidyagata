"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InstitutionOption } from "@/components/account/student-profile-form";
import type { PlainDate } from "@/domain/time/plain-date";
import { OnboardingProgress } from "./onboarding-progress";
import { StepAccount } from "./step-account";
import { StepBirthdate } from "./step-birthdate";
import { StepDocuments } from "./step-documents";
import { StepProfile } from "./step-profile";

type OnboardingStep = "birthdate" | "account" | "profile" | "documents";

const STEP_ORDER: readonly OnboardingStep[] = [
  "birthdate",
  "account",
  "profile",
  "documents",
];

const STEP_LABELS: Readonly<Record<OnboardingStep, string>> = {
  birthdate: "Tanggal lahir",
  account: "Akun",
  profile: "Data diri",
  documents: "Dokumen",
};

function OnboardingFlow({
  captchaSiteKey,
  institutions,
}: {
  readonly captchaSiteKey: string | null;
  readonly institutions: readonly InstitutionOption[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>("birthdate");
  const [birthdate, setBirthdate] = useState<PlainDate | null>(null);

  const stepIndex = STEP_ORDER.indexOf(step) + 1;

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
        <StepAccount
          birthdate={birthdate}
          captchaSiteKey={captchaSiteKey}
          onNext={() => setStep("profile")}
        />
      ) : null}
      {step === "profile" ? (
        <StepProfile
          institutions={institutions}
          onNext={() => setStep("documents")}
        />
      ) : null}
      {step === "documents" ? <StepDocuments onComplete={finish} /> : null}
    </div>
  );
}

export { OnboardingFlow };
