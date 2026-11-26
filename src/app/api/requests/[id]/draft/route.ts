import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const draftSchema = z.object({
  content: z.string().trim().min(20).max(30000),
  aiGenerated: z.boolean().optional(),
});

async function getAuthorizedActor(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { session: null, actor: null };
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      isActive: true,
      memberships: { where: { isActive: true }, select: { departmentId: true } },
    },
  });
  const request = await prisma.rtiRequest.findUnique({
    where: { id },
    select: { id: true, departmentId: true, status: true },
  });
  return { session, actor, request };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = randomUUID();
  const { id } = await context.params;
  const { session, actor, request: targetRequest } = await getAuthorizedActor(id);
  if (!session?.user?.id || !actor?.isActive) {
    return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Authentication is required." }, requestId }, { status: 401 });
  }
  if (!targetRequest) {
    return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "RTI request not found." }, requestId }, { status: 404 });
  }
  const allowed = actor.role === "PLATFORM_ADMIN" ||
    actor.memberships.some((membership) => membership.departmentId === targetRequest.departmentId);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "This request belongs to another department." }, requestId }, { status: 403 });
  }
  const drafts = await prisma.rtiResponseDraft.findMany({
    where: { requestId: id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ ok: true, data: drafts, requestId });
}

export async function POST(httpRequest: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = randomUUID();
  const { id } = await context.params;
  const { session, actor, request: targetRequest } = await getAuthorizedActor(id);
  if (!session?.user?.id || !actor?.isActive) {
    return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Authentication is required." }, requestId }, { status: 401 });
  }
  if (!targetRequest) {
    return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "RTI request not found." }, requestId }, { status: 404 });
  }
  const allowed = ["PIO", "DEALING_OFFICER", "DEPARTMENT_ADMIN", "PLATFORM_ADMIN"].includes(actor.role) &&
    (actor.role === "PLATFORM_ADMIN" || actor.memberships.some((membership) => membership.departmentId === targetRequest.departmentId));
  if (!allowed) {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Drafting access is not available for this request." }, requestId }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await httpRequest.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body." }, requestId }, { status: 400 });
  }
  const parsed = draftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_FAILED", message: "Invalid response draft.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }, requestId }, { status: 422 });
  }

  const draft = await prisma.$transaction(async (tx) => {
    const saved = await tx.rtiResponseDraft.create({
      data: {
        requestId: id,
        content: parsed.data.content,
        aiGenerated: parsed.data.aiGenerated ?? false,
        status: "DRAFT",
        createdBy: session.user.id,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "RESPONSE_DRAFT_SAVED",
        entityType: "RtiResponseDraft",
        entityId: saved.id,
        details: JSON.stringify({ requestId: id, aiGenerated: saved.aiGenerated }),
      },
    });
    return saved;
  });
  return NextResponse.json({ ok: true, data: draft, requestId }, { status: 201 });
}
