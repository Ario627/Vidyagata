"use client";

import { useEffect, useMemo, useState } from "react";
import { MoneyInput } from "@/components/financing/money-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldRoot,
} from "@/components/ui/field";
import {
  computePayrollDeduction,
  estimatePayoffPeriods,
  PAYROLL_DEDUCTION_RATES,
  type PayrollDeductionRate,
} from "@/domain/financing/deduction";
import {
  buildRepaymentSchedule,
  type RepaymentSchedule,
} from "@/domain/financing/schedule";
import { type Rupiah, rupiah } from "@/domain/money/money";
import { type PlainDate, plainDate } from "@/domain/time/plain-date";
import { formatIDR, formatIDRCompact } from "@/lib/format/currency";
import { formatPlainDateShort } from "@/lib/format/date";
import { formatPercentFromBp } from "@/lib/format/percent";
import { cn } from "@/lib/utils";
import { MoneyAmount } from "@/schemas/common";
import { SimulationSchema } from "@/schemas/financing";

const ASSUMED_ANNUAL_MARGIN_RATE_BP = 1200;
const ASSUMED_SERVICE_FEE_RATE_BP = 200;
const TENOR_OPTIONS = [6, 12, 18, 24] as const;
const AMOUNT_PRESETS = [4_000_000, 6_000_000, 8_000_000, 12_000_000].map(
  (value) => ({ value, label: formatIDRCompact(rupiah(value)) }),
);

type TenorMonths = (typeof TENOR_OPTIONS)[number];

type PayoffRow = {
  readonly rate: PayrollDeductionRate;
  readonly monthly: Rupiah;
  readonly months: number | null;
};

type EstimateData = {
  readonly tenorMonths: number;
  readonly firstDueDate: PlainDate;
  readonly perMonthFrom: Rupiah;
  readonly totals: RepaymentSchedule["totals"];
  readonly payoff: readonly PayoffRow[] | null;
};

type Estimate = {
  readonly data: EstimateData | null;
  readonly amountError: string | null;
};

function firstOfNextMonth(asOf: Date): PlainDate | null {
  const next = new Date(asOf.getFullYear(), asOf.getMonth() + 1, 1);
  const parsed = plainDate(next.getFullYear(), next.getMonth() + 1, 1);
  return parsed.ok ? parsed.value : null;
}

function computePayoff(earnings: Rupiah, outstanding: Rupiah): PayoffRow[] {
  return PAYROLL_DEDUCTION_RATES.map((rate) => {
    const monthly = computePayrollDeduction({ earnings, rate, outstanding });
    const months = estimatePayoffPeriods({
      outstanding,
      periodDeduction: monthly,
    });
    return { rate, monthly, months };
  });
}

function computeEstimate(input: {
  amount: number;
  tenorMonths: TenorMonths;
  earnings: Rupiah | null;
  firstDueDate: PlainDate;
}): Estimate {
  const parsed = SimulationSchema.safeParse({
    requestedAmount: input.amount,
    tenorMonths: input.tenorMonths,
    firstDueDate: input.firstDueDate,
  });
  if (!parsed.success) {
    const amountIssue = parsed.error.issues.find(
      (issue) => issue.path[0] === "requestedAmount",
    );
    return {
      data: null,
      amountError:
        amountIssue?.message ?? "Nominal tidak bisa dihitung, periksa kembali.",
    };
  }

  const schedule = buildRepaymentSchedule({
    principal: parsed.data.requestedAmount,
    tenorMonths: parsed.data.tenorMonths,
    annualMarginRateBp: ASSUMED_ANNUAL_MARGIN_RATE_BP,
    serviceFeeRateBp: ASSUMED_SERVICE_FEE_RATE_BP,
    firstDueDate: parsed.data.firstDueDate,
  });
  const rows = schedule.ok ? schedule.value.rows : undefined;
  const firstRow = rows === undefined ? undefined : rows[0];
  if (!schedule.ok || rows === undefined || firstRow === undefined) {
    return {
      data: null,
      amountError: "Nominal tidak bisa dihitung, periksa kembali.",
    };
  }

  const outstanding = schedule.value.totals.totalRepayment;
  return {
    data: {
      tenorMonths: parsed.data.tenorMonths,
      firstDueDate: parsed.data.firstDueDate,
      perMonthFrom: rupiah(Math.min(...rows.map((row) => row.total))),
      totals: schedule.value.totals,
      payoff:
        input.earnings === null
          ? null
          : computePayoff(input.earnings, outstanding),
    },
    amountError: null,
  };
}

