import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DepartmentRecordManager } from "@/components/department-record-manager";

export default async function OfficerRecordsPage() {
  await connection();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      isActive: true,
      memberships: { where: { isActive: true }, select: { department: { select: { id: true, name: true } } } },
    },
  });
  if (!actor?.isActive) redirect("/login");

  const departments = actor.role === "PLATFORM_ADMIN"
    ? await prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
    : actor.memberships.map((membership) => membership.department);
  const departmentIds = departments.map((department) => department.id);
  const records = departmentIds.length
    ? await prisma.departmentRecord.findMany({
        where: { departmentId: { in: departmentIds } },
        orderBy: { updatedAt: "desc" },
        take: 200,
        select: { id: true, title: true, referenceNumber: true, category: true, documentType: true, isDemo: true },
      })
    : [];

  const canManage = ["PIO", "DEPARTMENT_ADMIN", "PLATFORM_ADMIN"].includes(actor.role);
  return (
    <main style={{ minHeight: "100vh", background: "#f5f7f9", padding: "2.5rem 5vw" }}>
      <section style={{ maxWidth: 900, margin: "0 auto" }}>
        <span className="eyebrow">Soochna · Officer portal</span>
        <h1 style={{ color: "var(--navy)", marginBottom: "0.5rem" }}>Departmental records</h1>
        <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>View and manage records in your authorized departments. Fictional demo records are clearly marked.</p>
        <DepartmentRecordManager departments={departments} initialRecords={records} canManage={canManage} />
      </section>
    </main>
  );
}
