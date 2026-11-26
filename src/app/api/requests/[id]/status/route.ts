import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isValidRequestStatusTransition,
  requestStatuses,
  type RequestStatus,
} from "@/lib/domain/requests";

const officerRoles = new Set([
  "APIO",
  "DEALING_OFFICER",
  "PIO",
  "FIRST_APPELLATE_AUTHORITY",
  "DEPARTMENT_ADMIN",
  "PLATFORM_ADMIN",
]);

const statusSchema = z.object({
  status: z.enum(requestStatuses),
  remarks: z.string().trim().max(2000).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID();
  const { id } = await context.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHENTICATED", message: "Authentication is required." }, requestId },
      { status: 401 },
    );
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      isActive: true,
      memberships: { where: { isActive: true }, select: { departmentId: true } },
    },
  });

  if (!actor?.isActive || !officerRoles.has(actor.role)) {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Officer access is required." }, requestId },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body." }, requestId },
      { status: 400 },
    );
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Invalid status information.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }, requestId },
      { status: 422 },
    );
  }

  const existing = await prisma.rtiRequest.findUnique({
    where: { id },
    select: { id: true, departmentId: true, status: true },
  });

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "RTI request not found." }, requestId },
      { status: 404 },
    );
  }

  const membershipDepartmentIds = new Set(actor.memberships.map((membership) => membership.departmentId));
  if (actor.role !== "PLATFORM_ADMIN" && !membershipDepartmentIds.has(existing.departmentId)) {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "This request belongs to another department." }, requestId },
      { status: 403 },
    );
  }

  const toStatus = parsed.data.status as RequestStatus;
  if (!isValidRequestStatusTransition(existing.status, toStatus)) {
    return NextResponse.json(
      { ok: false, error: { code: "CONFLICT", message: `Status cannot change from ${existing.status} to ${toStatus}.` }, requestId },
      { status: 409 },
    );
  }

  if (toStatus === "APPROVED" && actor.role !== "PIO") {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Only an authorized PIO can approve a response." }, requestId },
      { status: 403 },
    );
  }
  if (toStatus === "RESPONSE_ISSUED" && actor.role !== "PIO") {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Only an authorized PIO can issue a response." }, requestId },
      { status: 403 },
    );
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.rtiRequest.update({
        where: { id },
        data: { status: toStatus },
        select: { id: true, status: true, submittedAt: true },
      });
      await tx.requestStatusHistory.create({
        data: {
          requestId: id,
          fromStatus: existing.status,
          toStatus,
          remarks: parsed.data.remarks,
          changedBy: session.user.id,
        },
      });
      return saved;
    });

    return NextResponse.json(
      { ok: true, data: updated, requestId },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to update RTI status:", error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Unable to update the request status." }, requestId },
      { status: 500 },
    );
  }
}
