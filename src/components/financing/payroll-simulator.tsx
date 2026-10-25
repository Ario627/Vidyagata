"use client";

import { useId, useState } from "react";
import {
  computePayrollDeduction,
  estimatePayoffPeriods,
  isPayrollDeductionRate,
  PAYROLL_DEDUCTION_RATES,
  type PayrollDeductionRate,
} from "@/domain/financing/deduction";
import { rupiah } from "@/domain/money/money";
import { formatIDR } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import { MoneyInput } from "./money-input";

type PayrollSimulatorProps = {
  readonly outstanding: number;
  readonly openPeriods: number;
  readonly currentRate: number | null;
};

function initialRateOf(currentRate: number | null): PayrollDeductionRate {
  return isPayrollDeductionRate(currentRate) ? currentRate : 40;
}

function PayrollSimulator({
  outstanding,
  openPeriods,
  currentRate,
}: PayrollSimulatorProps) {
  const inputId = useId();
  const [income, setIncome] = useState<number | null>(null);
  const [rate, setRate] = useState<PayrollDeductionRate>(() =>
    initialRateOf(currentRate),
  );
  const safeIncome = income ?? 0;
  const monthlyDeduction =
    safeIncome > 0
      ? computePayrollDeduction({
          earnings: rupiah(safeIncome),
          rate,
          outstanding: rupiah(outstanding),
        })
      : 0;
  const months =
    monthlyDeduction > 0
      ? estimatePayoffPeriods({
          outstanding: rupiah(outstanding),
          periodDeduction: rupiah(monthlyDeduction),
        })
      : null;
  const faster = months === null ? null : Math.max(0, openPeriods - months);

  return (
    <section
      data-slot="payroll-simulator"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Simulasi potongan penghasilan
        </h2>
        <p className="text-xs leading-5 text-foreground-muted">
          Lihat berapa lama sisa tagihan tertutup bila penghasilan kerjamu
          dipotong sebagian tiap bulan.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-2xs font-medium text-foreground-muted"
        >
          Penghasilan bulanan
        </label>
        <MoneyInput
          id={inputId}
          value={income}
          onValueChange={setIncome}
          placeholder="2.500.000"
          className="h-10"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-2xs font-medium text-foreground-muted">
          Potongan per bulan
        </span>
        <div className="flex gap-1.5">
          {PAYROLL_DEDUCTION_RATES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={option === rate}
              onClick={() => setRate(option)}
              className={cn(
                "h-9 flex-1 rounded-lg border text-xs font-semibold tabular-nums transition-colors duration-150 ease-out",
                option === rate
                  ? "border-primary bg-primary-subtle text-primary-hover"
                  : "border-border bg-surface text-foreground-muted hover:border-border-strong",
              )}
            >
              {option}%
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-ink-900 px-4 py-4 text-white">
        {months === null ? (
          <p className="text-xs leading-5 text-white/70">
            Isi penghasilan bulanan untuk melihat estimasi.
          </p>
        ) : (
          <>
            <p className="text-2xs uppercase tracking-[0.16em] text-white/50">
              Perkiraan lunas
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] tabular-nums">
              {months} bulan
            </p>
            <p className="mt-1 text-xs leading-5 text-white/70">
              Potongan {formatIDR(rupiah(monthlyDeduction))}/bulan
              {faster === null || faster === 0
                ? ""
                : ` · ${faster} bulan lebih cepat dari sisa jadwal`}
            </p>
          </>
        )}
      </div>
      <p className="text-2xs leading-4 text-foreground-subtle">
        Estimasi kasar berdasarkan sisa tagihan saat ini. Potongan sebenarnya
        mengikuti mekanisme payroll dan sisa tagihan pada saat pemotongan.
      </p>
    </section>
  );
}

export { PayrollSimulator };
