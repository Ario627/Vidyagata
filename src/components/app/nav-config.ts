import {
  Briefcase,
  History,
  House,
  type LucideIcon,
  ReceiptText,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";
import type { Route } from "next";

export type AppNavItem = {
  readonly href: Route;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly exact?: boolean;
};

export type AppNavGroup = {
  readonly label: string;
  readonly items: readonly AppNavItem[];
};

export const APP_NAV_GROUPS: readonly AppNavGroup[] = [
  {
    label: "Keuangan",
    items: [
      {
        href: "/dashboard" as Route,
        label: "Beranda",
        icon: House,
        exact: true,
      },
      { href: "/pembiayaan" as Route, label: "Pembiayaan", icon: Wallet },
      { href: "/tagihan" as Route, label: "Tagihan", icon: ReceiptText },
      { href: "/riwayat" as Route, label: "Riwayat", icon: History },
    ],
  },
  {
    label: "Pertumbuhan",
    items: [
      { href: "/kerja" as Route, label: "Kerja", icon: Briefcase },
      { href: "/performa" as Route, label: "Performa", icon: TrendingUp },
    ],
  },
  {
    label: "Akun",
    items: [{ href: "/profil" as Route, label: "Profil", icon: UserRound }],
  },
];

export const MOBILE_NAV_ITEMS: readonly AppNavItem[] = [
  { href: "/dashboard" as Route, label: "Beranda", icon: House, exact: true },
  { href: "/pembiayaan" as Route, label: "Pembiayaan", icon: Wallet },
  { href: "/kerja" as Route, label: "Kerja", icon: Briefcase },
  { href: "/tagihan" as Route, label: "Tagihan", icon: ReceiptText },
  { href: "/profil" as Route, label: "Profil", icon: UserRound },
];

const PAGE_LABELS: readonly {
  readonly pattern: string;
  readonly section: string;
  readonly title: string;
}[] = [
  { pattern: "/dashboard", section: "Keuangan", title: "Beranda" },
  { pattern: "/pembiayaan/ajukan", section: "Pembiayaan", title: "Ajukan" },
  { pattern: "/pembiayaan", section: "Keuangan", title: "Pembiayaan" },
  { pattern: "/tagihan", section: "Keuangan", title: "Tagihan" },
  { pattern: "/riwayat", section: "Keuangan", title: "Riwayat" },
  { pattern: "/kerja/lamaran", section: "Kerja", title: "Lamaran" },
  { pattern: "/kerja", section: "Pertumbuhan", title: "Kerja" },
  { pattern: "/performa", section: "Pertumbuhan", title: "Performa" },
  { pattern: "/notifikasi", section: "Akun", title: "Notifikasi" },
  {
    pattern: "/profil/surat-pernyataan",
    section: "Profil",
    title: "Surat pernyataan",
  },
  { pattern: "/profil/keamanan", section: "Profil", title: "Keamanan" },
  { pattern: "/profil/lengkapi", section: "Profil", title: "Lengkapi profil" },
  { pattern: "/profil", section: "Akun", title: "Profil" },
  { pattern: "/mbak-vidya", section: "Bantuan", title: "Mbak Vidya" },
];

export function isNavActive(pathname: string, item: AppNavItem): boolean {
  if (item.exact === true) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function pageMetaOf(pathname: string): {
  readonly section: string;
  readonly title: string;
} {
  const matched = PAGE_LABELS.find(
    (entry) =>
      pathname === entry.pattern || pathname.startsWith(`${entry.pattern}/`),
  );
  return matched === undefined
    ? { section: "Vidyagata", title: "Ruang mahasiswa" }
    : { section: matched.section, title: matched.title };
}
