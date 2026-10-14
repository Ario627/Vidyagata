import { Calculator, History, ReceiptText, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { GreetingHeader } from "@/components/app/greeting-header";
import { InfoChip } from "@/components/app/info-chip";
import { MbakVidyaBanner } from "@/components/app/mbak-vidya-banner";
import { initialsOf, ProfileCard } from "@/components/app/profile-card";
import { QuickActions } from "@/components/app/quick-actions";
import { Mascot } from "@/components/brand/brand";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { Rupiah } from "@/domain/money/money";
import { formatIDR } from "@/lib/format/currency";
import { formatPlainDate } from "@/lib/format/date";
import { dashboardDemo } from "../_lib/dashboard-demo";

export const metadata: Metadata = {
  title: "Beranda",
  description:
    "Ringkasan pembiayaan, tagihan berikutnya, dan progres cicilanmu.",
};

const QUICK_ACTIONS = [
  { href: "/tagihan", label: "Cek Tagihan", icon: ReceiptText },
  { href: "/cek-kelayakan", label: "Cek Kelayakan", icon: Calculator },
  { href: "/riwayat", label: "Riwayat", icon: History },
  { href: "/performa", label: "Cek Performa", icon: TrendingUp },
] as const;

type CompositionSlice = {
  readonly label: string;
  readonly amount: Rupiah;
  readonly tone: string;
};

const INSTALLMENT_LABELS = [
  { label: "Pokok", field: "principal" },
  { label: "Margin", field: "margin" },
  { label: "Service fee", field: "serviceFee" },
] as const;

function HeaderAvatar({ name }: { name: string }) {
  return (
    <Link
      href="/profil"
      aria-label="Buka profil"
      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-foreground font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
    >
      <span aria-hidden="true">{initialsOf(name)}</span>
    </Link>
  );
}

function CompositionBar({
  slices,
  label,
}: {
  slices: readonly CompositionSlice[];
  label: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className="flex h-3 overflow-hidden rounded-full"
    >
      {slices.map((slice) => (
        <span
          key={slice.label}
          aria-hidden="true"
          style={{ flexGrow: slice.amount }}
          className={slice.tone}
        />
      ))}
    </div>
  );
}

function CompositionLegend({
  slices,
}: {
  slices: readonly CompositionSlice[];
}) {
  return (
    <ul className="mt-3 flex flex-col gap-1.5">
      {slices.map((slice) => (
        <li
          key={slice.label}
          className="flex items-center justify-between gap-3 text-xs"
        >
          <span className="flex items-center gap-1.5 text-foreground-muted">
            <span
              aria-hidden="true"
              className={`size-2 shrink-0 rounded-full ${slice.tone}`}
            />
            {slice.label}
          </span>
          <span className="tabular-nums text-foreground">
            {formatIDR(slice.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function OverviewCard() {
  const { composition, nextDueDate, totals } = dashboardDemo;
  const slices: readonly CompositionSlice[] = [
    {
      label: "Pokok sudah dibayar",
      amount: composition.paidPrincipal,
      tone: "bg-chart-1",
    },
    {
      label: "Pokok tersisa",
      amount: composition.remainingPrincipal,
      tone: "bg-chart-2",
    },
    { label: "Margin", amount: composition.margin, tone: "bg-chart-3" },
    {
      label: "Service fee",
      amount: composition.serviceFee,
      tone: "bg-chart-4",
    },
  ];

  return (
    <Card>
      <CardContent>
        <CardTitle>Overview</CardTitle>
      </CardContent>
      <CardContent>
        <CompositionBar
          slices={slices}
          label={`Komposisi pembiayaan ${formatIDR(totals.totalRepayment)}`}
        />
        <CompositionLegend slices={slices} />
      </CardContent>
      <CardContent className="border-border border-t pt-4">
        <p className="text-sm text-foreground">
          Jatuh tempo berikutnya{" "}
          <span className="font-semibold">{formatPlainDate(nextDueDate)}</span>
        </p>
      </CardContent>
    </Card>
  );
}

function FundProgressCard() {
  const { paidCount, progressPercent, facility } = dashboardDemo;

  return (
    <Card>
      <CardContent>
        <CardTitle>VidyaFund</CardTitle>
      </CardContent>
      <CardContent className="flex flex-col gap-1">
        <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
          {progressPercent}%
        </p>
        <p className="text-xs text-foreground-muted">
          Kamu sudah mencicil {paidCount} dari {facility.tenorMonths} cicilan
        </p>
        <div
          role="progressbar"
          aria-label="Progres cicilan"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
          className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100"
        >
          <div
            className="h-full rounded-full bg-success"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function NextInstallmentChip() {
  const { nextInstallment } = dashboardDemo;

  return (
    <InfoChip
      label="Cicilan berikutnya"
      value={formatIDR(nextInstallment.total)}
      hint={formatPlainDate(nextInstallment.dueDate)}
    >
      <dl className="flex flex-col gap-1.5">
        {INSTALLMENT_LABELS.map(({ label, field }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <dt className="text-foreground-muted">{label}</dt>
            <dd className="tabular-nums text-foreground">
              {formatIDR(nextInstallment[field])}
            </dd>
          </div>
        ))}
      </dl>
    </InfoChip>
  );
}

export default function DashboardPage() {
  const { student, composition } = dashboardDemo;
  const firstName = student.name.split(" ")[0] ?? student.name;

  return (
    <>
      <GreetingHeader
        title={`Halo, ${firstName}!`}
        avatar={<HeaderAvatar name={student.name} />}
      >
        <div className="mt-4 grid grid-cols-2 gap-2">
          <InfoChip
            label="Sisa pokok"
            value={formatIDR(composition.remainingPrincipal)}
            hint={`dari ${formatIDR(composition.total)}`}
          />
          <NextInstallmentChip />
        </div>
        <QuickActions actions={QUICK_ACTIONS} className="mt-4 pb-5" />
      </GreetingHeader>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6">
        <OverviewCard />
        <FundProgressCard />
        <ProfileCard
          name={student.name}
          institution={student.institution}
          status={student.status}
          href="/profil"
        />
        <MbakVidyaBanner
          href="/mbak-vidya"
          avatar={
            <Mascot
              name="sapa"
              sizes="44px"
              className="h-full w-full object-cover object-top"
            />
          }
        />
        <p className="px-1 text-2xs text-foreground-subtle">
          Pratinjau dengan angka contoh — data aslimu muncul setelah
          pembiayaanmu aktif.
        </p>
      </div>
    </>
  );
}
