export const instant = false;

import { CitizenRequestForm } from "@/components/citizen-request-form";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CitizenSubmitPage() {
  await connection();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isActive: true },
  });
  if (!user?.isActive || user.role !== "CITIZEN") redirect("/officer/dashboard");

  return <CitizenRequestForm />;
}
