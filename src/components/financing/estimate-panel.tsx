"use client";

import { useEffect, useMemo, useState } from "react";
import type { LenderTerms } from "@/data/lenders";
import { localPlainDateOf } from "@/domain/account/age";
import { buildRepaymentSchedule } from "@/domain/financing/schedule";
import { rupiah } from "@/domain/money/money";
import { addMonths } from "@/domain/time/calendar";
import type { PlainDate } from "@/domain/time/plain-date";
import { formatIDR } from "@/lib/format/currency";
import { formatPercentFromBp } from "@/lib/format/percent";
import { cn } from "@/lib/utils";

type EstimatePanelProps = {
  readonly amount: number;
  readonly terms: LenderTerms;
};

const BASE_TENOR_OPTIONS = [12, 24, 36, 48, 60] as const;

function tenorOptionsFor(maxTenorMonths: number): readonly number[] {
  const within: number[] = BASE_TENOR_OPTIONS.filter(
    (tenor) => tenor <= maxTenorMonths,
  );
  if (!within.includes(maxTenorMonths)) within.push(maxTenorMonths);
  return within;
}

function defaultTenorOf(options: readonly number[]): number {
  if (options.includes(24)) return 24;
  return options[options.length - 1] ?? 12;
}

function EstimatePanel({ amount, terms }: EstimatePanelProps) {
  const options = tenorOptionsFor(terms.maxTenorMonths);
  const [today, setToday] = useState<PlainDate | null>(null);
  const [tenor, setTenor] = useState<number>(() => defaultTenorOf(options));

  useEffect(() => {
    setToday(localPlainDateOf(new Date()));
  }, []);

  const schedule = useMemo(() => {
    if (today === null || amount <= 0) return null;
    const firstDueDate = addMonths(today, 1);
    if (!firstDueDate.ok) return null;
    const result = buildRepaymentSchedule({
      principal: rupiah(amount),
      tenorMonths: tenor,
      annualMarginRateBp: terms.marginRateBp,
      serviceFeeRateBp: terms.serviceFeeRateBp,
      firstDueDate: firstDueDate.value,
    });
    return result.ok ? result.value : null;
  }, [amount, tenor, terms.marginRateBp, terms.serviceFeeRateBp, today]);

  if (schedule === null) return null;
  const firstRow = schedule.rows[0];
  if (firstRow === undefined) return null;
  const exceedsCap = amount > terms.maxAmount;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface-raised p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-subtle">
          Perkiraan cicilan
        </p>
        <p className="text-2xs text-foreground-subtle">Tenor {tenor} bulan</p>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {formatIDR(firstRow.total)}
        <span className="text-sm font-medium text-foreground-muted">
          {" "}
          /bulan
        </span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === tenor}
            onClick={() => setTenor(option)}
            className={cn(
              "h-8 rounded-full border px-3 text-xs font-medium tabular-nums",
              "transition-colors duration-150 ease-out",
              option === tenor
                ? "border-primary bg-primary-subtle text-primary-hover"
                : "border-border bg-surface text-foreground-muted",
            )}
          >
            {option} bln
          </button>
        ))}
      </div>
      <dl className="flex flex-col gap-1.5 border-border border-t pt-3 text-xs">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-foreground-muted">Total pengembalian</dt>
          <dd className="tabular-nums text-foreground">
            {formatIDR(schedule.totals.totalRepayment)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-foreground-muted">
            Margin {formatPercentFromBp(terms.marginRateBp)}/tahun
          </dt>
          <dd className="tabular-nums text-foreground">
            {formatIDR(schedule.totals.margin)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-foreground-muted">
            Biaya layanan {formatPercentFromBp(terms.serviceFeeRateBp)} (sekali)
          </dt>
          <dd className="tabular-nums text-foreground">
            {formatIDR(schedule.totals.serviceFee)}
          </dd>
        </div>
      </dl>
      {exceedsCap ? (
        <p className="text-2xs leading-4 text-warning">
          Nominal melebihi plafon mitra saat ini ({formatIDR(terms.maxAmount)}).
          Pengajuan tetap bisa dikirim — plafon ditinjau operator.
        </p>
      ) : null}
      <p className="text-2xs leading-4 text-foreground-subtle">
        Angka final, termasuk tenor dan margin, ditetapkan saat pengajuan
        disetujui mitra pembiayaan.
      </p>
    </div>
  );
}

export { EstimatePanel };