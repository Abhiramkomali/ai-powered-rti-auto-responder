
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createMembershipSchema = z.object({
  email: z.string().email(),
  departmentId: z.string().min(1),
});

const updateMembershipSchema = z.object({
  email: z.string().email(),
  departmentId: z.string().min(1),
  isActive: z.boolean(),
});

async function getPlatformAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 } as const;
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isActive: true },
  });

  if (!admin?.isActive || admin.role !== "PLATFORM_ADMIN") {
    return { error: "Forbidden", status: 403 } as const;
  }

  return { admin: true } as const;
}

export async function GET() {
  const authorization = await getPlatformAdmin();

  if ("error" in authorization) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  const memberships = await prisma.departmentMembership.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  return Response.json({ memberships });
}

export async function POST(request: Request) {
  const authorization = await getPlatformAdmin();

  if ("error" in authorization) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = createMembershipSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid membership details.", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { departmentId } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    return Response.json(
      { error: "No user found with this email address." },
      { status: 404 },
    );
  }

  if (!user.isActive) {
    return Response.json(
      { error: "This user account is inactive." },
      { status: 409 },
    );
  }

  if (user.role === "CITIZEN") {
    return Response.json(
      { error: "Citizen accounts cannot be assigned as department officers." },
      { status: 409 },
    );
  }

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });

  if (!department) {
    return Response.json(
      { error: "Department not found." },
      { status: 404 },
    );
  }

  const membership = await prisma.departmentMembership.upsert({
    where: {
      userId_departmentId: {
        userId: user.id,
        departmentId,
      },
    },
    update: { isActive: true },
    create: {
      userId: user.id,
      departmentId,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
      department: {
        select: { id: true, name: true },
      },
    },
  });

  return Response.json(
    { message: "Department membership assigned successfully.", membership },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const authorization = await getPlatformAdmin();

  if ("error" in authorization) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = updateMembershipSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid membership details.", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { departmentId, isActive } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return Response.json(
      { error: "User not found." },
      { status: 404 },
    );
  }

  const existingMembership = await prisma.departmentMembership.findUnique({
    where: {
      userId_departmentId: {
        userId: user.id,
        departmentId,
      },
    },
  });

  if (!existingMembership) {
    return Response.json(
      { error: "Department membership not found." },
      { status: 404 },
    );
  }

  const membership = await prisma.departmentMembership.update({
    where: {
      userId_departmentId: {
        userId: user.id,
        departmentId,
      },
    },
    data: { isActive },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
      department: {
        select: { id: true, name: true },
      },
    },
  });

  return Response.json({
    message: isActive
      ? "Department membership activated."
      : "Department membership deactivated.",
    membership,
  });
}
