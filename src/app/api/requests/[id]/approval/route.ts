import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = randomUUID();
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Authentication is required." }, requestId }, { status: 401 });
  }
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      isActive: true,
      memberships: { where: { isActive: true }, select: { departmentId: true } },
    },
  });
  if (!actor?.isActive || actor.role !== "PIO") {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Only a PIO can approve a response." }, requestId }, { status: 403 });
  }

  const target = await prisma.rtiRequest.findUnique({
    where: { id },
    select: { id: true, departmentId: true, status: true, responseDraft: { orderBy: { updatedAt: "desc" }, take: 1 } },
  });
  if (!target) {
    return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "RTI request not found." }, requestId }, { status: 404 });
  }
  if (!actor.memberships.some((membership) => membership.departmentId === target.departmentId)) {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "This request belongs to another department." }, requestId }, { status: 403 });
  }
  const draft = target.responseDraft[0];
  if (!draft) {
    return NextResponse.json({ ok: false, error: { code: "CONFLICT", message: "A response draft is required before approval." }, requestId }, { status: 409 });
  }
  if (draft.status === "APPROVED") {
    return NextResponse.json({ ok: false, error: { code: "CONFLICT", message: "This response draft is already approved." }, requestId }, { status: 409 });
  }

  const approved = await prisma.$transaction(async (tx) => {
    const savedDraft = await tx.rtiResponseDraft.update({
      where: { id: draft.id },
      data: { status: "APPROVED", approvedBy: session.user.id, approvedAt: new Date() },
    });
    await tx.rtiRequest.update({ where: { id }, data: { status: "APPROVED" } });
    await tx.requestStatusHistory.create({
      data: { requestId: id, fromStatus: target.status, toStatus: "APPROVED", remarks: "Response approved by an authorized PIO.", changedBy: session.user.id },
    });
    await tx.auditLog.create({
      data: { actorId: session.user.id, action: "RESPONSE_APPROVED", entityType: "RtiResponseDraft", entityId: draft.id, details: JSON.stringify({ requestId: id }) },
    });
    return savedDraft;
  });
  return NextResponse.json({ ok: true, data: approved, requestId });
}
