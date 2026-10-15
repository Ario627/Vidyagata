import { Calculator, History, ReceiptText, TrendingUp } from "lucide-react";
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
import type { TagihanInstallment, TagihanOverview } from "@/data/repayments";
import { type Rupiah, sum } from "@/domain/money/money";
import { formatIDR } from "@/lib/format/currency";
import { formatPlainDate } from "@/lib/format/date";

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
  "text-sm font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover";

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

function OverviewCard({ tagihan }: { tagihan: TagihanOverview }) {
  const margin = sum(tagihan.installments.map((item) => item.margin));
  const serviceFee = sum(tagihan.installments.map((item) => item.fee));
  const slices: readonly CompositionSlice[] = [
    {
      label: "Pokok sudah dibayar",
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
    <Card>
      <CardContent>
        <CardTitle>Overview</CardTitle>
      </CardContent>
      <CardContent>
        <CompositionBar
          slices={slices}
          label={`Komposisi pembiayaan ${formatIDR(tagihan.totalRepayment)}`}
        />
        <CompositionLegend slices={slices} />
      </CardContent>
      <CardContent className="border-border border-t pt-4">
        <p className="text-sm text-foreground">
          {tagihan.facilityPublicRef}
          {tagihan.institutionName === null
            ? ""
            : ` · ${tagihan.institutionName}`}
        </p>
      </CardContent>
    </Card>
  );
}

function FundProgressCard({ tagihan }: { tagihan: TagihanOverview }) {
  const percent = progressPercentOf(tagihan);

  return (
    <Card>
      <CardContent>
        <CardTitle>VidyaFund</CardTitle>
      </CardContent>
      <CardContent className="flex flex-col gap-1">
        <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
          {percent}%
        </p>
        <p className="text-xs text-foreground-muted">
          Terbayar {formatIDR(tagihan.paidTotal)} dari{" "}
          {formatIDR(tagihan.totalRepayment)}
        </p>
        <p className="text-xs text-foreground-muted">
          {tagihan.paidCount} dari {tagihan.totalCount} cicilan lunas
        </p>
        <div
          role="progressbar"
          aria-label="Progres cicilan"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100"
        >
          <div
            className="h-full rounded-full bg-success"
            style={{ width: `${percent}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function OverdueNotice({ overdueCount }: { overdueCount: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <p role="alert" className="text-sm font-semibold text-danger">
          {overdueCount} cicilanmu terlambat
        </p>
        <p className="text-sm leading-6 text-foreground-muted">
          Segera selesaikan lewat halaman tagihan supaya tidak kena denda
          keterlambatan.
        </p>
        <Link href="/tagihan" className={LINK_CLASS}>
          Buka tagihan
        </Link>
      </CardContent>
    </Card>
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
    <Card>
      <CardContent>
        <CardTitle>Lamaran kerja</CardTitle>
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
          <ul className="flex flex-col gap-3">
            {applications.map((item) => {
              const meta = APPLICATION_STATUS_META[item.status];
              return (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3"
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
          <Link href="/kerja/lamaran" className={LINK_CLASS}>
            {activeCount === 0
              ? "Lihat semua lamaran"
              : `Lihat semua lamaran (${activeCount} aktif)`}
          </Link>
        </CardContent>
      )}
    </Card>
  );
}

function EmptyFinanceCard() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <CardTitle>Belum ada pembiayaan</CardTitle>
        <p className="text-sm leading-6 text-foreground-muted">
          Ajukan pembiayaan pertama atau cek dulu estimasi kelayakanmu —
          prosesnya cuma beberapa menit.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/pembiayaan/ajukan" className={buttonVariants({})}>
            Ajukan pembiayaan
          </Link>
          <Link
            href="/cek-kelayakan"
            className={buttonVariants({ variant: "secondary" })}
          >
            Cek kelayakan
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const snapshot = await getMyDashboard();
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
      <GreetingHeader
        title={`Halo, ${firstName}!`}
        avatar={<HeaderAvatar name={snapshot.name} />}
      >
        {tagihan === null ? null : (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <InfoChip
              label="Sisa pokok"
              value={formatIDR(remainingPrincipalOf(tagihan))}
              hint={`dari ${formatIDR(
                sum([paidPrincipalOf(tagihan), remainingPrincipalOf(tagihan)]),
              )}`}
            />
            <NextDueChip tagihan={tagihan} />
          </div>
        )}
        <QuickActions actions={QUICK_ACTIONS} className="mt-4 pb-5" />
      </GreetingHeader>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6">
        {tagihan !== null && tagihan.overdueCount > 0 ? (
          <OverdueNotice overdueCount={tagihan.overdueCount} />
        ) : null}
        {tagihan !== null ? (
          <OverviewCard tagihan={tagihan} />
        ) : snapshot.facility !== null ? (
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Pengajuan pembiayaan</CardTitle>
                <Badge variant={STATUS_META[snapshot.facility.status].variant}>
                  {STATUS_META[snapshot.facility.status].label}
                </Badge>
              </div>
              <p className="text-sm text-foreground-muted">
                {snapshot.facility.publicRef}
              </p>
              <Link
                href={`/pembiayaan/${snapshot.facility.id}` as Route}
                className={LINK_CLASS}
              >
                Lihat detail pengajuan
              </Link>
            </CardContent>
          </Card>
        ) : (
          <EmptyFinanceCard />
        )}
        {tagihan === null ? null : <FundProgressCard tagihan={tagihan} />}
        <ApplicationsCard
          applications={snapshot.applications}
          activeCount={snapshot.activeApplicationCount}
        />
        <ProfileCard
          name={profileName}
          institution={institution}
          status={academicStatus}
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
      </div>
    </>
  );
}
