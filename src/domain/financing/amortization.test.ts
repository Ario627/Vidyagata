import { describe, expect, it } from "vitest";
import { rupiah } from "../money/money";
import { plainDate } from "../time/plain-date";
import type { InstallmentSettlement } from "./amortization";
import {
  NO_SETTLEMENT,
  nextUnsettledPosition,
  summarizeSchedule,
} from "./amortization";
import type { ScheduleRow } from "./schedule";
import { buildRepaymentSchedule } from "./schedule";

function date(value: string) {
  const parsed = plainDate(
    Number(value.slice(0, 4)),
    Number(value.slice(5, 7)),
    Number(value.slice(8, 10)),
  );
  if (!parsed.ok) throw new Error(`tanggal uji tidak valid: ${value}`);
  return parsed.value;
}

function schedule() {
  const result = buildRepaymentSchedule({
    principal: rupiah(1_200_000),
    tenorMonths: 6,
    annualMarginRateBp: 1200,
    serviceFeeRateBp: 200,
    firstDueDate: date("2026-01-29"),
  });
  if (!result.ok) throw new Error(`jadwal uji gagal: ${result.error}`);
  return result.value.rows;
}

function settle(row: ScheduleRow): InstallmentSettlement {
  return {
    principal: row.principal,
    margin: row.margin,
    fee: row.serviceFee,
    waived: false,
  };
}

function rowAt(rows: readonly ScheduleRow[], index: number): ScheduleRow {
  const row = rows[index];
  if (row === undefined) throw new Error(`periode ke-${index + 1} tidak ada`);
  return row;
}

