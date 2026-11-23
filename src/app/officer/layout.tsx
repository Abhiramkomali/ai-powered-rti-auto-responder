export const instant = false;
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const officerRoles = new Set([
  "APIO",
  "DEALING_OFFICER",
  "PIO",
  "FIRST_APPELLATE_AUTHORITY",
  "DEPARTMENT_ADMIN",
  "PLATFORM_ADMIN",
]);

export default async function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    redirect("/login");
  }

  if (!officerRoles.has(user.role)) {
    redirect("/citizen/dashboard");
  }

  return <>{children}</>;
}
