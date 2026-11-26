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
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Only a PIO can issue a response." }, requestId }, { status: 403 });
  }
  const target = await prisma.rtiRequest.findUnique({
    where: { id },
    select: {
      id: true,
      departmentId: true,
      status: true,
      responseDraft: { where: { status: "APPROVED" }, orderBy: { approvedAt: "desc" }, take: 1 },
      finalResponse: true,
    },
  });
  if (!target) {
    return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "RTI request not found." }, requestId }, { status: 404 });
  }
  if (!actor.memberships.some((membership) => membership.departmentId === target.departmentId)) {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "This request belongs to another department." }, requestId }, { status: 403 });
  }
  if (target.finalResponse) {
    return NextResponse.json({ ok: false, error: { code: "CONFLICT", message: "A final response has already been issued." }, requestId }, { status: 409 });
  }
  const draft = target.responseDraft[0];
  if (!draft || target.status !== "APPROVED") {
    return NextResponse.json({ ok: false, error: { code: "CONFLICT", message: "The request and draft must be approved before issue." }, requestId }, { status: 409 });
  }

  const finalResponse = await prisma.$transaction(async (tx) => {
    const saved = await tx.rtiFinalResponse.create({
      data: { requestId: id, draftId: draft.id, content: draft.content, issuedBy: session.user.id },
    });
    await tx.rtiRequest.update({ where: { id }, data: { status: "RESPONSE_ISSUED" } });
    await tx.requestStatusHistory.create({
      data: { requestId: id, fromStatus: "APPROVED", toStatus: "RESPONSE_ISSUED", remarks: "Approved response issued to the citizen.", changedBy: session.user.id },
    });
    await tx.auditLog.create({
      data: { actorId: session.user.id, action: "FINAL_RESPONSE_ISSUED", entityType: "RtiFinalResponse", entityId: saved.id, details: JSON.stringify({ requestId: id, draftId: draft.id }) },
    });
    return saved;
  });
  return NextResponse.json({ ok: true, data: finalResponse, requestId });
}
