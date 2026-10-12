import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const jakartaSans = localFont({
  src: "../fonts/plus-jakarta-sans-latin.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  applicationName: "Vidyagata",
  title: {
    default: "Vidyagata - Kuliah tanpa pusing biaya",
    template: "%s · Vidyagata",
  },
  description:
    "Pembiayaan pendidikan yang tersambung ke kerja part-time. Pengajuan VidyaFund tanpa penjamin, penghasilan dari Earn2Study, cicilan dipotong dari hasil kerjamu.",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
  themeColor: "oklch(0.55 0.2 254)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakartaSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
