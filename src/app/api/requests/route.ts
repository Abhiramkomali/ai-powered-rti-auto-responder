
import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createRequestSchema } from "@/lib/request";
import type { ApiResponse } from "@/lib/contracts/api";

export async function POST(request: Request) {
  const requestId = randomUUID();
  const session = await getServerSession(authOptions);

  // Check the request content type.
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json<ApiResponse<never>>(
      {
        ok: false,
        error: {
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: "Content-Type must be application/json.",
        },
        requestId,
      },
      { status: 415 },
    );
  }

  // Read the submitted JSON.
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "Invalid JSON request body.",
        },
        requestId,
      },
      { status: 400 },
    );
  }

  // Validate the data using Zod.
  const result = createRequestSchema.safeParse(body);

  if (!result.success) {
    const fieldErrors = result.error.issues.reduce<
      Record<string, string[]>
    >((errors, issue) => {
      const field = String(issue.path[0] ?? "general");
      errors[field] ??= [];
      errors[field].push(issue.message);
      return errors;
    }, {});

    return NextResponse.json<ApiResponse<never>>(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Please correct the submitted information.",
          fieldErrors,
        },
        requestId,
      },
      { status: 422 },
    );
  }

  // Generate the RTI reference number.
  const referenceNumber = `RTI-${new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`;

  try {
    const normalizedMobile = result.data.mobile.replace(/^(?:\+91|91)[\s-]?/, "");
    const department = await prisma.department.findUnique({
      where: { id: result.data.departmentId },
      select: { id: true },
    });
    if (!department) {
      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: { code: "NOT_FOUND", message: "The selected department is not available." },
          requestId,
        },
        { status: 404 },
      );
    }

    let userId: string | null = null;
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true, isActive: true, email: true },
      });
      if (!user?.isActive || user.role !== "CITIZEN") {
        return NextResponse.json<ApiResponse<never>>(
          {
            ok: false,
            error: { code: "FORBIDDEN", message: "Only citizen accounts can submit RTI requests." },
            requestId,
          },
          { status: 403 },
        );
      }
      userId = user.id;
    }

    // Save the request in PostgreSQL.
   // Save the request and its initial status history together.
const savedRequest = await prisma.$transaction(async (tx) => {
  const newRequest = await tx.rtiRequest.create({
    data: {
      referenceNumber,
  userId,
      fullName: result.data.fullName,
      email: result.data.email,
  mobile: normalizedMobile,
      address: result.data.address,
      state: result.data.state,
      district: result.data.district,
      pinCode: result.data.pinCode,
      departmentId: result.data.departmentId,
      subject: result.data.subject,
      description: result.data.description,
      dateFrom: result.data.dateFrom
        ? new Date(`${result.data.dateFrom}T00:00:00.000Z`)
        : null,
      dateTo: result.data.dateTo
        ? new Date(`${result.data.dateTo}T00:00:00.000Z`)
        : null,
      responseFormat: result.data.responseFormat,
    },
  });

  await tx.requestStatusHistory.create({
    data: {
      requestId: newRequest.id,
      fromStatus: null,
      toStatus: "SUBMITTED",
      remarks: "RTI request submitted by citizen.",
    },
  });

  return newRequest;
});

    // Return the saved request information.
    const response: ApiResponse<{
      id: string;
      referenceNumber: string;
      status: string;
      submittedAt: string;
    }> = {
      ok: true,
      data: {
        id: savedRequest.id,
        referenceNumber: savedRequest.referenceNumber,
        status: savedRequest.status,
        submittedAt: savedRequest.submittedAt.toISOString(),
      },
      requestId,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Failed to create RTI request:", error);

    return NextResponse.json<ApiResponse<never>>(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to submit your request right now.",
        },
        requestId,
      },
      { status: 500 },
    );
  }
}