describe("summarizeSchedule", () => {
  it("sisa pokok berakhir tepat nol di cicilan terakhir", () => {
    const rows = schedule();
    const settlements = rows.map(settle);
    const summary = summarizeSchedule({
      rows,
      settlements,
      asOf: date("2026-06-29"),
    });
    expect(rows.at(-1)?.remainingPrincipal).toBe(0);
    expect(summary.outstanding.principal).toBe(0);
    expect(summary.outstanding.total).toBe(0);
    expect(summary.progressBp).toBe(10_000);
  });

  it("mengungkapkan total dan sisa yang konsisten dengan jadwal", () => {
    const rows = schedule();
    const summary = summarizeSchedule({
      rows,
      settlements: rows.map(() => NO_SETTLEMENT),
      asOf: date("2026-01-01"),
    });
    expect(summary.disclosed.principal).toBe(1_200_000);
    expect(summary.disclosed.margin).toBe(72_000);
    expect(summary.disclosed.fee).toBe(24_000);
    expect(summary.disclosed.total).toBe(1_296_000);
    expect(summary.outstanding.total).toBe(summary.disclosed.total);
    expect(summary.progressBp).toBe(0);
    expect(summary.arrears).toBe(0);
  });

  it("memberi status due dan paid sesuai tanggal acuan tanpa pergeseran hari", () => {
    const rows = schedule();
    const settlements = rows.map((row, index) =>
      index < 2 ? settle(row) : NO_SETTLEMENT,
    );
    const summary = summarizeSchedule({
      rows,
      settlements,
      asOf: date("2026-03-29"),
    });
    expect(summary.positions.map((position) => position.state)).toEqual([
      "paid",
      "paid",
      "due",
      "due",
      "due",
      "due",
    ]);
    expect(summary.progressBp).toBe(3_333);
  });

  it("menandai overdue hanya setelah tanggal jatuh tempo terlewati", () => {
    const rows = schedule();
    const settlements = rows.map((row, index) =>
      index < 2 ? settle(row) : NO_SETTLEMENT,
    );
    const overdue = summarizeSchedule({
      rows,
      settlements,
      asOf: date("2026-03-30"),
    });
    expect(overdue.positions[2]?.state).toBe("overdue");
    expect(overdue.arrears).toBe(rowAt(rows, 2).total);
    expect(overdue.progressBp).toBe(3_333);
  });

  it("membedakan pembayaran sebagian dari tunggakan penuh", () => {
    const rows = schedule();
    const third = rowAt(rows, 2);
    const partial: InstallmentSettlement = {
      principal: rupiah(100_000),
      margin: rupiah(0),
      fee: rupiah(0),
      waived: false,
    };
    const beforeDue = summarizeSchedule({
      rows,
      settlements: [
        settle(rowAt(rows, 0)),
        settle(rowAt(rows, 1)),
        partial,
        NO_SETTLEMENT,
        NO_SETTLEMENT,
        NO_SETTLEMENT,
      ],
      asOf: date("2026-03-29"),
    });
    expect(beforeDue.positions[2]?.state).toBe("partially_paid");
    expect(beforeDue.positions[2]?.outstanding.total).toBe(
      third.total - 100_000,
    );
    expect(beforeDue.progressBp).toBe(
      Math.floor(((200_000 + 200_000 + 100_000) * 10_000) / 1_200_000),
    );
    const pastDue = summarizeSchedule({
      rows,
      settlements: [
        settle(rowAt(rows, 0)),
        settle(rowAt(rows, 1)),
        partial,
        NO_SETTLEMENT,
        NO_SETTLEMENT,
        NO_SETTLEMENT,
      ],
      asOf: date("2026-03-30"),
    });
    expect(pastDue.positions[2]?.state).toBe("overdue");
    expect(pastDue.arrears).toBe(third.total - 100_000);
  });

  it("menghapus kewajiban periode yang di-waive dari sisa dan tunggakan", () => {
    const rows = schedule();
    const waived: InstallmentSettlement = {
      ...settle(rowAt(rows, 0)),
      waived: true,
    };
    const summary = summarizeSchedule({
      rows,
      settlements: [
        waived,
        NO_SETTLEMENT,
        NO_SETTLEMENT,
        NO_SETTLEMENT,
        NO_SETTLEMENT,
        NO_SETTLEMENT,
      ],
      asOf: date("2026-01-29"),
    });
    expect(summary.positions[0]?.state).toBe("waived");
    expect(summary.positions[0]?.outstanding.total).toBe(0);
    expect(summary.outstanding.total).toBe(
      summary.disclosed.total - rowAt(rows, 0).total,
    );
    expect(summary.arrears).toBe(0);
  });

  it("mencatat kelebihan bayar tanpa menambah progres pokok di atas batas", () => {
    const rows = schedule();
    const first = rowAt(rows, 0);
    const overpaid: InstallmentSettlement = {
      principal: rupiah(first.principal + 1),
      margin: first.margin,
      fee: first.serviceFee,
      waived: false,
    };
    const summary = summarizeSchedule({
      rows,
      settlements: [
        overpaid,
        NO_SETTLEMENT,
        NO_SETTLEMENT,
        NO_SETTLEMENT,
        NO_SETTLEMENT,
        NO_SETTLEMENT,
      ],
      asOf: date("2026-01-29"),
    });
    expect(summary.positions[0]?.state).toBe("paid");
    expect(summary.overpaid).toBe(1);
    expect(summary.settled.principal).toBe(first.principal + 1);
  });

  it("mengakrualkan margin per periode hingga tepat sama dengan yang diungkapkan", () => {
    const rows = schedule();
    const early = summarizeSchedule({
      rows,
      settlements: rows.map(() => NO_SETTLEMENT),
      asOf: date("2026-03-29"),
    });
    expect(early.accruedMargin).toBe(36_000);
    const complete = summarizeSchedule({
      rows,
      settlements: rows.map(() => NO_SETTLEMENT),
      asOf: date("2026-06-29"),
    });
    expect(complete.accruedMargin).toBe(complete.disclosed.margin);
  });

  it("deterministik dan menolak jumlah penyelesaian yang tidak cocok", () => {
    const rows = schedule();
    const input = {
      rows,
      settlements: rows.map(() => NO_SETTLEMENT),
      asOf: date("2026-02-01"),
    };
    expect(summarizeSchedule(input)).toEqual(summarizeSchedule(input));
    expect(() =>
      summarizeSchedule({ ...input, settlements: [NO_SETTLEMENT] }),
    ).toThrow(RangeError);
  });
});

describe("nextUnsettledPosition", () => {
  it("mengembalikan periode belum lunas paling awal lalu null saat selesai", () => {
    const rows = schedule();
    const summary = summarizeSchedule({
      rows,
      settlements: [
        settle(rowAt(rows, 0)),
        NO_SETTLEMENT,
        NO_SETTLEMENT,
        NO_SETTLEMENT,
        NO_SETTLEMENT,
        NO_SETTLEMENT,
      ],
      asOf: date("2026-02-28"),
    });
    expect(nextUnsettledPosition(summary.positions)?.period).toBe(2);
    const cleared = summarizeSchedule({
      rows,
      settlements: rows.map(settle),
      asOf: date("2026-06-29"),
    });
    expect(nextUnsettledPosition(cleared.positions)).toBeNull();
  });
});
