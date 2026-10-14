import { describe, expect, it } from "vitest";
import { isOpenDisbursementStatus, pencairanPermissions } from "./disbursement";

describe("isOpenDisbursementStatus", () => {
  it("hanya requested dan approved yang dianggap berjalan", () => {
    expect(isOpenDisbursementStatus("requested")).toBe(true);
    expect(isOpenDisbursementStatus("approved")).toBe(true);
    expect(isOpenDisbursementStatus("rejected")).toBe(false);
    expect(isOpenDisbursementStatus("withdrawn")).toBe(false);
    expect(isOpenDisbursementStatus("executed")).toBe(false);
  });
});

describe("pencairanPermissions", () => {
  it("membuka pencatatan keputusan mitra pada tahap forwarded", () => {
    const permissions = pencairanPermissions("forwarded_to_lender", null);
    expect(permissions.recordLenderDecision).toBe(true);
    expect(permissions.recordAgreement).toBe(false);
    expect(permissions.initiate).toBe(false);
    expect(permissions.awaitingOtherParty).toBe(false);
  });

  it("membuka pencatatan perjanjian pada tahap approved", () => {
    const permissions = pencairanPermissions("approved", null);
    expect(permissions.recordAgreement).toBe(true);
    expect(permissions.recordLenderDecision).toBe(false);
    expect(permissions.initiate).toBe(false);
  });

  it("membuka inisiasi saat signed tanpa permintaan berjalan", () => {
    const permissions = pencairanPermissions("signed", null);
    expect(permissions.initiate).toBe(true);
    expect(permissions.decide).toBe(false);
    expect(permissions.execute).toBe(false);
  });

  it("pengaju bisa membatalkan, bukan menyetujui permintaannya sendiri", () => {
    const permissions = pencairanPermissions("signed", {
      status: "requested",
      initiatedByMe: true,
    });
    expect(permissions.withdraw).toBe(true);
    expect(permissions.decide).toBe(false);
    expect(permissions.awaitingOtherParty).toBe(true);
    expect(permissions.initiate).toBe(false);
  });

  it("petugas lain melihat tombol keputusan, bukan tombol batal", () => {
    const permissions = pencairanPermissions("signed", {
      status: "requested",
      initiatedByMe: false,
    });
    expect(permissions.decide).toBe(true);
    expect(permissions.withdraw).toBe(false);
    expect(permissions.awaitingOtherParty).toBe(false);
  });

  it("hanya pengaju yang sudah disetujui yang bisa mencatat transfer", () => {
    const mine = pencairanPermissions("signed", {
      status: "approved",
      initiatedByMe: true,
    });
    expect(mine.execute).toBe(true);
    expect(mine.awaitingOtherParty).toBe(false);
    const other = pencairanPermissions("signed", {
      status: "approved",
      initiatedByMe: false,
    });
    expect(other.execute).toBe(false);
    expect(other.awaitingOtherParty).toBe(true);
  });

  it("permintaan yang ditolak atau dibatalkan membuka inisiasi ulang", () => {
    expect(
      pencairanPermissions("signed", {
        status: "rejected",
        initiatedByMe: false,
      }).initiate,
    ).toBe(true);
    expect(
      pencairanPermissions("signed", {
        status: "withdrawn",
        initiatedByMe: true,
      }).initiate,
    ).toBe(true);
  });

  it("setelah dieksekusi tidak ada aksi tersisa", () => {
    const permissions = pencairanPermissions("disbursed", {
      status: "executed",
      initiatedByMe: true,
    });
    expect(permissions.initiate).toBe(false);
    expect(permissions.decide).toBe(false);
    expect(permissions.withdraw).toBe(false);
    expect(permissions.execute).toBe(false);
    expect(permissions.awaitingOtherParty).toBe(false);
  });
});
