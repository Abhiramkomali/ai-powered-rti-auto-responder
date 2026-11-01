import type { RequestStatus } from "@/lib/domain/requests";
import type { UserRole } from "@/lib/domain/permissions";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "CONTENT_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "UPSTREAM_ERROR"
  | "SERVICE_UNAVAILABLE";

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  requestId: string;
}

export interface ApiError {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
  requestId: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface CreateRtiRequestInput {
  subject: string;
  description: string;
  departmentId?: string;
  lifeOrLiberty: boolean;
  preferredLanguage?: string;
}

export interface RtiRequestSummary {
  id: string;
  referenceNumber: string;
  status: RequestStatus;
  subject: string;
  departmentId: string;
  submittedAt: string;
  deadline: DeadlineInfo | null;
}

export interface RtiRequestDetail extends RtiRequestSummary {
  description: string;
  applicantId: string;
  assignedOfficerId: string | null;
  events: AuditEvent[];
  documents: DocumentSummary[];
}

export interface DeadlineInfo {
  dueAt: string;
  ruleId: string;
  legalBasis: string;
  calculationState: "ACTIVE" | "PAUSED" | "MET" | "OVERDUE";
}

export interface DocumentUploadIntent {
  documentId: string;
  uploadUrl: string;
  expiresAt: string;
  maximumBytes: number;
  acceptedMediaTypes: string[];
}

export interface DocumentSummary {
  id: string;
  filename: string;
  mediaType: string;
  sizeBytes: number;
  uploadedAt: string;
  scanState: "QUARANTINED" | "SCANNING" | "AVAILABLE" | "REJECTED";
}

export interface ClassificationResult {
  requestId: string;
  suggestedDepartmentId: string | null;
  category: string | null;
  confidence: number;
  rationale: string;
  model: string;
  createdAt: string;
}

export interface DraftCitation {
  documentId: string;
  documentVersion: string;
  pageOrSection: string;
  supportingExcerpt: string;
}

export type DraftCreator =
  | { kind: "USER"; role: UserRole }
  | { kind: "AI"; model: string };

export interface ResponseDraft {
  id: string;
  requestId: string;
  version: number;
  text: string;
  citations: DraftCitation[];
  evidenceGaps: string[];
  createdBy: DraftCreator;
  createdAt: string;
}

export interface ReviewDecisionInput {
  decision: "APPROVE" | "REQUEST_CHANGES" | "REJECT";
  notes?: string;
  expectedDraftVersion: number;
}

export interface AuditEvent {
  id: string;
  requestId: string;
  actorId: string;
  action:
    | "SUBMITTED"
    | "ASSIGNED"
    | "TRANSFERRED"
    | "EDITED"
    | "STATUS_CHANGED"
    | "APPROVED"
    | "RESPONSE_ISSUED";
  occurredAt: string;
  details: Record<string, string | number | boolean | null>;
}
