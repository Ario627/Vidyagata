import type { Metadata, Route } from "next";
import { LegalPage } from "../_components/legal-page";
import {
  PRIVACY_SECTIONS,
  PRIVACY_SUMMARY,
  PRIVACY_UPDATED_AT,
  PRIVACY_VERSION,
} from "./content";

export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Data apa yang Vidyagata proses, untuk apa, siapa yang bisa menerimanya, dan bagaimana kamu mengendalikannya.",
  alternates: { canonical: "/legal/kebijakan-privasi" },
  robots: { index: false, follow: false },
};

export default function KebijakanPrivasiPage() {
  return (
    <LegalPage
      title="Kebijakan Privasi"
      intro="Halaman ini menjelaskan data apa yang kami proses, untuk apa, siapa yang bisa menerimanya, dan bagaimana kamu mengendalikannya."
      version={PRIVACY_VERSION}
      updatedAt={PRIVACY_UPDATED_AT}
      summary={PRIVACY_SUMMARY}
      sections={PRIVACY_SECTIONS}
      related={[
        { href: "/legal/syarat-ketentuan" as Route, label: "Syarat & Ketentuan" },
        { href: "/legal/biaya" as Route, label: "Biaya" },
      ]}
    />
  );
}