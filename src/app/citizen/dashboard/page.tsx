export const instant = false;

import { CitizenDashboard } from "@/components/citizen-dashboard";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { authOptions } from "@/lib/auth";
import { isAssistantConfigured } from "@/lib/ai/assistant";
import { prisma } from "@/lib/prisma";

export default async function CitizenDashboardPage() {
  await connection();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, role: true, isActive: true },
  });
  if (!user?.isActive || user.role !== "CITIZEN") redirect("/officer/dashboard");

  const requests = await prisma.rtiRequest.findMany({
    where: { userId: user.id },
    orderBy: { submittedAt: "desc" },
    take: 50,
    select: {
      id: true,
      referenceNumber: true,
      status: true,
      subject: true,
      departmentId: true,
      submittedAt: true,
    },
  });

  const applications = requests.map((request) => ({
    ...request,
    submittedAt: request.submittedAt.toISOString(),
    deadline: null,
  }));

  return (
    <CitizenDashboard
      applications={applications}
      citizenName={user.name ?? "Citizen"}
      providerConfigured={isAssistantConfigured()}
    />
  );
}
