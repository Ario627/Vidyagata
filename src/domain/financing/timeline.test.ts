import { describe, expect, it } from "vitest";
import { buildStatusTimeline, mergeOccurredAt } from "./timeline";

const T = {
  draft: "2026-10-01T00:00:00.000Z",
  submitted: "2026-10-02T00:00:00.000Z",
  underReview: "2026-10-03T00:00:00.000Z",
  forwarded: "2026-10-04T00:00:00.000Z",
  approved: "2026-10-05T00:00:00.000Z",
  signed: "2026-10-06T00:00:00.000Z",
  disbursed: "2026-10-07T00:00:00.000Z",
  active: "2026-10-08T00:00:00.000Z",
  defaulted: "2026-10-09T00:00:00.000Z",
  paidOff: "2026-10-10T00:00:00.000Z",
  cancelled: "2026-10-11T00:00:00.000Z",
  rejected: "2026-10-12T00:00:00.000Z",
} as const;

describe("mergeOccurredAt", () => {
  it("memakai kemunculan pertama per status", () => {
    const map = mergeOccurredAt([
      { status: "draft", occurredAt: T.draft },
      { status: "submitted", occurredAt: T.submitted },
      { status: "submitted", occurredAt: T.forwarded },
      { status: "under_review", occurredAt: null },
    ]);
    expect(map.draft).toBe(T.draft);
    expect(map.submitted).toBe(T.submitted);
    expect(map.under_review).toBeUndefined();
  });
});

describe("buildStatusTimeline", () => {
  it("menampilkan langkah selesai, langkah sekarang, dan langkah berikutnya", () => {
    const steps = buildStatusTimeline({
      current: "submitted",
      occurredAt: { draft: T.draft, submitted: T.submitted },
    });
    expect(steps.map((step) => [step.status, step.state])).toEqual([
      ["draft", "done"],
      ["submitted", "current"],
      ["under_review", "upcoming"],
      ["forwarded_to_lender", "upcoming"],
      ["approved", "upcoming"],
      ["signed", "upcoming"],
      ["disbursed", "upcoming"],
      ["active", "upcoming"],
      ["paid_off", "upcoming"],
    ]);
    expect(steps[0]?.occurredAt).toBe(T.draft);
    expect(steps[2]?.occurredAt).toBeNull();
  });

  it("menyisipkan defaulted secara kronologis sebelum paid_off", () => {
    const steps = buildStatusTimeline({
      current: "paid_off",
      occurredAt: {
        draft: T.draft,
        submitted: T.submitted,
        under_review: T.underReview,
        forwarded_to_lender: T.forwarded,
        approved: T.approved,
        signed: T.signed,
        disbursed: T.disbursed,
        active: T.active,
        defaulted: T.defaulted,
        paid_off: T.paidOff,
      },
    });
    expect(steps.map((step) => step.status)).toEqual([
      "draft",
      "submitted",
      "under_review",
      "forwarded_to_lender",
      "approved",
      "signed",
      "disbursed",
      "active",
      "defaulted",
      "paid_off",
    ]);
    expect(steps.at(-1)?.state).toBe("current");
    expect(steps[8]?.state).toBe("done");
  });

  it("berhenti di rejected tanpa langkah berikutnya", () => {
    const steps = buildStatusTimeline({
      current: "rejected",
      occurredAt: {
        draft: T.draft,
        submitted: T.submitted,
        under_review: T.underReview,
        forwarded_to_lender: T.forwarded,
        rejected: T.rejected,
      },
    });
    const last = steps.at(-1);
    expect(last?.status).toBe("rejected");
    expect(last?.state).toBe("stopped");
    expect(steps.some((step) => step.state === "upcoming")).toBe(false);
    expect(steps.map((step) => step.status)).not.toContain("approved");
  });

  it("menghentikan pengajuan yang dibatalkan dari draf", () => {
    const steps = buildStatusTimeline({
      current: "cancelled",
      occurredAt: { draft: T.draft, cancelled: T.cancelled },
    });
    expect(steps.map((step) => [step.status, step.state])).toEqual([
      ["draft", "done"],
      ["cancelled", "stopped"],
    ]);
  });

  it("menyisakan jalan lunas setelah gagal bayar", () => {
    const steps = buildStatusTimeline({
      current: "defaulted",
      occurredAt: {
        draft: T.draft,
        submitted: T.submitted,
        active: T.active,
        defaulted: T.defaulted,
      },
    });
    const stopped = steps.find((step) => step.status === "defaulted");
    const upcoming = steps.filter((step) => step.state === "upcoming");
    expect(stopped?.state).toBe("stopped");
    expect(upcoming.map((step) => step.status)).toEqual(["paid_off"]);
  });

  it("mempertahankan urutan kanonik saat cap waktu tidak lengkap", () => {
    const steps = buildStatusTimeline({
      current: "approved",
      occurredAt: { draft: T.draft, approved: T.approved },
    });
    expect(steps.map((step) => step.status).slice(0, 5)).toEqual([
      "draft",
      "submitted",
      "under_review",
      "forwarded_to_lender",
      "approved",
    ]);
    expect(steps[1]?.occurredAt).toBeNull();
    expect(steps[1]?.state).toBe("done");
  });

  it("memulai dari draf saat belum ada cap waktu lain", () => {
    const steps = buildStatusTimeline({ current: "draft", occurredAt: {} });
    expect(steps[0]?.status).toBe("draft");
    expect(steps[0]?.state).toBe("current");
    expect(steps).toHaveLength(9);
  });

  it("deterministik untuk input identik", () => {
    const input = {
      current: "signed" as const,
      occurredAt: { draft: T.draft, submitted: T.submitted, signed: T.signed },
    };
    expect(buildStatusTimeline(input)).toEqual(buildStatusTimeline(input));
  });
});
