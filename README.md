# AI-Powered RTI Auto-Responder

A Next.js application to help citizens submit and track Right to Information (RTI) requests and help public authority officers process them. AI assistance is limited to classification and preparation of cited response drafts. Authorized officers retain responsibility for review, approval, and issuance.

## Project status

The repository currently contains the Next.js App Router starter plus the approved architecture and shared TypeScript contracts. Authentication, database integration, AI workflows, and application portals have not yet been implemented.

## Architecture and contribution

- [Architecture and foundation](./docs/architecture.md)
- [API contracts](./docs/api-contracts.md)
- [Team ownership and integration](./docs/team-ownership.md)

Canonical shared contracts live in:

- `src/lib/domain/requests.ts` — request statuses and permitted transitions.
- `src/lib/domain/permissions.ts` — role names, permission names, and role-to-permission mapping.
- `src/lib/contracts/api.ts` — shared API DTOs and response envelope types.

Do not redefine those contracts in feature code or documentation. Changes follow the communication and review process in [team ownership](./docs/team-ownership.md).

## Current stack

The starter uses Next.js App Router, TypeScript, and Tailwind CSS. PostgreSQL, Prisma, Auth.js, shadcn/ui, and Gemini are planned; no additional packages have been added as part of this foundation.

## Local development

Install dependencies with the package manager in use for this repository, then run:

```bash
npm run dev
```

The development server is available at [http://localhost:3000](http://localhost:3000).

## RTI workflow notice

Deadline calculation, exceptions, fees, transfers, and disclosure rules must follow the RTI Act, applicable rules, and the relevant public authority's procedures. The system must select and record the applicable rule for each request; it must not apply a single deadline to every case. The legal workflow described in the architecture is a design baseline and must be verified against current authoritative requirements before production use.
