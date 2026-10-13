import type { Metadata, Route } from "next";
import { LegalPage } from "../_components/legal-page";
import {
  TERMS_SECTIONS,
  TERMS_SUMMARY,
  TERMS_UPDATED_AT,
  TERMS_VERSION,
} from "./content";

export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description:
    "Ketentuan penggunaan platform Vidyagata: apa yang kami janjikan, apa yang kami tidak janjikan, dan apa yang kamu setujui.",
  alternates: { canonical: "/legal/syarat-ketentuan" },
  robots: { index: false, follow: false },
};

export default function SyaratKetentuanPage() {
  return (
    <LegalPage
      title="Syarat & Ketentuan"
      intro="Ketentuan dasar penggunaan platform Vidyagata: apa yang kami janjikan, apa yang kami tidak janjikan, dan apa yang kamu setujui saat memakai layanan."
      version={TERMS_VERSION}
      updatedAt={TERMS_UPDATED_AT}
      summary={TERMS_SUMMARY}
      sections={TERMS_SECTIONS}
      related={[
        { href: "/legal/kebijakan-privasi" as Route, label: "Kebijakan Privasi" },
        { href: "/legal/biaya" as Route, label: "Biaya" },
      ]}
    />
  );
}