import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { AssistantProviderError, generateAssistantReply } from "@/lib/ai/assistant";
import { prisma } from "@/lib/prisma";

const officerRoles = new Set([
  "APIO",
  "DEALING_OFFICER",
  "PIO",
  "FIRST_APPELLATE_AUTHORITY",
  "DEPARTMENT_ADMIN",
  "PLATFORM_ADMIN",
]);

const inputSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().trim().min(1).max(4000),
    }),
  ).min(1).max(12),
  requestId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      isActive: true,
      memberships: {
        where: { isActive: true },
        select: { departmentId: true },
      },
    },
  });
  if (!user?.isActive || (user.role !== "CITIZEN" && !officerRoles.has(user.role))) {
    return NextResponse.json({ error: "Assistant access is not available for this account." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid chat message.", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  let context:
    | {
        subject: string;
        description: string;
        department: string;
        status: string;
        records?: {
          referenceNumber: string;
          title: string;
          description: string;
          category: string;
          documentType: string;
          relevantDateFrom: string | null;
          relevantDateTo: string | null;
          isDemo: boolean;
        }[];
      }
    | undefined;

  if (parsed.data.requestId) {
    let authorizedRequest:
      | { subject: string; description: string; departmentId: string; status: string }
      | null;

    if (user.role === "CITIZEN") {
      authorizedRequest = await prisma.rtiRequest.findFirst({
        where: { id: parsed.data.requestId, userId: session.user.id },
        select: { subject: true, description: true, status: true, departmentId: true },
      });
      if (!authorizedRequest) {
        return NextResponse.json({ error: "The selected application was not found in your account." }, { status: 404 });
      }
    } else {
      const allowedDepartmentIds = user.memberships.map((membership) => membership.departmentId);
      authorizedRequest = await prisma.rtiRequest.findFirst({
        where: {
          id: parsed.data.requestId,
          ...(user.role === "PLATFORM_ADMIN" ? {} : { departmentId: { in: allowedDepartmentIds } }),
        },
        select: { subject: true, description: true, status: true, departmentId: true },
      });
      if (!authorizedRequest) {
        return NextResponse.json({ error: "The selected application was not found in your authorized departments." }, { status: 404 });
      }
    }

    const department = await prisma.department.findUnique({
      where: { id: authorizedRequest.departmentId },
      select: { name: true },
    });
    const redactContactDetails = (value: string) =>
      value
        .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted email]")
        .replace(/\b(?:\+?91[\s-]?)?[6-9]\d{9}\b/g, "[redacted phone]");
    const departmentRecords = await prisma.departmentRecord.findMany({
      where: { departmentId: authorizedRequest.departmentId },
      orderBy: { updatedAt: "desc" },
      take: 25,
      select: {
        referenceNumber: true,
        title: true,
        description: true,
        category: true,
        documentType: true,
        relevantDateFrom: true,
        relevantDateTo: true,
        isDemo: true,
      },
    });

    const requestTerms = `${authorizedRequest.subject} ${authorizedRequest.description}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((term) => term.length >= 4);
    const matchedRecords = departmentRecords
      .filter((record) => {
        if (requestTerms.length === 0) return true;
        const searchable = `${record.title} ${record.description} ${record.category} ${record.documentType}`.toLowerCase();
        return requestTerms.some((term) => searchable.includes(term));
      })
      .slice(0, 12);

    context = {
      subject: redactContactDetails(authorizedRequest.subject),
      description: redactContactDetails(authorizedRequest.description),
      department: department?.name ?? authorizedRequest.departmentId,
      status: authorizedRequest.status,
      records: matchedRecords.map((record) => ({
        ...record,
        relevantDateFrom: record.relevantDateFrom?.toISOString() ?? null,
        relevantDateTo: record.relevantDateTo?.toISOString() ?? null,
      })),
    };
  }

  try {
    const result = await generateAssistantReply({
      messages: parsed.data.messages,
      context,
      audience: user.role === "CITIZEN" ? "citizen" : "officer",
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AssistantProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Soochna assistant request failed.");
    return NextResponse.json({ error: "The assistant could not answer right now. Please retry." }, { status: 500 });
  }
}
