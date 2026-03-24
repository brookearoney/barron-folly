import Anthropic from "@anthropic-ai/sdk";
import type { BusinessDossier, StyleGuide, AiClarificationData, AiTaskPlan } from "@/lib/console/types";
import {
  DOSSIER_SYSTEM_PROMPT,
  STYLE_GUIDE_SYSTEM_PROMPT,
  SUGGESTIONS_SYSTEM_PROMPT,
  buildDossierUserMessage,
  buildStyleGuideUserMessage,
  buildClarificationSystemPrompt,
  buildClarificationUserMessage,
  buildTaskConstructionUserMessage,
  buildSuggestionsUserMessage,
} from "./prompts";

const MODEL = "claude-sonnet-4-20250514";

/**
 * Max characters of scraped content to send to Claude.
 * At ~4 chars/token, 15k chars ≈ 3,750 tokens — safe margin under 30k TPM limit.
 */
const MAX_SCRAPED_CHARS = 15_000;

export function truncateForClaude(text: string, limit = MAX_SCRAPED_CHARS): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit) + "\n\n[Content truncated for analysis — showing first ~15,000 characters]";
}

function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/**
 * Retry wrapper for Claude API calls with exponential backoff on 429 rate limits.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isRateLimit =
        err instanceof Error &&
        (err.message.includes("rate_limit") ||
          err.message.includes("429") ||
          (err as { status?: number }).status === 429);

      if (!isRateLimit || attempt === maxRetries) throw err;

      const backoffMs = Math.min(2000 * Math.pow(2, attempt), 60_000);
      console.warn(`Claude rate limit hit, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
  throw new Error("Unreachable");
}

/**
 * Extract JSON from AI response that may be wrapped in markdown code blocks.
 * Handles: ```json\n{...}\n```, ```\n{...}\n```, or raw JSON.
 */
function extractJSON(text: string): string {
  const trimmed = text.trim();

  // Strip markdown code fences if present
  const fenceMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Try to find a JSON object/array in the response
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    return trimmed.slice(jsonStart, jsonEnd + 1);
  }

  return trimmed;
}

// ─── Flow 1a: Generate Business Dossier (non-streaming) ─────────────────

export async function generateBusinessDossier(
  scrapedText: string,
  url: string
): Promise<BusinessDossier> {
  const client = getClient();
  const trimmed = truncateForClaude(scrapedText);

  const response = await withRetry(() =>
    client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: DOSSIER_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: buildDossierUserMessage(url, trimmed) },
      ],
    })
  );

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(extractJSON(text)) as BusinessDossier;
}

// ─── Flow 1b: Generate Style Guide (non-streaming) ─────────────────────

export async function generateStyleGuide(
  scrapedText: string,
  url: string,
  dossierJson: string
): Promise<StyleGuide> {
  const client = getClient();
  const trimmed = truncateForClaude(scrapedText);

  const response = await withRetry(() =>
    client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: STYLE_GUIDE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildStyleGuideUserMessage(url, trimmed, dossierJson),
        },
      ],
    })
  );

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(extractJSON(text)) as StyleGuide;
}

// ─── Flow 2: Generate Clarifying Questions (streaming) ──────────────────

export async function generateClarifyingQuestions(
  requestDescription: string,
  clientName: string,
  orgDossier: string,
  memoryLog: string,
  similarTasks: string,
  designDirective: string
): Promise<{ stream: ReadableStream<Uint8Array>; getResult: () => Promise<AiClarificationData> }> {
  const client = getClient();

  const systemPrompt = buildClarificationSystemPrompt(
    orgDossier,
    memoryLog,
    similarTasks,
    designDirective
  );

  const userMessage = buildClarificationUserMessage(
    clientName,
    requestDescription
  );

  let accumulated = "";
  let resolveResult: (value: AiClarificationData) => void;
  const resultPromise = new Promise<AiClarificationData>((resolve) => {
    resolveResult = resolve;
  });

  const anthropicStream = client.messages.stream({
    model: MODEL,
    max_tokens: 2048,
    system: [
      {
        type: "text" as const,
        text: systemPrompt,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const readableStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            accumulated += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        console.error("Clarification stream error:", err);
        const errMsg = `\n\n{"error": "${err instanceof Error ? err.message.replace(/"/g, '\\"') : "Stream failed"}"}`;
        controller.enqueue(encoder.encode(errMsg));
      }
      controller.close();
      try {
        resolveResult(JSON.parse(extractJSON(accumulated)) as AiClarificationData);
      } catch {
        resolveResult({
          request_summary: "",
          complexity: "moderate",
          estimated_tasks: 0,
          questions: [],
          answered_at: null,
        });
      }
    },
  });

  return { stream: readableStream, getResult: () => resultPromise };
}

// ─── Flow 3: Construct Task Plan (streaming) ────────────────────────────

export async function constructTaskPlan(
  originalRequest: string,
  qaThread: string,
  orgDossier: string,
  memoryLog: string,
  similarTasks: string,
  designDirective: string
): Promise<{ stream: ReadableStream<Uint8Array>; getResult: () => Promise<AiTaskPlan> }> {
  const client = getClient();

  const systemPrompt = buildClarificationSystemPrompt(
    orgDossier,
    memoryLog,
    similarTasks,
    designDirective
  );

  const userMessage = buildTaskConstructionUserMessage(originalRequest, qaThread);

  let accumulated = "";
  let resolveResult: (value: AiTaskPlan) => void;
  const resultPromise = new Promise<AiTaskPlan>((resolve) => {
    resolveResult = resolve;
  });

  const anthropicStream = client.messages.stream({
    model: MODEL,
    max_tokens: 4096,
    system: [
      {
        type: "text" as const,
        text: systemPrompt,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const readableStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            accumulated += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        console.error("Task construction stream error:", err);
        const errMsg = `\n\n{"error": "${err instanceof Error ? err.message.replace(/"/g, '\\"') : "Stream failed"}"}`;
        controller.enqueue(encoder.encode(errMsg));
      }
      controller.close();
      try {
        resolveResult(JSON.parse(extractJSON(accumulated)) as AiTaskPlan);
      } catch (err) {
        console.error("Failed to parse task plan JSON:", err, "Raw response:", accumulated.slice(0, 500));
        resolveResult({ request_title: "", request_category: "other", request_priority: "medium", session_summary: "", session_tags: [], tasks: [] });
      }
    },
  });

  return { stream: readableStream, getResult: () => resultPromise };
}

// ─── Flow 4: Generate Suggestions (non-streaming) ──────────────────────

export async function generateSuggestions(
  orgDossier: string,
  fullMemoryLog: string,
  techStack: string
): Promise<{ recommendations: Array<{
  title: string;
  category: string;
  priority: string;
  business_case: string;
  technical_rationale: string;
  estimated_scope: string;
}> }> {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SUGGESTIONS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildSuggestionsUserMessage(orgDossier, fullMemoryLog, techStack),
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(extractJSON(text));
}
