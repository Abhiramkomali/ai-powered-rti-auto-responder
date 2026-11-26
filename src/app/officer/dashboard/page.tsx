import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { authOptions } from "@/lib/auth";
import { isAssistantConfigured } from "@/lib/ai/assistant";
import { prisma } from "@/lib/prisma";
import { AiAssistant } from "@/components/ai-assistant";

const officerRoles = new Set([
  "APIO",
  "DEALING_OFFICER",
  "PIO",
  "FIRST_APPELLATE_AUTHORITY",
  "DEPARTMENT_ADMIN",
  "PLATFORM_ADMIN",
]);

export const instant = false;

export default async function OfficerDashboardPage() {
  await connection();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      role: true,
      isActive: true,
      memberships: {
        where: { isActive: true },
        select: { departmentId: true, department: { select: { name: true } } },
      },
    },
  });
  if (!user?.isActive || !officerRoles.has(user.role)) redirect("/login");

  const departmentIds = user.memberships.map((membership) => membership.departmentId);
  const departmentFilter =
    user.role === "PLATFORM_ADMIN"
      ? {}
      : departmentIds.length > 0
        ? { departmentId: { in: departmentIds } }
        : { id: "__no_department_access__" };

  const [total, submitted, underReview, awaitingApproval, completed] =
    await Promise.all([
      prisma.rtiRequest.count({ where: departmentFilter }),
      prisma.rtiRequest.count({ where: { ...departmentFilter, status: "SUBMITTED" } }),
      prisma.rtiRequest.count({ where: { ...departmentFilter, status: "UNDER_REVIEW" } }),
      prisma.rtiRequest.count({ where: { ...departmentFilter, status: "AWAITING_APPROVAL" } }),
      prisma.rtiRequest.count({
        where: { ...departmentFilter, status: { in: ["RESPONSE_ISSUED", "CLOSED"] } },
      }),
    ]);

  const departments =
    user.role === "PLATFORM_ADMIN"
      ? await prisma.department.findMany({ select: { name: true }, orderBy: { name: "asc" } })
      : user.memberships.map((membership) => ({ name: membership.department.name }));

const assistantRequests = await prisma.rtiRequest.findMany({
  where: departmentFilter,
  orderBy: { submittedAt: "desc" },
  take: 100,
  select: {
    id: true,
    referenceNumber: true,
    subject: true,
  },
});
  return (
    <main style={{ minHeight: "100vh", background: "#f5f7f9", padding: "2.5rem 5vw" }}>
      <section style={{ maxWidth: 1160, margin: "0 auto" }}>
        <span className="eyebrow">Officer portal</span>
        <h1 style={{ color: "var(--navy)", marginBottom: "0.5rem" }}>Officer dashboard</h1>
        <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
          Welcome, {user.name ?? "officer"}.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginBottom: "1.5rem" }}>
          {departments.map((department) => (
            <span key={department.name} style={{ border: "1px solid var(--line)", background: "#fff", borderRadius: 999, padding: "0.45rem 0.8rem", fontSize: "0.82rem" }}>
              {department.name}
            </span>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          {[
            ["Total requests", total],
            ["New submissions", submitted],
            ["Under review", underReview],
            ["Awaiting approval", awaitingApproval],
            ["Completed", completed],
          ].map(([label, value]) => (
            <article key={String(label)} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "1.2rem" }}>
              <span style={{ color: "var(--muted)", fontSize: "0.78rem", textTransform: "uppercase" }}>{label}</span>
              <strong style={{ display: "block", color: "var(--navy)", fontSize: "2rem", marginTop: "0.35rem" }}>{value}</strong>
            </article>
          ))}
        </div>

        <Link className="button button--navy" href="/officer/requests" style={{ marginTop: "1.5rem" }}>
          Open request workspace
        </Link>
        <Link className="button button--text" href="/officer/records" style={{ marginTop: "1.5rem", marginLeft: "0.6rem" }}>
          Departmental records
        </Link>
       <AiAssistant
  audience="officer"
  providerConfigured={isAssistantConfigured()}
  requests={assistantRequests}
/>
      </section>
    </main>
  );
}
