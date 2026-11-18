
import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createRequestSchema } from "@/lib/validations/request";
import type { ApiResponse } from "@/lib/contracts/api";

export async function POST(request: Request) {
  const requestId = randomUUID();

  // 1. Check that the client sent JSON.
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

  // 2. Read the submitted JSON.
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

  // 3. Validate the submitted information using Zod.
  const result = createRequestSchema.safeParse(body);

  if (!result.success) {
    const fieldErrors = result.error.issues.reduce<Record<string, string[]>>(
      (errors, issue) => {
        const field = String(issue.path[0] ?? "general");
        errors[field] ??= [];
        errors[field].push(issue.message);
        return errors;
      },
      {},
    );

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

  // 4. Generate a unique-looking RTI reference number.
  const referenceNumber = `RTI-${new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`;

  try {
    // 5. Save the validated request in PostgreSQL.
    const savedRequest = await prisma.rtiRequest.create({
      data: {
        referenceNumber,
        fullName: result.data.fullName,
        email: result.data.email,
        mobile: result.data.mobile,
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

    // 6. Return the saved request details.
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
