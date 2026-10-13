import type { Metadata, Route } from "next";
import { LegalPage } from "../_components/legal-page";
import {
  SECURITY_SECTIONS,
  SECURITY_SUMMARY,
  SECURITY_UPDATED_AT,
  SECURITY_VERSION,
} from "./content";

export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: "Keamanan",
  description:
    "Bagaimana Vidyagata melindungi akun dan datamu, apa yang tidak pernah kami minta, cara melaporkan kerentanan, dan apa yang terjadi saat insiden.",
  alternates: { canonical: "/legal/keamanan" },
  robots: { index: false, follow: false },
};

export default function KeamananPage() {
  return (
    <LegalPage
      title="Keamanan"
      intro="Lapisan yang kami pasang untuk melindungi akun dan datamu, hal-hal yang tidak pernah kami minta, dan cara melaporkan temuan keamanan."
      version={SECURITY_VERSION}
      updatedAt={SECURITY_UPDATED_AT}
      summary={SECURITY_SUMMARY}
      sections={SECURITY_SECTIONS}
      related={[
        {
          href: "/legal/kebijakan-privasi" as Route,
          label: "Kebijakan Privasi",
        },
        { href: "/legal/kepatuhan" as Route, label: "Dasar Hukum" },
        { href: "/legal/pengaduan" as Route, label: "Pengaduan" },
      ]}
    />
  );
}