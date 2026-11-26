import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[a-z]/, "Password must include a lowercase letter.")
    .regex(/[A-Z]/, "Password must include an uppercase letter.")
    .regex(/\d/, "Password must include a number."),
});

export async function POST(request: Request) {
  const requestId = randomUUID();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Invalid JSON request body." }, requestId },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Please correct the registration information.",
          fieldErrors: parsed.error.issues.reduce<Record<string, string[]>>((errors, issue) => {
            const field = String(issue.path[0] ?? "general");
            errors[field] ??=[];
            errors[field].push(issue.message);
            return errors;
          }, {}),
        },
        requestId,
      },
      { status: 422 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: { code: "CONFLICT", message: "An account already exists with this email address." }, requestId },
        { status: 409 },
      );
    }

    const passwordHash = await hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        role: "CITIZEN",
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(
      { ok: true, data: user, requestId },
      { status: 201 },
    );
  } catch (error) {
    console.error("Citizen registration failed:", error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Unable to create your account right now." }, requestId },
      { status: 500 },
    );
  }
}
