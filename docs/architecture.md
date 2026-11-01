# Architecture and foundation

## Scope and principles

The application supports a citizen portal and a government-officer portal for RTI request submission, processing, tracking, document handling, and analytics. It is planned for Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL, Prisma, Auth.js, and Gemini.

The repository currently has only the Next.js starter. This foundation defines contracts and boundaries; it does not implement authentication, database access, AI, uploads, or portal pages.

Principles:

- Route Handlers are transport adapters. They validate input, establish the actor, invoke a feature service, and serialize a typed result. Business rules and authorization belong in server-side services.
- Use Server Components by default, Client Components when interaction requires them, and feature-oriented modules for domain logic.
- TypeScript DTOs and runtime validation schemas are separate from Prisma persistence models. Never return Prisma records directly from an API.
- Enforce ownership and department scope on every protected server operation. UI visibility is not authorization.
- Record important business changes and their audit events atomically. Audit history is append-only.
- AI output is advisory. AI may classify or draft, but cannot approve or issue an official response.
- Store uploaded files in private object storage, not public application paths. Apply validation, malware scanning/quarantine, and per-download authorization.
- Canonical role, permission, status, transition, and API DTO definitions are owned by the shared contract modules linked in the README.

## RTI workflow and deadline handling

Model statutory events explicitly rather than assigning a single deadline to every application. The applicable timeline depends on the request facts, receiving channel/authority, transfers, fees, consultation, exemptions, and applicable central or state rules.

The workflow must support, at minimum, these rule cases for verification by the legal/product owner before production:

- Section 7(1): ordinarily 30 days from receipt by the PIO.
- Section 5(2): where an application is given to an APIO, account for the additional five days.
- Proviso to section 7(1): life or liberty request decision within 48 hours.
- Section 6(3): transfer to the appropriate public authority as soon as practicable and no later than five days, with notice to the applicant.
- Section 11: third-party notice/representation and the applicable decision period (including the 40-day case).
- Section 7(3): record fee intimation and payment events to calculate the statutory time exclusion correctly; support fee exemption where applicable.
- Section 24: model the applicable human-rights allegation/Commission approval process and its separate 45-day period.
- Sections 8 and 9: record the human decision and statutory grounds for denial; section 10 supports severing exempt material and disclosing the remainder when applicable.
- Missed decision periods and deemed-refusal handling must be represented explicitly.

These are workflow requirements, not legal advice. Verify current Act text, amendments, central/state rules, authority-specific procedures, and how days are computed before activating a rule. Rules should be versioned with jurisdiction, authority, effective dates, legal basis, and owner. Each request stores a snapshot of the selected rule and its triggering facts.

Represent deadlines with trigger events, due dates, rule/version, and pause/resume events. Preserve the actual timestamps and reason for each event so an officer can explain a calculated deadline. A transfer is a recorded event with source/destination, reason, date, and applicant notice; it must not silently reset the original request history.

The first appellate process is a distinct workflow and authority. Do not model an appeal as reopening or replacing the original PIO decision.

## Status workflow

The canonical `RequestStatus` union, transition graph, and guarded transition function are in `src/lib/domain/requests.ts`. Services must call that function and reject invalid transitions with HTTP `409 Conflict`; they must never accept an arbitrary status update.

Some transitions require evidence in addition to the graph: fee resolution to resume processing, completed third-party consultation, accepted transfer, recorded human approval, or a valid approval before issuance. Those conditions are represented by `RequestTransitionContext`. State change, corresponding domain event, and audit event must commit together.

Decision outcome (for example full disclosure, partial disclosure, denial with grounds) is separate from workflow status. AI job status and statutory deadline state are separate records as well.

## Roles and authorization boundaries

The canonical roles, permission identifiers, and mappings are in `src/lib/domain/permissions.ts`. Permission checks must be server-side and scoped by request ownership, department membership, assignment, or appeal authority as appropriate.

### Citizen permissions

