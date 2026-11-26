# Soochna – AI-Powered RTI Auto-Responder

## 1. Project introduction
Soochna is an independent college-project prototype for an RTI application workflow. It provides citizen registration and submission, application tracking, officer review, departmental records management, AI-assisted analysis, response drafting, PIO approval, and citizen response visibility.

This prototype is not an official government portal. AI outputs are advisory and authorized humans remain responsible for decisions and response issuance.

## 2. Problem statement
Public-information workflows require applicants to submit structured requests and public officers to classify, search records, prepare cited responses, review approvals, and communicate decisions. A prototype should reduce repetitive work without weakening accountability or authorization.

## 3. Objectives
- Support citizen submission and reference-number tracking.
- Restrict officer access to authorized departments.
- Store departmental record metadata in PostgreSQL.
- Use authorized record context in the AI assistant.
- Separate AI drafts from approved and issued responses.
- Preserve status and action audit trails.
- Keep all AI features advisory.

## 4. Proposed solution
The application uses a Next.js App Router frontend and API routes, NextAuth credentials authentication, PostgreSQL with Prisma, Zod validation, Gemini with Groq fallback, and role and department authorization checks.

## 5. System architecture
- Citizen portal: registration, submission, dashboard, and tracking.
- Officer portal: authorized request queues and workflow actions.
- API layer: runtime validation, authentication, membership checks, and audit records.
- Database: users, memberships, RTI requests, status history, departmental records, drafts, final responses, and audit logs.
- AI layer: Gemini primary provider and Groq fallback, with redacted application context and authorized record metadata.

## 6. Technology stack
Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, PostgreSQL, Prisma 6, NextAuth 4, bcryptjs, Zod, Gemini API, and Groq API.

## 7. Database design
The Prisma schema includes `User`, `Account`, `Session`, `RtiRequest`, `RequestStatusHistory`, `Department`, `DepartmentMembership`, `DepartmentRecord`, `RtiResponseDraft`, `RtiFinalResponse`, and `AuditLog`. Requests belong to one department and citizen. Department records are associated with a department and have title, description, category, reference number, document type, relevant dates, storage reference, demonstration-data flag, and creator.

## 8. Authentication and authorization
Credentials login uses bcrypt password hashes and NextAuth JWT sessions. Server routes reload the user role and active department memberships. Platform administrators are the only cross-department role. Record and request APIs reject unauthorized departments. PIO-only routes control response approval and issue actions.

## 9. Citizen workflow
Citizens register and log in, submit an RTI request with a department and information period, receive a reference number, view own applications, and track status. The public track flow also validates reference number and email. Approved final responses are visible after issue; internal notes, drafts, and departmental record details are not exposed.

## 10. Officer workflow
Authorized officers list requests in active departments, view request details, update permitted statuses, save response drafts, and use the AI assistant. PIOs approve or issue final responses. Status changes and important response actions are recorded.

## 11. AI architecture
The assistant receives validated chat messages plus redacted application context. For selected officer applications, server-side code retrieves only records for the authorized department and adds matching metadata to the prompt. Provider output is validated before return. Demo responses are used only if no provider key is configured or providers are unavailable.

## 12. Gemini and Groq integration
Gemini is attempted first. Groq is used automatically if Gemini is unavailable or fails. Provider/network failures do not expose credentials or stack traces and fall back to a clearly identified demonstration response when no provider succeeds.

## 13. Departmental records retrieval
Records are matched to request subject and description using title, description, category, and document-type keywords. The match is advisory and limited to the selected application's department. Fictional seed metadata is explicitly marked with `isDemo`.

## 14. AI classification
The assistant prompt requires primary and secondary categories, suggested responsible department, distinct information points, required records, missing or ambiguous information, and uncertainty. Department suggestions do not transfer or reject requests automatically.

## 15. Response drafting
Drafts are stored separately from `RtiFinalResponse`. AI and officer drafts must be point-wise, cite available record references, mark missing facts as pending verification, and contain a PIO review checklist. AI cannot approve or issue.

## 16. Security considerations
- Zod validates API input.
- Server routes verify authentication and role.
- Department membership is checked on department-scoped operations.
- Citizen tracking requires both reference number and email.
- Applicant contact fields are intentionally omitted or redacted in AI context.
- Provider keys and database credentials remain in environment variables.
- Audit logs record important record and response actions.
- Uploaded-document storage is not implemented.

## 17. Installation instructions
```bash
npm install
npm run seed
npm run dev
```
The development server runs at `http://localhost:3000`.

## 18. Environment configuration
Copy `.env.example` to `.env` and configure `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`. Gemini and Groq keys are optional; one or both providers may be configured.

## 19. Database setup
Create a PostgreSQL database, set `DATABASE_URL`, then run:
```bash
npx prisma migrate deploy
npx prisma generate
npm run seed
```

## 20. Deployment instructions
The project is suitable for a Node.js Next.js host and externally hosted PostgreSQL. Set the production environment variables, apply migrations, run Prisma generation, build, and start the application. External provider keys must be configured in the host environment.

## 21. Known limitations
- No real document upload/object storage implementation.
- No automated AI-classification persistence endpoint.
- No end-to-end external deployment verification performed.
- Seed departmental records are fictional metadata only.
- Status transitions are a prototype model and do not implement all statutory RTI deadlines.
- Manual PIO/account provisioning may be required.

## 22. Challenges and solutions
Department restrictions were applied at route level rather than relying on UI visibility. AI context was limited to the selected application and authorized department records. Drafts and final responses were modeled separately, and PIO approval was isolated in dedicated routes.

## Features requiring manual testing
Authentication, actual database persistence, Gemini/Groq fallback, department authorization, PIO approval, citizen response visibility, and deployment behavior require manual verification before demonstration.