function TenorSelector({
  value,
  onValueChange,
}: {
  value: TenorMonths;
  onValueChange: (value: TenorMonths) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-foreground">
        Jangka waktu
      </legend>
      <div className="grid grid-cols-4 gap-1.5">
        {TENOR_OPTIONS.map((option) => (
          <label
            key={option}
            className={cn(
              "flex h-11 cursor-pointer items-center justify-center rounded-md border border-border-strong text-sm font-medium tabular-nums",
              "text-foreground-muted transition-colors duration-150 ease-out",
              "has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
            )}
          >
            <input
              type="radio"
              name="tenorMonths"
              value={option}
              checked={value === option}
              onChange={() => onValueChange(option)}
              className="sr-only"
            />
            {option} bulan
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function PayoffTable({ rows }: { rows: readonly PayoffRow[] }) {
  return (
    <CardContent className="flex flex-col gap-2 border-border border-t pt-4">
      <p className="text-sm font-medium text-foreground">
        Bila dipotong dari penghasilan
      </p>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.rate}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <Badge variant="neutral" className="tabular-nums">
              {row.rate}%
            </Badge>
            <span className="tabular-nums text-foreground">
              {formatIDR(row.monthly)}/bulan
            </span>
            <span className="w-20 text-right tabular-nums text-foreground-muted">
              {row.months === null ? "—" : `± ${row.months} bulan`}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-2xs text-foreground-subtle">
        Estimasi dengan penghasilan tetap; potongan riil mengikuti mandat yang
        kamu tanda tangani.
      </p>
    </CardContent>
  );
}

function ResultPanel({
  estimate,
  className,
}: {
  estimate: Estimate;
  className?: string;
}) {
  const data = estimate.data;

  if (data === null) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            Estimasi cicilan
          </p>
          <p className="text-sm text-foreground-muted">
            Isi nominal, lalu pilih jangka waktu — rincian lengkap muncul di
            sini.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-1">
        <p className="text-sm text-foreground-muted">Cicilan mulai dari</p>
        <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
          {formatIDR(data.perMonthFrom)}
        </p>
        <p className="text-xs text-foreground-muted">
          per bulan, {data.tenorMonths} kali · cicilan pertama{" "}
          {formatPlainDateShort(data.firstDueDate)}
        </p>
      </CardContent>
      <CardContent>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-foreground-muted">Pokok pembiayaan</dt>
            <dd className="tabular-nums text-foreground">
              {formatIDR(data.totals.principal)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-foreground-muted">
              Margin {formatPercentFromBp(ASSUMED_ANNUAL_MARGIN_RATE_BP)} per
              tahun
            </dt>
            <dd className="tabular-nums text-foreground">
              {formatIDR(data.totals.margin)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-foreground-muted">
              Service fee {formatPercentFromBp(ASSUMED_SERVICE_FEE_RATE_BP)}{" "}
              (sekali)
            </dt>
            <dd className="tabular-nums text-foreground">
              {formatIDR(data.totals.serviceFee)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-border border-t pt-2">
            <dt className="font-semibold text-foreground">
              Total yang kamu bayar
            </dt>
            <dd className="text-base font-semibold tabular-nums text-foreground">
              {formatIDR(data.totals.totalRepayment)}
            </dd>
          </div>
        </dl>
      </CardContent>
      {data.payoff === null ? null : <PayoffTable rows={data.payoff} />}
      <CardContent className="border-border border-t pt-4">
        <p className="text-2xs text-foreground-subtle">
          Estimasi memakai asumsi di atas. Angka final ditentukan lembaga
          pembiayaan setelah pengajuanmu direview.
        </p>
      </CardContent>
    </Card>
  );
}

function SimulationTool({ className }: { className?: string }) {
  const [amount, setAmount] = useState<number | null>(null);
  const [tenor, setTenor] = useState<TenorMonths>(12);
  const [earnings, setEarnings] = useState<number | null>(null);
  const [firstDueDate, setFirstDueDate] = useState<PlainDate | null>(null);

  useEffect(() => {
    setFirstDueDate(firstOfNextMonth(new Date()));
  }, []);

  const earningsError = useMemo(() => {
    if (earnings === null) return null;
    const parsed = MoneyAmount.safeParse(earnings);
    return parsed.success
      ? null
      : (parsed.error.issues[0]?.message ?? "Nominal tidak valid.");
  }, [earnings]);

  const earningsValue = useMemo<Rupiah | null>(() => {
    if (earnings === null || earningsError !== null) return null;
    const parsed = MoneyAmount.safeParse(earnings);
    return parsed.success ? parsed.data : null;
  }, [earnings, earningsError]);

  const estimate = useMemo<Estimate>(() => {
    if (amount === null || firstDueDate === null) {
      return { data: null, amountError: null };
    }
    return computeEstimate({
      amount,
      tenorMonths: tenor,
      earnings: earningsValue,
      firstDueDate,
    });
  }, [amount, tenor, earningsValue, firstDueDate]);

  return (
    <div
      className={cn(
        "grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-10",
        className,
      )}
    >
      <div className="flex flex-col gap-5">
        <FieldRoot invalid={estimate.amountError !== null}>
          <FieldLabel>Nominal pembiayaan</FieldLabel>
          <MoneyInput
            value={amount}
            onValueChange={setAmount}
            placeholder="8.000.000"
          />
          {estimate.amountError === null ? null : (
            <FieldError match>{estimate.amountError}</FieldError>
          )}
        </FieldRoot>
        <div className="flex flex-wrap gap-1.5">
          {AMOUNT_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              variant="secondary"
              size="sm"
              onClick={() => setAmount(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <TenorSelector value={tenor} onValueChange={setTenor} />
        <FieldRoot invalid={earningsError !== null}>
          <FieldLabel>Penghasilan bulanan (opsional)</FieldLabel>
          <MoneyInput
            value={earnings}
            onValueChange={setEarnings}
            placeholder="2.000.000"
          />
          <FieldDescription>
            Isi untuk melihat estimasi waktu lunas bila cicilan dipotong dari
            penghasilan.
          </FieldDescription>
          {earningsError === null ? null : (
            <FieldError match>{earningsError}</FieldError>
          )}
        </FieldRoot>
      </div>
      <ResultPanel estimate={estimate} className="lg:sticky lg:top-8" />
    </div>
  );
}

export { SimulationTool };
