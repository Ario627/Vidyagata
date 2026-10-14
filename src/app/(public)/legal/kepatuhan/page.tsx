import type { Metadata, Route } from "next";
import { LegalPage } from "../_components/legal-page";
import {
  COMPLIANCE_SECTIONS,
  COMPLIANCE_SUMMARY,
  COMPLIANCE_UPDATED_AT,
  COMPLIANCE_VERSION,
} from "./content";

export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: "Dasar Hukum & Kepatuhan",
  description:
    "Aturan hukum dan norma yang Vidyagata ikuti: pelindungan data pribadi, perlindungan konsumen, aturan sektor keuangan, dan usia minimum pengguna.",
  alternates: { canonical: "/legal/kepatuhan" },
  robots: { index: false, follow: false },
};

export default function KepatuhanPage() {
  return (
    <LegalPage
      title="Dasar Hukum & Kepatuhan"
      intro="Halaman ini menjelaskan posisi kami dalam rantai layanan, aturan yang kami ikuti, asas yang kami pegang, dan norma yang kami jaga."
      version={COMPLIANCE_VERSION}
      updatedAt={COMPLIANCE_UPDATED_AT}
      summary={COMPLIANCE_SUMMARY}
      sections={COMPLIANCE_SECTIONS}
      related={[
        {
          href: "/legal/kebijakan-privasi" as Route,
          label: "Kebijakan Privasi",
        },
        { href: "/legal/keamanan" as Route, label: "Keamanan" },
        { href: "/legal/pengaduan" as Route, label: "Pengaduan" },
      ]}
    />
  );
}
