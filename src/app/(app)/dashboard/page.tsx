import {
  ArrowRight,
  Bell,
  Calculator,
  History,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { GreetingHeader } from "@/components/app/greeting-header";
import { InfoChip } from "@/components/app/info-chip";
import { MbakVidyaBanner } from "@/components/app/mbak-vidya-banner";
import { initialsOf, ProfileCard } from "@/components/app/profile-card";
import { QuickActions } from "@/components/app/quick-actions";
import { Mascot } from "@/components/brand/brand";
import { STATUS_META } from "@/components/financing/labels";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { APPLICATION_STATUS_META } from "@/components/work/labels";
import type { MyApplication } from "@/data/applications";
import { getMyDashboard } from "@/data/dashboard";
import type { FinancingFacility } from "@/data/financing";
import { type AppNotification, getMyNotifications } from "@/data/notifications";
import type { TagihanInstallment, TagihanOverview } from "@/data/repayments";
import { type Rupiah, sum } from "@/domain/money/money";
import { formatIDR } from "@/lib/format/currency";
import { formatInstantWib, formatPlainDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Beranda",
  description:
    "Ringkasan pembiayaan, tagihan berikutnya, dan progres cicilanmu.",
};

export const instant = false;

const QUICK_ACTIONS = [
  { href: "/tagihan", label: "Cek Tagihan", icon: ReceiptText },
  { href: "/cek-kelayakan", label: "Cek Kelayakan", icon: Calculator },
  { href: "/riwayat", label: "Riwayat", icon: History },
  { href: "/performa", label: "Cek Performa", icon: TrendingUp },
] as const;

const LINK_CLASS =
  "inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover";

type CompositionSlice = {
  readonly label: string;
  readonly amount: Rupiah;
  readonly tone: string;
};

const INSTALLMENT_LABELS = [
  { label: "Pokok", field: "principal" },
  { label: "Margin", field: "margin" },
  { label: "Service fee", field: "fee" },
] as const;

const NOTIFICATION_TONE: Readonly<Record<string, string>> = {
  info: "bg-info-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
};

function paidInstallments(
  tagihan: TagihanOverview,
): readonly TagihanInstallment[] {
  return tagihan.installments.filter((item) => item.status === "paid");
}

function openInstallments(
  tagihan: TagihanOverview,
): readonly TagihanInstallment[] {
  return tagihan.installments.filter(
    (item) => item.status !== "paid" && item.status !== "waived",
  );
}

function paidPrincipalOf(tagihan: TagihanOverview): Rupiah {
  return sum(paidInstallments(tagihan).map((item) => item.principal));
}

function remainingPrincipalOf(tagihan: TagihanOverview): Rupiah {
  return sum(openInstallments(tagihan).map((item) => item.principal));
}

function progressPercentOf(tagihan: TagihanOverview): number {
  if (tagihan.totalRepayment === 0) return 0;
  return Math.min(
    100,
    Math.round((tagihan.paidTotal / tagihan.totalRepayment) * 100),
  );
}

function HeaderAvatar({ name }: { name: string }) {
  return (
    <Link
      href="/profil"
      aria-label="Buka profil"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
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
      className="flex h-2.5 gap-0.5 overflow-hidden rounded-full"
    >
      {slices.map((slice) => (
        <span
          key={slice.label}
          aria-hidden="true"
          style={{ flexGrow: slice.amount }}
          className={cn("rounded-full", slice.tone)}
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
    <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      {slices.map((slice) => (
        <li
          key={slice.label}
          className="flex items-center justify-between gap-3 text-xs"
        >
          <span className="flex items-center gap-2 text-foreground-muted">
            <span
              aria-hidden="true"
              className={cn("size-1.5 shrink-0 rounded-full", slice.tone)}
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

function OverviewCard({ tagihan }: { tagihan: TagihanOverview }) {
  const margin = sum(tagihan.installments.map((item) => item.margin));
  const serviceFee = sum(tagihan.installments.map((item) => item.fee));
  const slices: readonly CompositionSlice[] = [
    {
      label: "Pokok dibayar",
      amount: paidPrincipalOf(tagihan),
      tone: "bg-chart-1",
    },
    {
      label: "Pokok tersisa",
      amount: remainingPrincipalOf(tagihan),
      tone: "bg-chart-2",
    },
    { label: "Margin", amount: margin, tone: "bg-chart-3" },
    { label: "Service fee", amount: serviceFee, tone: "bg-chart-4" },
  ];

  return (
    <Card className="gap-0 shadow-none">
      <CardContent className="flex items-baseline justify-between gap-3 pb-4">
        <CardTitle>Komposisi pembiayaan</CardTitle>
        <span className="text-2xs text-foreground-subtle tabular-nums">
          {formatIDR(tagihan.totalRepayment)}
        </span>
      </CardContent>
      <CardContent>
        <CompositionBar
          slices={slices}
          label={`Komposisi pembiayaan ${formatIDR(tagihan.totalRepayment)}`}
        />
        <CompositionLegend slices={slices} />
      </CardContent>
      <CardContent className="mt-4 border-border border-t pt-3">
        <p className="text-xs text-foreground-muted">
          <span className="font-mono text-2xs">
            {tagihan.facilityPublicRef}
          </span>
          {tagihan.institutionName === null
            ? ""
            : ` · ${tagihan.institutionName}`}
        </p>
      </CardContent>
    </Card>
  );
}

function InstallmentMarks({ tagihan }: { tagihan: TagihanOverview }) {
  return (
    <div className="grid grid-cols-12 gap-1" aria-hidden="true">
      {tagihan.installments.map((item) => (
        <span
          key={item.id}
          className={cn(
            "h-1.5 rounded-full",
            item.status === "paid"
              ? "bg-success-500"
              : item.status === "overdue"
                ? "bg-danger-500"
                : item.status === "waived"
                  ? "bg-ink-300"
                  : "bg-ink-200",
          )}
        />
      ))}
    </div>
  );
}

function FundProgressCard({ tagihan }: { tagihan: TagihanOverview }) {
  const percent = progressPercentOf(tagihan);

  return (
    <Card className="gap-0 shadow-none">
      <CardContent className="flex items-baseline justify-between gap-3 pb-3">
        <CardTitle>Progres cicilan</CardTitle>
        <span className="text-2xs text-foreground-subtle">
          {tagihan.paidCount}/{tagihan.totalCount}
        </span>
      </CardContent>
      <CardContent className="flex flex-col gap-1">
        <p className="text-3xl font-semibold tracking-[-0.04em] text-foreground tabular-nums">
          {percent}%
        </p>
        <p className="text-xs text-foreground-muted">
          {formatIDR(tagihan.paidTotal)} sudah dibayar
        </p>
      </CardContent>
      <CardContent className="mt-4 flex flex-col gap-2 border-border border-t pt-3">
        <InstallmentMarks tagihan={tagihan} />
        <div className="flex items-center justify-between text-2xs text-foreground-subtle">
          <span>Mulai</span>
          <span>{tagihan.tenorMonths} bulan</span>
          <span>Lunas</span>
        </div>
      </CardContent>
    </Card>
  );
}

function NextDueChip({ tagihan }: { tagihan: TagihanOverview }) {
  const nextDue = tagihan.nextDue;
  if (nextDue === null) {
    return (
      <InfoChip
        label="Status cicilan"
        value="Lunas"
        hint="Semua cicilan selesai"
      />
    );
  }
  return (
    <InfoChip
      label="Cicilan berikutnya"
      value={formatIDR(nextDue.total)}
      hint={formatPlainDate(nextDue.dueDate)}
    >
      <dl className="flex flex-col gap-1.5">
        {INSTALLMENT_LABELS.map(({ label, field }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <dt className="text-foreground-muted">{label}</dt>
            <dd className="tabular-nums text-foreground">
              {formatIDR(nextDue[field])}
            </dd>
          </div>
        ))}
      </dl>
    </InfoChip>
  );
}

function PositionCard({ tagihan }: { tagihan: TagihanOverview }) {
  const percent = progressPercentOf(tagihan);
  const overdue = tagihan.overdueCount > 0;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-ink-900 px-5 py-6 text-white shadow-panel lg:px-7 lg:py-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-ledger-dark opacity-50"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 bg-brand-500"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-white/50">
            Posisi pembiayaan
          </p>
          <p className="mt-1 text-sm text-white/70">
            {tagihan.facilityPublicRef}
            {tagihan.institutionName === null
              ? ""
              : ` · ${tagihan.institutionName}`}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-2xs font-medium",
            overdue
              ? "bg-danger-500/20 text-danger-500"
              : "bg-success-500/15 text-success-500",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              overdue ? "bg-danger-500" : "bg-success-500",
            )}
          />
          {overdue ? `${tagihan.overdueCount} terlambat` : "Berjalan lancar"}
        </span>
      </div>
      <div className="relative mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-2xs text-white/50">Sisa tagihan</p>
          <p className="mt-1 text-[2.15rem] font-semibold leading-none tracking-[-0.04em] tabular-nums lg:text-[2.6rem]">
            {formatIDR(tagihan.outstandingTotal)}
          </p>
        </div>
        <Link
          href={"/tagihan" as Route}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-white px-4 text-sm font-semibold text-ink-900 transition-colors duration-150 ease-out hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Bayar cicilan
          <ArrowRight aria-hidden="true" strokeWidth={2} className="size-4" />
        </Link>
      </div>
      <div className="relative mt-6 grid grid-cols-2 gap-4 border-white/10 border-t pt-4 sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-2xs text-white/50">Cicilan berikutnya</span>
          <span className="text-sm font-semibold tabular-nums">
            {tagihan.nextDue === null
              ? "Tidak ada"
              : formatIDR(tagihan.nextDue.total)}
          </span>
          <span className="text-2xs text-white/50">
            {tagihan.nextDue === null
              ? "Semua selesai"
              : formatPlainDate(tagihan.nextDue.dueDate)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-2xs text-white/50">Progres</span>
          <span className="text-sm font-semibold tabular-nums">{percent}%</span>
          <span className="text-2xs text-white/50">
            {tagihan.paidCount} dari {tagihan.totalCount} cicilan
          </span>
        </div>
        <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
          <span className="text-2xs text-white/50">Terbayar</span>
          <span className="text-sm font-semibold tabular-nums">
            {formatIDR(tagihan.paidTotal)}
          </span>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-success-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function OverdueNotice({ overdueCount }: { overdueCount: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3">
      <p role="alert" className="text-sm font-semibold text-danger">
        {overdueCount} cicilanmu terlambat
      </p>
      <p className="text-xs leading-5 text-foreground-muted">
        Selesaikan lewat halaman tagihan supaya tidak kena denda keterlambatan.
      </p>
      <Link href="/tagihan" className={LINK_CLASS}>
        Buka tagihan
        <ArrowRight aria-hidden="true" strokeWidth={2} className="size-3.5" />
      </Link>
    </div>
  );
}

function ApplicationsCard({
  applications,
  activeCount,
}: {
  applications: readonly MyApplication[];
  activeCount: number;
}) {
  return (
    <Card className="gap-0 shadow-none">
      <CardContent className="flex items-baseline justify-between gap-3 pb-3">
        <CardTitle>Lamaran kerja</CardTitle>
        <Link href={"/kerja/lamaran" as Route} className={LINK_CLASS}>
          Semua
        </Link>
      </CardContent>
      {applications.length === 0 ? (
        <CardContent className="flex flex-col items-start gap-3">
          <p className="text-sm leading-6 text-foreground-muted">
            Belum ada lamaran. Cari lowongan part-time yang cocok dengan jadwal
            kuliahmu.
          </p>
          <Link
            href="/kerja"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            Cari lowongan
          </Link>
        </CardContent>
      ) : (
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-col divide-y divide-border">
            {applications.map((item) => {
              const meta = APPLICATION_STATUS_META[item.status];
              return (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.postingTitle}
                    </p>
                    <p className="truncate text-xs text-foreground-muted">
                      {item.employerName}
                    </p>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </li>
              );
            })}
          </ul>
          <p className="text-2xs text-foreground-subtle">
            {activeCount === 0
              ? "Tidak ada lamaran aktif saat ini."
              : `${activeCount} lamaran masih berjalan.`}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

function NotificationsCard({
  notifications,
}: {
  notifications: readonly AppNotification[];
}) {
  return (
    <Card className="gap-0 shadow-none">
      <CardContent className="flex items-baseline justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bell
            aria-hidden="true"
            strokeWidth={1.8}
            className="size-4 text-foreground-muted"
          />
          Kabar terbaru
        </CardTitle>
        <Link href={"/notifikasi" as Route} className={LINK_CLASS}>
          Semua
        </Link>
      </CardContent>
      {notifications.length === 0 ? (
        <CardContent>
          <p className="text-sm leading-6 text-foreground-muted">
            Belum ada kabar baru. Pengingat jatuh tempo dan hasil lamaran akan
            muncul di sini.
          </p>
        </CardContent>
      ) : (
        <CardContent>
          <ul className="flex flex-col divide-y divide-border">
            {notifications.slice(0, 3).map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-2.5 py-3 first:pt-0 last:pb-0"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    NOTIFICATION_TONE[item.tone] ?? "bg-ink-300",
                  )}
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-xs font-medium leading-5 text-foreground">
                    {item.title}
                  </span>
                  <span className="text-2xs text-foreground-subtle">
                    {formatInstantWib(item.occurredAt)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}

function QuickActionsCard() {
  return (
    <Card className="gap-0 shadow-none">
      <CardContent className="pb-3">
        <CardTitle>Aksi cepat</CardTitle>
      </CardContent>
      <CardContent>
        <ul className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <li key={action.href}>
              <Link
                href={action.href as Route}
                className="group flex h-full flex-col gap-2 rounded-lg border border-border bg-surface p-3 transition-colors duration-150 ease-out hover:border-border-strong hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <action.icon
                  aria-hidden="true"
                  strokeWidth={1.8}
                  className="size-4 text-primary"
                />
                <span className="text-xs font-medium leading-4 text-foreground">
                  {action.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function EmptyFinanceCard() {
  return (
    <Card className="gap-0 overflow-hidden shadow-none">
      <CardContent className="flex items-start gap-4 pb-3">
        <Mascot
          name="telusuri"
          sizes="96px"
          className="mascot-float h-20 w-auto shrink-0"
        />
        <div className="flex flex-col gap-1">
          <CardTitle>Belum ada pembiayaan</CardTitle>
          <p className="text-sm leading-6 text-foreground-muted">
            Ajukan pembiayaan pertama atau cek dulu estimasi kelayakanmu —
            prosesnya cuma beberapa menit.
          </p>
        </div>
      </CardContent>
      <CardContent className="flex flex-wrap gap-2 border-border border-t pt-4">
        <Link
          href={"/pembiayaan/ajukan" as Route}
          className={buttonVariants({})}
        >
          Ajukan pembiayaan
        </Link>
        <Link
          href="/cek-kelayakan"
          className={buttonVariants({ variant: "secondary" })}
        >
          Cek kelayakan
        </Link>
      </CardContent>
    </Card>
  );
}

function PendingFacilityCard({ facility }: { facility: FinancingFacility }) {
  const meta = STATUS_META[facility.status];
  return (
    <Card className="gap-0 shadow-none">
      <CardContent className="flex items-start justify-between gap-3 pb-3">
        <div className="flex flex-col gap-1">
          <CardTitle>Pengajuan pembiayaan</CardTitle>
          <p className="font-mono text-2xs text-foreground-subtle">
            {facility.publicRef}
          </p>
        </div>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </CardContent>
      <CardContent>
        <p className="text-sm leading-6 text-foreground-muted">
          {facility.requestedAmount === null
            ? "Nominal belum diisi."
            : `Nominal ${formatIDR(facility.requestedAmount)} sedang diproses.`}
        </p>
        <Link
          href={`/pembiayaan/${facility.id}` as Route}
          className={cn(LINK_CLASS, "mt-2")}
        >
          Lihat detail pengajuan
          <ArrowRight aria-hidden="true" strokeWidth={2} className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const [snapshot, notifications] = await Promise.all([
    getMyDashboard(),
    getMyNotifications(),
  ]);
  if (snapshot === null) {
    redirect("/masuk");
  }
  const { tagihan } = snapshot;
  const firstName = snapshot.name.split(" ")[0] ?? snapshot.name;
  const profileName = snapshot.identity?.profile.fullName ?? snapshot.name;
  const institution =
    snapshot.identity?.institutionName ?? "Kampus belum diisi";
  const academicStatus =
    snapshot.identity === null
      ? "Profil belum lengkap"
      : snapshot.identity.profile.currentSemester === null
        ? "Mahasiswa aktif"
        : `Semester ${snapshot.identity.profile.currentSemester}`;

  return (
    <>
      <AutoRefresh />
      <div className="lg:hidden">
        <GreetingHeader
          title={`Halo, ${firstName}`}
          avatar={<HeaderAvatar name={snapshot.name} />}
          notificationDot={tagihan !== null && tagihan.overdueCount > 0}
        >
          {tagihan === null ? null : (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <InfoChip
                label="Sisa pokok"
                value={formatIDR(remainingPrincipalOf(tagihan))}
                hint={`dari ${formatIDR(
                  sum([
                    paidPrincipalOf(tagihan),
                    remainingPrincipalOf(tagihan),
                  ]),
                )}`}
              />
              <NextDueChip tagihan={tagihan} />
            </div>
          )}
          <QuickActions actions={QUICK_ACTIONS} className="mt-4 pb-5" />
        </GreetingHeader>
      </div>

      <main className="mx-auto w-full max-w-[76rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="hidden items-end justify-between gap-8 border-border border-b pb-6 lg:flex">
          <div className="flex flex-col">
            <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-primary">
              Ringkasan keuangan
            </p>
            <h1 className="mt-1 text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground">
              Halo, {firstName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-foreground-muted">
              Satu tempat untuk melihat posisi pembiayaan, cicilan berikutnya,
              dan langkah yang paling mendesak.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={"/cek-kelayakan" as Route}
              className={buttonVariants({ variant: "secondary", size: "md" })}
            >
              Cek kelayakan
            </Link>
            {tagihan === null ? (
              <Link
                href={"/pembiayaan/ajukan" as Route}
                className={buttonVariants({ size: "md" })}
              >
                Ajukan pembiayaan
              </Link>
            ) : (
              <Link
                href={"/tagihan" as Route}
                className={buttonVariants({ size: "md" })}
              >
                Bayar cicilan
              </Link>
            )}
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
            {tagihan !== null && tagihan.overdueCount > 0 ? (
              <OverdueNotice overdueCount={tagihan.overdueCount} />
            ) : null}
            {tagihan !== null ? (
              <>
                <PositionCard tagihan={tagihan} />
                <div className="grid gap-4 md:grid-cols-2">
                  <OverviewCard tagihan={tagihan} />
                  <FundProgressCard tagihan={tagihan} />
                </div>
              </>
            ) : snapshot.facility !== null ? (
              <PendingFacilityCard facility={snapshot.facility} />
            ) : (
              <EmptyFinanceCard />
            )}
            <ApplicationsCard
              applications={snapshot.applications}
              activeCount={snapshot.activeApplicationCount}
            />
            <ProfileCard
              name={profileName}
              institution={institution}
              status={academicStatus}
              href="/profil"
              className="shadow-none lg:hidden"
            />
          </div>

          <aside className="flex min-w-0 flex-col gap-4 lg:gap-6">
            <div className="hidden lg:block">
              <QuickActionsCard />
            </div>
            <NotificationsCard notifications={notifications} />
            <MbakVidyaBanner
              href="/mbak-vidya"
              className="shadow-none"
              avatar={
                <Mascot
                  name="sapa"
                  sizes="44px"
                  className="h-full w-full object-cover object-top"
                />
              }
            />
            <div className="hidden lg:block">
              <ProfileCard
                name={profileName}
                institution={institution}
                status={academicStatus}
                href="/profil"
                className="shadow-none"
              />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
