import type { Metadata, Route } from "next";
import { LegalPage } from "../_components/legal-page";
import {
  COMPLAINT_SECTIONS,
  COMPLAINT_SUMMARY,
  COMPLAINT_UPDATED_AT,
  COMPLAINT_VERSION,
} from "./content";

export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: "Pengaduan & Sengketa",
  description:
    "Cara menyampaikan pengaduan ke Vidyagata: kanal resmi, tenggat penanganan, jalur sengketa lewat LAPS SJK, dan cara mengenali layanan pembiayaan ilegal.",
  alternates: { canonical: "/legal/pengaduan" },
  robots: { index: false, follow: false },
};

export default function PengaduanPage() {
  return (
    <LegalPage
      title="Pengaduan & Sengketa"
      intro="Kanal resmi untuk menyampaikan masalah, tenggat waktu kami, dan jalur yang bisa kamu tempuh kalau tidak sepakat dengan hasilnya."
      version={COMPLAINT_VERSION}
      updatedAt={COMPLAINT_UPDATED_AT}
      summary={COMPLAINT_SUMMARY}
      sections={COMPLAINT_SECTIONS}
      related={[
        {
          href: "/legal/syarat-ketentuan" as Route,
          label: "Syarat & Ketentuan",
        },
        { href: "/legal/keamanan" as Route, label: "Keamanan" },
        { href: "/legal/kepatuhan" as Route, label: "Dasar Hukum" },
      ]}
    />
  );
}