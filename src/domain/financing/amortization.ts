import { add, type Rupiah, rupiah, sum, ZERO } from "../money/money";
import { comparePlainDate, type PlainDate } from "../time/plain-date";
import type { ScheduleRow } from "./schedule";

export type InstallmentState =
  | "due"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "waived";

export type InstallmentSettlement = {
  readonly principal: Rupiah;
  readonly margin: Rupiah;
  readonly fee: Rupiah;
  readonly waived: boolean;
};

export type SettlementTotals = {
  readonly principal: Rupiah;
  readonly margin: Rupiah;
  readonly fee: Rupiah;
  readonly total: Rupiah;
};

export type InstallmentPosition = {
  readonly period: number;
  readonly dueDate: PlainDate;
  readonly state: InstallmentState;
  readonly settled: SettlementTotals;
  readonly outstanding: SettlementTotals;
  readonly overpaid: Rupiah;
};

export type ScheduleSummary = {
  readonly positions: readonly InstallmentPosition[];
  readonly disclosed: SettlementTotals;
  readonly settled: SettlementTotals;
  readonly outstanding: SettlementTotals;
  readonly arrears: Rupiah;
  readonly overpaid: Rupiah;
  readonly accruedMargin: Rupiah;
  readonly progressBp: number;
};

export type ScheduleSummaryInput = {
  readonly rows: readonly ScheduleRow[];
  readonly settlements: readonly InstallmentSettlement[];
  readonly asOf: PlainDate;
};

export const NO_SETTLEMENT: InstallmentSettlement = {
  principal: ZERO,
  margin: ZERO,
  fee: ZERO,
  waived: false,
};

const BASIS_POINTS = 10_000;
const FULL_PROGRESS_BP = 10_000;

function settlementTotals(settlement: InstallmentSettlement): SettlementTotals {
  return {
    principal: settlement.principal,
    margin: settlement.margin,
    fee: settlement.fee,
    total: add(add(settlement.principal, settlement.margin), settlement.fee),
  };
}

function rowTotals(row: ScheduleRow): SettlementTotals {
  return {
    principal: row.principal,
    margin: row.margin,
    fee: row.serviceFee,
    total: row.total,
  };
}

function outstandingOf(amount: Rupiah, settled: Rupiah): Rupiah {
  return settled >= amount ? ZERO : rupiah(amount - settled);
}

function excessOf(amount: Rupiah, settled: Rupiah): Rupiah {
  return settled > amount ? rupiah(settled - amount) : ZERO;
}

function isPastDue(dueDate: PlainDate, asOf: PlainDate): boolean {
  return comparePlainDate(dueDate, asOf) < 0;
}

function stateOf(input: {
  readonly settledTotal: Rupiah;
  readonly total: Rupiah;
  readonly dueDate: PlainDate;
  readonly asOf: PlainDate;
}): InstallmentState {
  if (input.settledTotal >= input.total) return "paid";
  if (isPastDue(input.dueDate, input.asOf)) return "overdue";
  return input.settledTotal > ZERO ? "partially_paid" : "due";
}

export function nextUnsettledPosition(
  positions: readonly InstallmentPosition[],
): InstallmentPosition | null {
  for (const position of positions) {
    if (position.state !== "paid" && position.state !== "waived") {
      return position;
    }
  }
  return null;
}

function zeroTotals(): SettlementTotals {
  return { principal: ZERO, margin: ZERO, fee: ZERO, total: ZERO };
}

function positionOf(
  row: ScheduleRow,
  settlement: InstallmentSettlement,
  asOf: PlainDate,
): InstallmentPosition {
  const settled = settlementTotals(settlement);
  if (settlement.waived) {
    return {
      period: row.index,
      dueDate: row.dueDate,
      state: "waived",
      settled,
      outstanding: zeroTotals(),
      overpaid: settled.total,
    };
  }
  const principal = outstandingOf(row.principal, settled.principal);
  const margin = outstandingOf(row.margin, settled.margin);
  const fee = outstandingOf(row.serviceFee, settled.fee);
  return {
    period: row.index,
    dueDate: row.dueDate,
    state: stateOf({
      settledTotal: settled.total,
      total: row.total,
      dueDate: row.dueDate,
      asOf,
    }),
    settled,
    outstanding: {
      principal,
      margin,
      fee,
      total: add(add(principal, margin), fee),
    },
    overpaid: add(
      add(
        excessOf(row.principal, settled.principal),
        excessOf(row.margin, settled.margin),
      ),
      excessOf(row.serviceFee, settled.fee),
    ),
  };
}

function totalsOf(entries: readonly SettlementTotals[]): SettlementTotals {
  return {
    principal: sum(entries.map((entry) => entry.principal)),
    margin: sum(entries.map((entry) => entry.margin)),
    fee: sum(entries.map((entry) => entry.fee)),
    total: sum(entries.map((entry) => entry.total)),
  };
}

function accruedMarginOf(
  rows: readonly ScheduleRow[],
  asOf: PlainDate,
): Rupiah {
  return sum(
    rows
      .filter((row) => comparePlainDate(row.dueDate, asOf) <= 0)
      .map((row) => row.margin),
  );
}

function arrearsOf(positions: readonly InstallmentPosition[]): Rupiah {
  return sum(
    positions
      .filter((position) => position.state === "overdue")
      .map((position) => position.outstanding.total),
  );
}

function progressBpOf(
  disclosedPrincipal: Rupiah,
  settledPrincipal: Rupiah,
): number {
  if (disclosedPrincipal <= ZERO) return FULL_PROGRESS_BP;
  return Math.floor((settledPrincipal * BASIS_POINTS) / disclosedPrincipal);
}

export function summarizeSchedule(
  input: ScheduleSummaryInput,
): ScheduleSummary {
  if (input.rows.length !== input.settlements.length) {
    throw new RangeError(
      "Jumlah penyelesaian tidak cocok dengan jumlah periode",
    );
  }
  const positions = input.rows.map((row, index) => {
    const settlement = input.settlements[index];
    if (settlement === undefined) {
      throw new RangeError(
        `Penyelesaian periode ke-${index + 1} tidak tersedia`,
      );
    }
    return positionOf(row, settlement, input.asOf);
  });
  const disclosed = totalsOf(input.rows.map(rowTotals));
  const settled = totalsOf(positions.map((position) => position.settled));
  const outstanding = totalsOf(
    positions.map((position) => position.outstanding),
  );
  return {
    positions,
    disclosed,
    settled,
    outstanding,
    arrears: arrearsOf(positions),
    overpaid: sum(positions.map((position) => position.overpaid)),
    accruedMargin: accruedMarginOf(input.rows, input.asOf),
    progressBp: progressBpOf(disclosed.principal, settled.principal),
  };
}
