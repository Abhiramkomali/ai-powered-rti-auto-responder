# API contracts

This document describes the planned HTTP surface. Shared TypeScript DTOs and the response envelope are defined only in `src/lib/contracts/api.ts`; role and permission names and request statuses are imported from their canonical domain modules. Route handlers must validate untrusted input at runtime before calling a service.

## Response envelope

Every JSON API response uses `ApiResponse<T>`:

- Success: `{ "ok": true, "data": ..., "requestId": "..." }`
- Error: `{ "ok": false, "error": { "code": "...", "message": "...", "fieldErrors": ... }, "requestId": "..." }`

`fieldErrors` is optional and maps input field names to validation messages. `requestId` is a correlation identifier in both forms. The HTTP response status is authoritative; do not duplicate it in the JSON body.

| HTTP status | Use |
|---|---|
| `200 OK` | Successful read or update with a response body. |
| `201 Created` | Resource created; include its representation and, where appropriate, a `Location` header. |
| `202 Accepted` | Asynchronous classification, draft, or scan job accepted; return its resource/job state, not a fabricated completed result. |
| `400 Bad Request` | Malformed request or invalid JSON. |
| `401 Unauthorized` | Missing or invalid authentication. |
| `403 Forbidden` | Authenticated actor lacks required capability or scope. |
| `404 Not Found` | Resource does not exist or is intentionally concealed from this actor. |
| `409 Conflict` | Invalid state transition, duplicate/conflicting operation, stale version, or unmet workflow precondition. |
| `413 Content Too Large` | Upload exceeds configured size limit. |
| `415 Unsupported Media Type` | File or request media type is not accepted. |
| `422 Unprocessable Content` | Well-formed input fails domain validation. |
| `429 Too Many Requests` | Rate limit exceeded; include `Retry-After` when known. |
| `500 Internal Server Error` | Unexpected server failure; do not expose secrets or stack traces. |
| `502 Bad Gateway` / `503 Service Unavailable` | Upstream provider failure or temporarily unavailable service. |

Return the common envelope for successful and failed operations; use `200` with an envelope rather than `204` when a successful operation has no meaningful resource body. Never return success-shaped data when a dependency fails.

## Planned endpoints

All `{requestId}` access requires server-side ownership, department/assignment, or appeal-scope authorization.

| Method and path | Purpose | Typical success |
|---|---|---|
| `POST /api/v1/requests` | Citizen submits an application. | `201` with `RtiRequestSummary`. |
| `GET /api/v1/requests` | List caller-visible requests/queues. | `200` with a paginated list. |
| `GET /api/v1/requests/{requestId}` | Read authorized request details and timeline. | `200` with `RtiRequestDetail`. |
| `POST /api/v1/requests/{requestId}/assignments` | Authorized routing/assignment. | `201` with assignment/event. |
| `POST /api/v1/requests/{requestId}/transfers` | Record statutory transfer and applicant notification. | `201` with transfer and deadline details. |
| `POST /api/v1/requests/{requestId}/fee-events` | Record fee intimation, payment, or exemption. | `201` with updated deadline information. |
| `POST /api/v1/requests/{requestId}/third-party-consultations` | Record consultation and its statutory events. | `201` with consultation state. |
| `POST /api/v1/requests/{requestId}/documents` | Create a validated upload intent for scoped storage. | `201` with `DocumentUploadIntent`. |
| `POST /api/v1/documents/{documentId}/complete` | Finalize upload and initiate quarantine/scan. | `202` with scan state. |
| `GET /api/v1/documents/{documentId}/download` | Authorize and stream or redirect a short-lived private download. | `200` with file, or `302` to a short-lived signed URL. |
| `POST /api/v1/requests/{requestId}/ai/classifications` | Queue advisory classification. | `202` with job/analysis state. |
| `POST /api/v1/requests/{requestId}/drafts` | Queue a cited AI draft or create an officer draft. | `202` for AI job; `201` for synchronous human draft. |
| `POST /api/v1/drafts/{draftId}/revisions` | Save an attributed draft revision. | `201` with new draft revision. |
| `POST /api/v1/drafts/{draftId}/reviews` | Record officer review/decision. | `201` with review record. |
| `POST /api/v1/drafts/{draftId}/approval` | Record explicit authorized human PIO approval. | `201` with approval. |
| `POST /api/v1/requests/{requestId}/issue` | Issue an approved official response as a separate PIO action. | `201` with official response. |
| Department/document management and analytics routes | Manage scoped department data and retrieve authorized metrics. | `200`/`201` as appropriate. |

Do not implement generic `PATCH ... { "status": ... }`. Each operation checks the canonical transition graph and required context, performs role/scope authorization, and atomically persists the domain change and audit event.

## Shared input/output DTOs

`src/lib/contracts/api.ts` is the canonical source for:

- `ApiResponse<T>`, `ApiSuccess<T>`, `ApiError`, and `ApiErrorCode`.
- `CreateRtiRequestInput`, `RtiRequestSummary`, and `RtiRequestDetail`.
- `DeadlineInfo`, `DocumentUploadIntent`, `ClassificationResult`, `ResponseDraft`, `DraftCitation`, and `ReviewDecisionInput`.
- `AuditEvent` for authorized audit/timeline consumers.

These types describe transport data, not persistence models. Add new shared DTOs there and reference them from route handlers, services, and UI. Do not create parallel request/response interfaces in feature folders. Validate incoming JSON and third-party/AI output at runtime using the project's chosen validation library when that is added.

## Upload security

Upload intent creation requires authenticated, authorized actor and known request/department scope. Enforce configured maximum size and allowlisted file types; validate file content/signature server-side after upload. Do not trust filename or client `Content-Type`. Uploads remain quarantined until scanning and validation succeed. Store an opaque key and metadata, not a public URL. Downloads re-check authorization every time and use short-lived access. Reject unsupported/oversized files with `415`/`413`, and report scan failures without exposing the object.

## AI draft and citation contract

Classification and draft generation are asynchronous operations. A response draft must include document-version citations for factual claims; citations refer to the exact authorized departmental source and location. If no supporting source is found, the draft must disclose the evidence gap for officer handling. Validate model output and citations before persistence. AI can create or revise a draft only; it has no approval or issuance endpoint/permission.

## Authorization and errors

Every endpoint uses permission identifiers from `src/lib/domain/permissions.ts` and checks resource scope. Return `403` for a known, visible resource where the caller lacks authority; `404` may be used to avoid disclosing resource existence. Reject invalid request transitions and unmet legal workflow preconditions with `409`, with stable error codes. Never return internal stack traces, credentials, prompt secrets, or storage keys.
