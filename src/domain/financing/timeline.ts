import type { FinancingStatus } from "./state-machine";

export type TimelineStepState = "done" | "current" | "upcoming" | "stopped";

export type TimelineStep = {
  readonly status: FinancingStatus;
  readonly state: TimelineStepState;
  readonly occurredAt: string | null;
};

export type TimelineInput = {
  readonly current: FinancingStatus;
  readonly occurredAt: Partial<Record<FinancingStatus, string>>;
};

export type OccurredAtSource = {
  readonly status: FinancingStatus;
  readonly occurredAt: string | null;
};

const MAIN_PATH: readonly FinancingStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "forwarded_to_lender",
  "approved",
  "signed",
  "disbursed",
  "active",
  "paid_off",
];

const BRANCH_STATUSES: readonly FinancingStatus[] = [
  "defaulted",
  "rejected",
  "cancelled",
];

const RETRYABLE_BRANCHES: readonly FinancingStatus[] = ["defaulted"];

function lastMainIndexWithTime(
  occurredAt: Partial<Record<FinancingStatus, string>>,
): number {
  let last = 0;
  MAIN_PATH.forEach((status, index) => {
    if (occurredAt[status] !== undefined) last = index;
  });
  return last;
}

function mainEntriesUpTo(limit: number, input: TimelineInput): TimelineStep[] {
  const steps: TimelineStep[] = [];
  for (let index = 0; index <= limit; index += 1) {
    const status = MAIN_PATH[index];
    if (status === undefined) continue;
    steps.push({
      status,
      occurredAt: input.occurredAt[status] ?? null,
      state: status === input.current ? "current" : "done",
    });
  }
  return steps;
}

function insertByTime(steps: TimelineStep[], source: OccurredAtSource): void {
  const at = source.occurredAt;
  if (at === null) return;
  const step: TimelineStep = {
    status: source.status,
    occurredAt: at,
    state: "done",
  };
  const index = steps.findIndex(
    (existing) => existing.occurredAt !== null && existing.occurredAt > at,
  );
  if (index === -1) {
    steps.push(step);
    return;
  }
  steps.splice(index, 0, step);
}

export function mergeOccurredAt(
  sources: readonly OccurredAtSource[],
): Partial<Record<FinancingStatus, string>> {
  const map: Partial<Record<FinancingStatus, string>> = {};
  for (const source of sources) {
    if (source.occurredAt === null) continue;
    if (map[source.status] === undefined) {
      map[source.status] = source.occurredAt;
    }
  }
  return map;
}

export function buildStatusTimeline(
  input: TimelineInput,
): readonly TimelineStep[] {
  const currentIndex = MAIN_PATH.indexOf(input.current);
  const limit =
    currentIndex >= 0 ? currentIndex : lastMainIndexWithTime(input.occurredAt);
  const steps = mainEntriesUpTo(limit, input);
  for (const status of BRANCH_STATUSES) {
    if (status === input.current) continue;
    const at = input.occurredAt[status];
    if (at !== undefined) insertByTime(steps, { status, occurredAt: at });
  }
  if (currentIndex >= 0) {
    for (let index = currentIndex + 1; index < MAIN_PATH.length; index += 1) {
      const status = MAIN_PATH[index];
      if (status === undefined) continue;
      steps.push({ status, occurredAt: null, state: "upcoming" });
    }
    return steps;
  }
  steps.push({
    status: input.current,
    occurredAt: input.occurredAt[input.current] ?? null,
    state: "stopped",
  });
  if (RETRYABLE_BRANCHES.includes(input.current)) {
    for (let index = limit + 1; index < MAIN_PATH.length; index += 1) {
      const status = MAIN_PATH[index];
      if (status === undefined) continue;
      steps.push({ status, occurredAt: null, state: "upcoming" });
    }
  }
  return steps;
}
