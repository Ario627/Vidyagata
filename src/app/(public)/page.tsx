import type { Metadata } from "next";
import { LandingCta } from "@/components/public/landing-cta";
import { LandingFaq } from "@/components/public/landing-faq";
import { LandingHero } from "@/components/public/landing-hero";
import { LandingSteps } from "@/components/public/landing-steps";

export const ensureStatic = "navigation";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <>
      <LandingHero />
      <LandingSteps />
      <LandingFaq />
      <LandingCta />
    </>
  );
}