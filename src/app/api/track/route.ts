
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/lib/contracts/api";

const trackRequestSchema = z.object({
  referenceNumber: z
    .string()
    .trim()
    .regex(
      /^RTI-\d{8}-[A-F0-9]{6}$/i,
      "Enter a valid RTI reference number.",
    ),
  email: z.string().trim().email("Enter a valid email address."),
});

export async function POST(request: Request) {
  const requestId = randomUUID();

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

  const result = trackRequestSchema.safeParse(body);

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
          message: "Please check the tracking information.",
          fieldErrors,
        },
        requestId,
      },
      { status: 422 },
    );
  }

  try {
    const savedRequest = await prisma.rtiRequest.findFirst({
      where: {
        referenceNumber: result.data.referenceNumber.toUpperCase(),
        email: {
          equals: result.data.email,
          mode: "insensitive",
        },
      },
      select: {
        referenceNumber: true,
        departmentId: true,
        status: true,
        submittedAt: true,
        finalResponse: {
          select: { content: true, issuedAt: true },
        },
      },
    });

    if (!savedRequest) {
      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: {
            code: "NOT_FOUND",
            message:
              "No request was found with the provided reference number and email address.",
          },
          requestId,
        },
        { status: 404 },
      );
    }

    const response: ApiResponse<{
      referenceNumber: string;
      departmentId: string;
      status: string;
      submittedAt: string;
      finalResponse: { content: string; issuedAt: string } | null;
    }> = {
      ok: true,
      data: {
        referenceNumber: savedRequest.referenceNumber,
        departmentId: savedRequest.departmentId,
        status: savedRequest.status,
        submittedAt: savedRequest.submittedAt.toISOString(),
        finalResponse: savedRequest.finalResponse
          ? {
              content: savedRequest.finalResponse.content,
              issuedAt: savedRequest.finalResponse.issuedAt.toISOString(),
            }
          : null,
      },
      requestId,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to track RTI request:", error);

    return NextResponse.json<ApiResponse<never>>(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to retrieve your request right now.",
        },
        requestId,
      },
      { status: 500 },
    );
  }
}
