import type { FinancingStatus } from "./state-machine";

export const DISBURSEMENT_REQUEST_STATUSES = [
  "requested",
  "approved",
  "rejected",
  "withdrawn",
  "executed",
] as const;

export type DisbursementRequestStatus =
  (typeof DISBURSEMENT_REQUEST_STATUSES)[number];

export type DisbursementRequestSnapshot = {
  readonly status: DisbursementRequestStatus;
  readonly initiatedByMe: boolean;
};

export type PencairanPermissions = {
  readonly recordLenderDecision: boolean;
  readonly recordAgreement: boolean;
  readonly initiate: boolean;
  readonly decide: boolean;
  readonly withdraw: boolean;
  readonly execute: boolean;
  readonly awaitingOtherParty: boolean;
};

export function isDisbursementRequestStatus(
  value: unknown,
): value is DisbursementRequestStatus {
  return (
    typeof value === "string" &&
    (DISBURSEMENT_REQUEST_STATUSES as readonly string[]).includes(value)
  );
}

export function isOpenDisbursementStatus(
  status: DisbursementRequestStatus,
): boolean {
  return status === "requested" || status === "approved";
}

export function pencairanPermissions(
  facilityStatus: FinancingStatus,
  request: DisbursementRequestSnapshot | null,
): PencairanPermissions {
  const requested = request?.status === "requested";
  const approved = request?.status === "approved";
  const mine = request?.initiatedByMe === true;
  const open = request !== null && isOpenDisbursementStatus(request.status);
  return {
    recordLenderDecision: facilityStatus === "forwarded_to_lender",
    recordAgreement: facilityStatus === "approved",
    initiate: facilityStatus === "signed" && !open,
    decide: requested && !mine,
    withdraw: requested && mine,
    execute: approved && mine,
    awaitingOtherParty: (requested && mine) || (approved && !mine),
  };
}