Citizens can create requests and access only their own requests, events, attachments, and issued responses. They may edit drafts and withdraw only when the workflow permits. They cannot see internal notes, other citizens' records, department-only documents, or unissued officer drafts.

### Officer permissions

- APIO: receive/route work within assigned scope; no implied PIO decision or issuance authority.
- Dealing officer: process assigned work and prepare internal notes/drafts; no implied final statutory decision.
- PIO: decide, approve, and issue responses for authorized assigned matters.
- First Appellate Authority: access and decide matters within the separate appellate scope; no implied access to unrelated cases.

Assigning multiple roles to a user does not remove scope checks. Approval and issuance are distinct actions and require explicit human PIO authority. No AI or background worker has those permissions.

### Administrative permissions

- Department admin: manage department membership/configuration and department knowledge documents. This does not grant case-content access, assignment, decision, approval, or issuance permissions.
- Platform admin: technical operations only; no routine citizen or case-content permission. Exceptional support access, if introduced, must be separately authorized, time-bounded, justified, and audited.

### Background jobs

Background workers use narrowly scoped service credentials, not human roles. AI jobs can read only the request context and authorized department documents needed for their task, and can write analysis/draft records. They cannot transition a request to `APPROVED` or `RESPONSE_ISSUED`, or call approval/issuance operations.

## Document and AI boundaries

Uploads should use an authenticated upload-intent/finalization flow. Validate size and allowed file types using server-side checks (including content/signature checks, not only the submitted MIME type), quarantine and scan before use, assign opaque storage keys, and authorize every download. Enforce per-request or department scope and retain uploader/checksum/scan metadata. Never expose raw storage keys or public URLs.

Department knowledge documents must have access scope, version, and processing state. AI retrieval may include only authorized, approved departmental material relevant to the request. Each factual claim in an AI-generated response draft must carry references to supporting document versions and locations. If support is missing, the draft must identify that gap rather than fabricate a citation.

Persist AI model/version, job state, classification confidence, and citation references. Validate model output at runtime. Generated content remains an unapproved draft until an authorized human reviews it; only a PIO with explicit permission can approve and separately issue the official response. Record edits and decisions in the audit history.

## Database relationship plan

Member 3 owns the Prisma schema and every database migration. Relationships below are the conceptual model; exact fields and constraints are finalized in schema reviews.

- `User` has an optional `ApplicantProfile`; user-to-department access is through `DepartmentMembership`.
- `Department` has memberships and department-scoped knowledge documents.
- `RtiRequest` belongs to its applicant and responsible public authority/department. It has request events, deadlines, transfers, fee events, third-party consultations, request documents, AI analyses, draft versions, reviews, and official responses.
- `DeadlineRule` is jurisdiction/authority/effective-date scoped. `RequestDeadline` snapshots the selected rule and links trigger, pause/resume, and due-date events.
- `RequestTransfer` relates a request to source and destination departments and records reason, statutory transfer timing, acceptance, and applicant notification.
- `Document` stores private storage metadata, checksum, uploader, scan state, version, and access scope; request attachments and department knowledge sources have distinct scopes.
- `AIAnalysis` belongs to a request and records classification output and model metadata.
- `ResponseDraft` belongs to a request and has revisions. `DraftCitation` points to a specific department-document version and location.
- `Review` records the human reviewer and decision for a draft. `OfficialResponse` records the final approved content, decision outcome, approval, and issuance.
- `AuditEvent` is append-only and records actor, action, entity, timestamp, and appropriate change metadata. It covers submission, assignment, transfers, edits, approval, issuance, and status changes.
- `Notification` records recipient, request, channel, and delivery state.

Index request reference, department/status queues, assigned officer, and due dates. Apply foreign keys and uniqueness constraints to prevent duplicate public reference numbers and invalid relationships. Avoid storing file bytes in PostgreSQL.

## API conventions

The API is versioned under `/api/v1` and uses the success/error envelope and status mapping documented in `docs/api-contracts.md` and typed in `src/lib/contracts/api.ts`. Use explicit domain operations (assignment, transfer, review, approval, issuance) instead of generic mutation endpoints.

