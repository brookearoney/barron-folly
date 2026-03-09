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

function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ─── Flow 1a: Generate Business Dossier (non-streaming) ─────────────────

export async function generateBusinessDossier(
  scrapedText: string,
  url: string
): Promise<BusinessDossier> {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: DOSSIER_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: buildDossierUserMessage(url, scrapedText) },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text) as BusinessDossier;
}

// ─── Flow 1b: Generate Style Guide (non-streaming) ─────────────────────

export async function generateStyleGuide(
  scrapedText: string,
  url: string,
  dossierJson: string
): Promise<StyleGuide> {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: STYLE_GUIDE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildStyleGuideUserMessage(url, scrapedText, dossierJson),
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text) as StyleGuide;
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
        resolveResult(JSON.parse(accumulated) as AiClarificationData);
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
        resolveResult(JSON.parse(accumulated) as AiTaskPlan);
      } catch {
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
  return JSON.parse(text);
}
