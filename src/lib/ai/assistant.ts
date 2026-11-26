
import { z } from "zod";

const generatedTextSchema = z.string().trim().min(1).max(5000);

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantContext = {
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
};

export class AssistantProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AssistantProviderError";
  }
}

export function isAssistantConfigured() {
  return Boolean(
    process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY,
  );
}

function demoReply(message: string) {
  const question = message.toLowerCase();

  if (/\b(track|tracking|reference number)\b/.test(question)) {
    return "To track a request, open Citizen portal → Track Application and enter your reference number and registered email. This demonstration assistant cannot look up application records.";
  }

  if (/\b(status|under review|submitted|awaiting approval)\b/.test(question)) {
    return "A status describes the request's current workflow stage. For example, Submitted means it has been received; Under Review means an officer is examining it; Awaiting Approval means a response is awaiting human review. Check your portal for the authoritative status.";
  }

  if (/\b(submit|application|apply)\b/.test(question)) {
    return "Sign in to your citizen account, choose Submit RTI Request, select the department, describe the records or information you seek, review your details, and submit. Keep the generated reference number for tracking.";
  }

  if (/\b(rti|right to information|process|how does)\b/.test(question)) {
    return "RTI is a process for requesting information held by a public authority. Soochna is an independent project prototype, not an official government portal. Confirm applicable procedures with the relevant public authority.";
  }

  return "This is the demonstration assistant. It can answer basic questions about submitting, tracking, and common request statuses.";
}

function buildSystemInstruction(input: {
  audience: "citizen" | "officer";
  context?: AssistantContext;
}) {
  return [
    "You are Soochna AI Assistant for an independent RTI process project prototype.",
    "Be concise, practical, and honest about uncertainty.",
    "Do not claim this is an official government portal or give legally authoritative advice.",
    "Never invent official records, legal provisions, application statuses, or facts.",
    "Do not decide, reject, approve, or issue an RTI response. Officers and PIOs remain responsible.",
    "When departmental records are supplied, cite them by reference number and distinguish verified record metadata from missing or unverified information.",
    "For classification, identify primary category, secondary category, suggested responsible department, distinct requested information points, required records, ambiguities, and confidence.",
    "For response drafting, use point-wise formatting, cite available record references, mark unavailable facts as pending verification, and include a PIO review checklist.",
    input.audience === "citizen"
      ? "Help citizens understand the platform and general RTI process. Never imply access to records unless provided in the authorized context."
      : "Assist officers with analysis and drafting only. Highlight missing evidence and require human verification. Never fabricate records or citations.",
    input.context
      ? `Authorized request context (applicant identity/contact fields intentionally omitted):\n${JSON.stringify(input.context)}`
      : "No application context is available. Do not claim to know the status or details of any application.",
  ].join("\n");
}

function buildTranscript(messages: AssistantMessage[]) {
  return messages
    .map(
      ({ role, content }) =>
        `${role === "user" ? "User" : "Assistant"}: ${content}`,
    )
    .join("\n");
}

function validateReply(value: unknown) {
  const result = generatedTextSchema.safeParse(value);

  if (!result.success) {
    throw new AssistantProviderError(
      "The AI provider returned an empty or invalid answer.",
      502,
    );
  }

  return result.data;
}

async function callGemini(
  apiKey: string,
  model: string,
  systemInstruction: string,
  transcript: string,
) {
  let response: Response | undefined;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [
              {
                role: "user",
                parts: [{ text: transcript }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 700,
              temperature: 0.3,
            },
          }),
          signal: AbortSignal.timeout(20_000),
        },
      );

      if (
        (response.status === 429 || response.status === 503) &&
        attempt < 2
      ) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const delay =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.min(retryAfter * 1000, 5000)
            : attempt === 0
              ? 1000
              : 2500;

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      break;
    } catch {
      if (attempt === 2) {
        throw new AssistantProviderError(
          "Gemini could not be reached after multiple attempts.",
          503,
        );
      }

      await new Promise((resolve) =>
        setTimeout(resolve, attempt === 0 ? 1000 : 2500),
      );
    }
  }

  if (!response) {
    throw new AssistantProviderError(
      "Gemini did not return a response.",
      503,
    );
  }

  if (!response.ok) {
    const details = await response.text();

    console.error("Gemini API error:", {
      status: response.status,
      details,
    });

    throw new AssistantProviderError(
      `Gemini request failed with status ${response.status}.`,
      response.status,
    );
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new AssistantProviderError(
      "Gemini returned an unreadable response.",
      502,
    );
  }

  const result = z
    .object({
      candidates: z
        .array(
          z.object({
            content: z.object({
              parts: z.array(z.object({ text: z.string() })),
            }),
          }),
        )
        .min(1),
    })
    .safeParse(payload);

  if (!result.success) {
    throw new AssistantProviderError(
      "Gemini returned an unexpected response format.",
      502,
    );
  }

  return validateReply(
    result.data.candidates[0].content.parts
      .map((part) => part.text)
      .join("\n")
      .trim(),
  );
}

async function callGroq(
  apiKey: string,
  model: string,
  systemInstruction: string,
  transcript: string,
) {
  let response: Response;

  try {
    response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: transcript },
          ],
          max_tokens: 700,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(30_000),
      },
    );
  } catch {
    throw new AssistantProviderError(
      "The backup AI provider could not be reached.",
      503,
    );
  }

  if (!response.ok) {
    const details = await response.text();

    console.error("Groq API error:", {
      status: response.status,
      details,
    });

    throw new AssistantProviderError(
      `The backup AI provider failed with status ${response.status}.`,
      response.status,
    );
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new AssistantProviderError(
      "The backup AI provider returned an unreadable response.",
      502,
    );
  }

  const result = z
    .object({
      choices: z
        .array(
          z.object({
            message: z.object({
              content: z.string(),
            }),
          }),
        )
        .min(1),
    })
    .safeParse(payload);

  if (!result.success) {
    throw new AssistantProviderError(
      "The backup AI provider returned an unexpected response format.",
      502,
    );
  }

  return validateReply(result.data.choices[0].message.content);
}

export async function generateAssistantReply(input: {
  messages: AssistantMessage[];
  context?: AssistantContext;
  audience: "citizen" | "officer";
}) {
  const latestMessage =
    input.messages[input.messages.length - 1]?.content ?? "";

  const apiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!apiKey && !groqKey) {
    return {
      reply: validateReply(demoReply(latestMessage)),
      mode: "demo" as const,
    };
  }

  const systemInstruction = buildSystemInstruction(input);
  const transcript = buildTranscript(input.messages);

  // Try Gemini first.
  if (apiKey) {
    try {
      const reply = await callGemini(
        apiKey,
        process.env.GEMINI_MODEL ?? "gemini-3.8-flash",
        systemInstruction,
        transcript,
      );

      console.info("Soochna AI response generated by Gemini.");

      return { reply, mode: "provider" as const };
    } catch (error) {
      console.warn(
        "Gemini failed. Switching to the Groq backup provider.",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  // Automatically use Groq if Gemini is unavailable.
  if (groqKey) {
    try {
      const reply = await callGroq(
        groqKey,
        process.env.GROQ_MODEL ?? "openai/gpt-oss-20b",
        systemInstruction,
        transcript,
      );

      console.info("Soochna AI response generated by Groq.");

      return { reply, mode: "provider" as const };
    } catch (error) {
      console.error(
        "Both the primary and backup AI providers are unavailable.",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  // Keep common questions usable if both providers fail.
  return {
    reply: validateReply(demoReply(latestMessage)),
    mode: "demo" as const,
  };
}
