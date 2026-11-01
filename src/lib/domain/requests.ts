export const requestStatuses = [
  "DRAFT",
  "SUBMITTED",
  "ROUTING",
  "ASSIGNED",
  "UNDER_REVIEW",
  "AWAITING_FEE",
  "AWAITING_THIRD_PARTY",
  "TRANSFERRED",
  "DRAFTING_RESPONSE",
  "AWAITING_APPROVAL",
  "APPROVED",
  "RESPONSE_ISSUED",
  "CLOSED",
  "WITHDRAWN",
] as const;

export type RequestStatus = (typeof requestStatuses)[number];

export const permittedRequestStatusTransitions = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["ROUTING", "ASSIGNED", "AWAITING_FEE", "WITHDRAWN"],
  ROUTING: ["ASSIGNED", "TRANSFERRED", "AWAITING_FEE", "WITHDRAWN"],
  ASSIGNED: ["UNDER_REVIEW", "TRANSFERRED", "AWAITING_FEE", "WITHDRAWN"],
  UNDER_REVIEW: [
    "DRAFTING_RESPONSE",
    "AWAITING_THIRD_PARTY",
    "TRANSFERRED",
    "AWAITING_FEE",
    "WITHDRAWN",
  ],
  AWAITING_FEE: ["ROUTING", "ASSIGNED", "UNDER_REVIEW", "WITHDRAWN"],
  AWAITING_THIRD_PARTY: ["UNDER_REVIEW", "WITHDRAWN"],
  TRANSFERRED: ["ROUTING", "ASSIGNED", "WITHDRAWN"],
  DRAFTING_RESPONSE: ["AWAITING_APPROVAL", "WITHDRAWN"],
  AWAITING_APPROVAL: ["DRAFTING_RESPONSE", "APPROVED"],
  APPROVED: ["RESPONSE_ISSUED"],
  RESPONSE_ISSUED: ["CLOSED"],
  CLOSED: [],
  WITHDRAWN: [],
} as const satisfies Record<RequestStatus, readonly RequestStatus[]>;

export interface RequestTransitionContext {
  feeResolved?: boolean;
  thirdPartyConsultationComplete?: boolean;
  transferAccepted?: boolean;
  humanApprovalRecorded?: boolean;
  approvedResponseExists?: boolean;
}

export function isValidRequestStatusTransition(
  from: RequestStatus,
  to: RequestStatus,
  context: RequestTransitionContext = {},
): boolean {
  if (!(permittedRequestStatusTransitions[from] as readonly RequestStatus[]).includes(to)) {
    return false;
  }

  if (
    from === "AWAITING_FEE" &&
    to !== "WITHDRAWN" &&
    !context.feeResolved
  ) {
    return false;
  }
  if (
    from === "AWAITING_THIRD_PARTY" &&
    to !== "WITHDRAWN" &&
    !context.thirdPartyConsultationComplete
  ) {
    return false;
  }
  if (
    from === "TRANSFERRED" &&
    to !== "WITHDRAWN" &&
    !context.transferAccepted
  ) {
    return false;
  }
  if (to === "APPROVED" && !context.humanApprovalRecorded) {
    return false;
  }
  if (to === "RESPONSE_ISSUED" && !context.approvedResponseExists) {
    return false;
  }

  return true;
}
