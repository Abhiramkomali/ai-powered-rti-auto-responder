import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const recordSchema = z.object({
  departmentId: z.string().trim().min(1).max(100),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(5000),
  category: z.string().trim().min(2).max(100),
  referenceNumber: z.string().trim().min(3).max(100),
  documentType: z.string().trim().min(2).max(100),
  relevantDateFrom: z.string().date().optional(),
  relevantDateTo: z.string().date().optional(),
  storageReference: z.string().trim().max(500).optional(),
  isDemo: z.boolean().optional(),
});

export async function GET() {
  const requestId = randomUUID();
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
  if (!actor?.isActive) {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Account access is unavailable." }, requestId }, { status: 403 });
  }

  const allowedIds = actor.memberships.map((membership) => membership.departmentId);
  if (!["APIO", "DEALING_OFFICER", "PIO", "DEPARTMENT_ADMIN", "PLATFORM_ADMIN"].includes(actor.role)) {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Officer access is required." }, requestId }, { status: 403 });
  }

  const records = await prisma.departmentRecord.findMany({
    where: actor.role === "PLATFORM_ADMIN" ? {} : { departmentId: { in: allowedIds } },
    orderBy: [{ departmentId: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });

  return NextResponse.json({ ok: true, data: records, requestId });
}

export async function POST(request: Request) {
  const requestId = randomUUID();
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
  if (!actor?.isActive || !["PIO", "DEPARTMENT_ADMIN", "PLATFORM_ADMIN"].includes(actor.role)) {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Record management access is required." }, requestId }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body." }, requestId }, { status: 400 });
  }
  const parsed = recordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_FAILED", message: "Invalid record information.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }, requestId }, { status: 422 });
  }

  const allowedIds = actor.memberships.map((membership) => membership.departmentId);
  if (actor.role !== "PLATFORM_ADMIN" && !allowedIds.includes(parsed.data.departmentId)) {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "This record belongs to another department." }, requestId }, { status: 403 });
  }

  if (parsed.data.relevantDateFrom && parsed.data.relevantDateTo && parsed.data.relevantDateFrom > parsed.data.relevantDateTo) {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_FAILED", message: "The record end date cannot precede its start date." }, requestId }, { status: 422 });
  }

  try {
    const record = await prisma.departmentRecord.create({
      data: {
        departmentId: parsed.data.departmentId,
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        referenceNumber: parsed.data.referenceNumber,
        documentType: parsed.data.documentType,
        relevantDateFrom: parsed.data.relevantDateFrom ? new Date(`${parsed.data.relevantDateFrom}T00:00:00.000Z`) : null,
        relevantDateTo: parsed.data.relevantDateTo ? new Date(`${parsed.data.relevantDateTo}T00:00:00.000Z`) : null,
        storageReference: parsed.data.storageReference,
        isDemo: parsed.data.isDemo ?? true,
        createdBy: session.user.id,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "DEPARTMENT_RECORD_CREATED",
        entityType: "DepartmentRecord",
        entityId: record.id,
        details: JSON.stringify({ departmentId: record.departmentId, referenceNumber: record.referenceNumber }),
      },
    });
    return NextResponse.json({ ok: true, data: record, requestId }, { status: 201 });
  } catch (error) {
    console.error("Department record create failed.");
    return NextResponse.json({ ok: false, error: { code: "INTERNAL_ERROR", message: "Unable to save the departmental record." }, requestId }, { status: 500 });
  }
}
