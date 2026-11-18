import { z } from "zod";

const departments = [
  "public-works",
  "education",
  "health",
  "revenue",
  "municipal-administration",
  "transport",
] as const;

export const createRequestSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(150),
    mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
    address: z.string().trim().min(5).max(300),
    state: z.string().trim().min(2).max(100),
    district: z.string().trim().min(2).max(100),
    pinCode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),

    departmentId: z.enum(departments),

    subject: z.string().trim().min(5).max(200),
    description: z.string().trim().min(20).max(5000),

    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),

    responseFormat: z.enum(["electronic", "physical"]),
  })
  .superRefine((data, ctx) => {
    const dateFrom = data.dateFrom || "";
    const dateTo = data.dateTo || "";

    if (dateFrom && !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
      ctx.addIssue({
        code: "custom",
        path: ["dateFrom"],
        message: "Enter a valid start date",
      });
    }

    if (dateTo && !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
      ctx.addIssue({
        code: "custom",
        path: ["dateTo"],
        message: "Enter a valid end date",
      });
    }

    if (dateFrom && dateTo && dateFrom > dateTo) {
      ctx.addIssue({
        code: "custom",
        path: ["dateTo"],
        message: "End date cannot be earlier than start date",
      });
    }
  });

export type CreateRequestData = z.infer<typeof createRequestSchema>;