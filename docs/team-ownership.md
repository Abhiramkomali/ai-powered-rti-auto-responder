# Team ownership and integration

## Responsibility split

### Member 1 — Citizen portal and request lifecycle

- Own citizen-facing submission, request status/timeline, and notifications.
- Consume the canonical request DTOs, role names, statuses, and API envelope; do not define local alternatives.
- Coordinate status and request-field changes with Members 2 and 3 before implementation.
- Use shared server-side authorization services for ownership checks; UI checks are not a security boundary.

### Member 2 — Officer portal and governance

- Own officer queues, assignment/routing UI, review and approval flows, department administration, department documents, and audit/timeline presentation.
- Use canonical transition rules and permission checks; do not write arbitrary status updates.
- Keep PIO approval and response issuance as explicit, separate human actions.
- Coordinate department-document/citation shapes with Member 3 and citizen-visible response behavior with Member 1.

### Member 3 — Platform, data, and AI

- Own shared platform contracts, Prisma schema, every Prisma migration, Auth.js foundation, server-side authorization and service conventions, deadline-rule engine, AI/document processing boundaries, and analytics data services.
- Be the sole author/owner of Prisma schema changes and migration generation/application. Members 1 and 2 must not edit `schema.prisma`, generate migrations, or apply migrations independently.
- Review data-model requests from Members 1 and 2, incorporate approved changes, and communicate resulting generated types/contracts to both.
- Ensure AI jobs cannot approve or issue responses; ensure factual drafts carry citations to authorized departmental document versions.

## Shared ownership and merge rules

Canonical shared contracts have one source:

- `src/lib/domain/requests.ts`: request statuses and status-transition policy.
- `src/lib/domain/permissions.ts`: role identifiers, permission identifiers, and role-permission mapping.
- `src/lib/contracts/api.ts`: shared DTOs and API response/error envelope.

No member should copy or redefine these declarations in UI, feature, route, or documentation files. Documentation should link to the canonical code and describe semantics without maintaining a second status or role list.

Before changing a shared contract, the proposing member must:

1. Open a PR and identify affected members, consumers, and the reason for the change.
2. Describe compatibility impact, API/version/migration implications, authorization effects, and tests required.
3. Notify the other two members and obtain review from the affected owners: Member 1 for citizen-facing contract use, Member 2 for officer/governance use, and Member 3 for shared domain/data/security contracts. Member 3 must approve changes that affect persistence, migrations, permissions, status transitions, or API compatibility.
4. Update the canonical source, directly related docs, and affected tests/consumers in the same change; do not merge until required reviews are complete and CI passes.
5. Announce the merged contract and migration/deployment order to the team before dependent work lands.

For breaking API changes, prefer an explicitly versioned migration plan over silently changing `/api/v1`. For Prisma changes, Member 3 includes a reviewed migration and rollout/backfill notes. Emergency changes still require a recorded PR and follow-up review.

## Integration checkpoints

1. Agree on domain fields, status transitions, permission boundaries, and response envelopes before feature branches depend on them.
2. Merge shared contracts and service signatures before parallel portal integration.
3. Integrate against shared API/schema contracts, not mocked per-member interfaces that drift.
4. Review end-to-end authorization, audit event coverage, transition guards, and migration ordering before release.

