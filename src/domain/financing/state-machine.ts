import { err, ok, type Result } from "../shared/result";

export const FINANCING_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "forwarded_to_lender",
  "approved",
  "signed",
  "disbursed",
  "active",
  "paid_off",
  "defaulted",
  "rejected",
  "cancelled",
] as const;

export type FinancingStatus = (typeof FINANCING_STATUSES)[number];

export const TRANSITION_ACTORS = [
  "user",
  "operator",
  "lender",
  "system",
] as const;

export type TransitionActor = (typeof TRANSITION_ACTORS)[number];

export type TransitionRule = {
  readonly from: FinancingStatus;
  readonly to: FinancingStatus;
  readonly actors: readonly TransitionActor[];
};

export type TransitionError =
  | { readonly kind: "unknown_status" }
  | { readonly kind: "terminal"; readonly status: FinancingStatus }
  | {
      readonly kind: "not_allowed";
      readonly from: FinancingStatus;
      readonly to: FinancingStatus;
    }
  | {
      readonly kind: "actor_not_allowed";
      readonly from: FinancingStatus;
      readonly to: FinancingStatus;
      readonly actor: TransitionActor;
    };

const TERMINAL_STATUSES: ReadonlySet<FinancingStatus> = new Set([
  "paid_off",
  "rejected",
  "cancelled",
]);

const TRANSITIONS: readonly TransitionRule[] = [
  { from: "draft", to: "submitted", actors: ["user"] },
  { from: "submitted", to: "under_review", actors: ["system", "operator"] },
  { from: "under_review", to: "forwarded_to_lender", actors: ["operator"] },
  { from: "under_review", to: "rejected", actors: ["operator"] },
  { from: "under_review", to: "submitted", actors: ["operator"] },
  { from: "forwarded_to_lender", to: "approved", actors: ["lender"] },
  { from: "forwarded_to_lender", to: "rejected", actors: ["lender"] },
  { from: "approved", to: "signed", actors: ["user"] },
  { from: "signed", to: "disbursed", actors: ["system", "operator"] },
  { from: "disbursed", to: "active", actors: ["system"] },
  { from: "active", to: "paid_off", actors: ["system"] },
  { from: "active", to: "defaulted", actors: ["system"] },
  { from: "defaulted", to: "paid_off", actors: ["system"] },
  { from: "draft", to: "cancelled", actors: ["user", "system"] },
  { from: "submitted", to: "cancelled", actors: ["user", "system"] },
  { from: "under_review", to: "cancelled", actors: ["user", "system"] },
  { from: "approved", to: "cancelled", actors: ["user", "system"] },
];

export function isFinancingStatus(value: unknown): value is FinancingStatus {
  return (
    typeof value === "string" &&
    (FINANCING_STATUSES as readonly string[]).includes(value)
  );
}

export function parseFinancingStatus(
  value: unknown,
): Result<FinancingStatus, TransitionError> {
  return isFinancingStatus(value) ? ok(value) : err({ kind: "unknown_status" });
}

export function isTerminalStatus(status: FinancingStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

function findTransition(
  from: FinancingStatus,
  to: FinancingStatus,
): TransitionRule | undefined {
  return TRANSITIONS.find((rule) => rule.from === from && rule.to === to);
}

export function allowedTransitions(
  from: FinancingStatus,
  actor: TransitionActor,
): readonly FinancingStatus[] {
  return TRANSITIONS.filter(
    (rule) => rule.from === from && rule.actors.includes(actor),
  ).map((rule) => rule.to);
}

export function canTransition(
  from: FinancingStatus,
  to: FinancingStatus,
  actor: TransitionActor,
): boolean {
  const rule = findTransition(from, to);
  return rule?.actors.includes(actor) ?? false;
}

export function checkTransition(
  from: FinancingStatus,
  to: FinancingStatus,
  actor: TransitionActor,
): Result<FinancingStatus, TransitionError> {
  if (isTerminalStatus(from)) return err({ kind: "terminal", status: from });
  const rule = findTransition(from, to);
  if (rule === undefined) return err({ kind: "not_allowed", from, to });
  if (!rule.actors.includes(actor)) {
    return err({ kind: "actor_not_allowed", from, to, actor });
  }
  return ok(to);
}
