/**
 * Prompt Version Registry — manages versioned system/user prompts per AI flow.
 * Supports activation, seeding from hardcoded prompts, and variable resolution.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { PromptFlowType, PromptVersion } from "@/lib/console/types";
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

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

// ─── Core CRUD ──────────────────────────────────────────────────────────

/**
 * Get the active prompt version for a flow.
 * Returns null if none is active (caller should fall back to hardcoded prompts).
 */
export async function getActivePrompt(flow: PromptFlowType): Promise<PromptVersion | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prompt_versions")
    .select("*")
    .eq("flow", flow)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data as PromptVersion;
}

/**
 * Get all prompt versions for a flow, ordered by version descending.
 */
export async function getPromptVersions(flow: PromptFlowType): Promise<PromptVersion[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prompt_versions")
    .select("*")
    .eq("flow", flow)
    .order("version", { ascending: false });

  if (error || !data) {
    console.error("Failed to fetch prompt versions:", error);
    return [];
  }
  return data as PromptVersion[];
}

/**
 * Get all prompt versions across all flows.
 */
export async function getAllPromptVersions(): Promise<PromptVersion[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prompt_versions")
    .select("*")
    .order("flow")
    .order("version", { ascending: false });

  if (error || !data) {
    console.error("Failed to fetch all prompt versions:", error);
    return [];
  }
  return data as PromptVersion[];
}

/**
 * Get a single prompt version by ID.
 */
export async function getPromptVersionById(id: string): Promise<PromptVersion | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prompt_versions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as PromptVersion;
}

/**
 * Create a new prompt version. Auto-increments the version number for the flow.
 */
export async function createPromptVersion(params: {
  flow: PromptFlowType;
  name: string;
  system_prompt: string;
  user_prompt_template: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  metadata?: Record<string, unknown>;
}): Promise<PromptVersion> {
  const supabase = createAdminClient();

  // Get the latest version number for this flow
  const { data: existing } = await supabase
    .from("prompt_versions")
    .select("version")
    .eq("flow", params.flow)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = existing && existing.length > 0 ? existing[0].version + 1 : 1;

  const { data, error } = await supabase
    .from("prompt_versions")
    .insert({
      flow: params.flow,
      version: nextVersion,
      name: params.name,
      system_prompt: params.system_prompt,
      user_prompt_template: params.user_prompt_template,
      model: params.model ?? DEFAULT_MODEL,
      temperature: params.temperature ?? 0,
      max_tokens: params.max_tokens ?? 4096,
      is_active: false,
      is_baseline: false,
      metadata: params.metadata ?? {},
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to create prompt version:", error);
    throw new Error("Failed to create prompt version");
  }

  return data as PromptVersion;
}

/**
 * Activate a prompt version, deactivating any currently active version for the same flow.
 */
export async function activatePromptVersion(promptId: string): Promise<PromptVersion> {
  const supabase = createAdminClient();

  // Get the prompt to know its flow
  const { data: prompt, error: fetchError } = await supabase
    .from("prompt_versions")
    .select("*")
    .eq("id", promptId)
    .single();

  if (fetchError || !prompt) {
    throw new Error("Prompt version not found");
  }

  // Deactivate current active for this flow
  await supabase
    .from("prompt_versions")
    .update({ is_active: false })
    .eq("flow", prompt.flow)
    .eq("is_active", true);

  // Activate the target
  const { data, error } = await supabase
    .from("prompt_versions")
    .update({ is_active: true })
    .eq("id", promptId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Failed to activate prompt version");
  }

  return data as PromptVersion;
}

/**
 * Deactivate a prompt version (falls back to hardcoded prompts).
 */
export async function deactivatePromptVersion(promptId: string): Promise<PromptVersion> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prompt_versions")
    .update({ is_active: false })
    .eq("id", promptId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Failed to deactivate prompt version");
  }

  return data as PromptVersion;
}

// ─── Variable Resolution ────────────────────────────────────────────────

/**
 * Get the active prompt for a flow and resolve template variables.
 * Falls back to hardcoded prompts if no registry entry exists.
 */
export async function resolvePrompt(
  flow: PromptFlowType,
  variables: Record<string, string>
): Promise<{ system: string; user: string; model: string; temperature: number; max_tokens: number }> {
  const activePrompt = await getActivePrompt(flow);

  if (activePrompt) {
    let system = activePrompt.system_prompt;
    let user = activePrompt.user_prompt_template;

    // Replace {{variable}} placeholders
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      system = system.replaceAll(placeholder, value);
      user = user.replaceAll(placeholder, value);
    }

    return {
      system,
      user,
      model: activePrompt.model,
      temperature: activePrompt.temperature,
      max_tokens: activePrompt.max_tokens,
    };
  }

  // Fall back to hardcoded prompts
  return resolveHardcodedPrompt(flow, variables);
}

function resolveHardcodedPrompt(
  flow: PromptFlowType,
  variables: Record<string, string>
): { system: string; user: string; model: string; temperature: number; max_tokens: number } {
  switch (flow) {
    case "dossier":
      return {
        system: DOSSIER_SYSTEM_PROMPT,
        user: buildDossierUserMessage(variables.url ?? "", variables.scrapedText ?? ""),
        model: DEFAULT_MODEL,
        temperature: 0,
        max_tokens: 4096,
      };
    case "style_guide":
      return {
        system: STYLE_GUIDE_SYSTEM_PROMPT,
        user: buildStyleGuideUserMessage(variables.url ?? "", variables.scrapedText ?? "", variables.dossier ?? ""),
        model: DEFAULT_MODEL,
        temperature: 0,
        max_tokens: 4096,
      };
    case "clarify":
      return {
        system: buildClarificationSystemPrompt(
          variables.orgDossier ?? "",
          variables.memoryLog ?? "",
          variables.similarTasks ?? "",
          variables.designDirective ?? ""
        ),
        user: buildClarificationUserMessage(variables.clientName ?? "", variables.request ?? ""),
        model: DEFAULT_MODEL,
        temperature: 0,
        max_tokens: 2048,
      };
    case "construct":
      return {
        system: buildClarificationSystemPrompt(
          variables.orgDossier ?? "",
          variables.memoryLog ?? "",
          variables.similarTasks ?? "",
          variables.designDirective ?? ""
        ),
        user: buildTaskConstructionUserMessage(variables.originalRequest ?? "", variables.qaThread ?? ""),
        model: DEFAULT_MODEL,
        temperature: 0,
        max_tokens: 4096,
      };
    case "suggestions":
      return {
        system: SUGGESTIONS_SYSTEM_PROMPT,
        user: buildSuggestionsUserMessage(
          variables.orgDossier ?? "",
          variables.fullMemoryLog ?? "",
          variables.techStack ?? ""
        ),
        model: DEFAULT_MODEL,
        temperature: 0,
        max_tokens: 4096,
      };
    default:
      return {
        system: "",
        user: "",
        model: DEFAULT_MODEL,
        temperature: 0,
        max_tokens: 4096,
      };
  }
}

// ─── Seed Registry ──────────────────────────────────────────────────────

/**
 * Seeds the prompt registry with the current hardcoded prompts as v1 baseline versions.
 * Idempotent: skips flows that already have a baseline.
 */
export async function seedPromptRegistry(): Promise<void> {
  const supabase = createAdminClient();

  const seeds: Array<{
    flow: PromptFlowType;
    name: string;
    system_prompt: string;
    user_prompt_template: string;
    max_tokens: number;
  }> = [
    {
      flow: "dossier",
      name: "v1-baseline-dossier",
      system_prompt: DOSSIER_SYSTEM_PROMPT,
      user_prompt_template: `Here is the scraped content from {{url}}:

{{scrapedText}}

Construct a complete organizational dossier. Return this exact JSON shape:
{
  "name": string,
  "tagline": string,
  "business_model": string,
  "industry": string,
  "company_size": string,
  "tech_stack": string[],
  "key_products": string[],
  "operational_complexity": string,
  "likely_software_needs": string[],
  "dossier": string
}`,
      max_tokens: 4096,
    },
    {
      flow: "style_guide",
      name: "v1-baseline-style-guide",
      system_prompt: STYLE_GUIDE_SYSTEM_PROMPT,
      user_prompt_template: `Here is the scraped content from {{url}}:

{{scrapedText}}

Also available: the org dossier already generated for this company:
{{dossier}}

Construct the complete style guide and design directive. Return this exact JSON shape:
{
  "colors": { "primary": string, "secondary": string, "accent": string, "neutral": string, "background": string, "text": string, "notes": string },
  "typography": { "heading_font": string, "body_font": string, "scale": string, "weight_usage": string, "notes": string },
  "brand_voice": { "tone": string, "style": string, "audience": string, "avoid": string[] },
  "messaging": { "tagline": string, "value_prop": string, "key_themes": string[] },
  "ui_patterns": { "layout": string, "components": string[], "density": string, "interaction": string, "mobile_first": boolean },
  "logo_url": string,
  "design_directive": string
}`,
      max_tokens: 4096,
    },
    {
      flow: "clarify",
      name: "v1-baseline-clarify",
      system_prompt: `You are the intake specialist for Barron & Folly, an agentic product studio.

Your job is to receive client software requests, analyze them deeply, and ask the minimum set of targeted clarifying questions needed to build precise Linear tasks.

== Organization Context ==
{{orgDossier}}

== Recent Work Memory (last 10 sessions) ==
{{memoryLog}}

== Similar Past Tasks (RAG) ==
{{similarTasks}}

== Brand & Design Reference ==
{{designDirective}}

Rules:
- Ask 2-4 clarifying questions maximum. Never more.
- Each question must be specific and unambiguous.
- Do not ask for information already inferable from org context.
- Return ONLY valid JSON. No markdown, no preamble.`,
      user_prompt_template: `New work request from {{clientName}}:

"{{request}}"

Analyze this request thoroughly. The client has only provided a free-form description — there is no pre-set title, category, or priority. Your clarifying questions should help fill in any gaps needed to build precise tasks.

Return this exact JSON:
{
  "request_summary": string,
  "complexity": "simple" | "moderate" | "complex",
  "estimated_tasks": number,
  "questions": [
    {
      "id": string,
      "question": string,
      "why": string,
      "type": "text" | "choice" | "boolean",
      "options": string[]
    }
  ]
}`,
      max_tokens: 2048,
    },
    {
      flow: "construct",
      name: "v1-baseline-construct",
      system_prompt: `You are the intake specialist for Barron & Folly, an agentic product studio.

Your job is to receive client software requests, analyze them deeply, and ask the minimum set of targeted clarifying questions needed to build precise Linear tasks.

== Organization Context ==
{{orgDossier}}

== Recent Work Memory (last 10 sessions) ==
{{memoryLog}}

== Similar Past Tasks (RAG) ==
{{similarTasks}}

== Brand & Design Reference ==
{{designDirective}}

Rules:
- Ask 2-4 clarifying questions maximum. Never more.
- Each question must be specific and unambiguous.
- Do not ask for information already inferable from org context.
- Return ONLY valid JSON. No markdown, no preamble.`,
      user_prompt_template: `Original request: {{originalRequest}}

Clarification answers:
{{qaThread}}

Now construct the complete task plan. You must also generate a concise request title, select the most appropriate category, and determine the priority level based on the user's description and clarification answers.

Return this exact JSON:
{
  "request_title": string,
  "request_category": "web_platform" | "automation" | "design_system" | "integration" | "internal_tool" | "seo" | "content" | "brand" | "ai_agent" | "other",
  "request_priority": "urgent" | "high" | "medium" | "low",
  "session_summary": string,
  "session_tags": string[],
  "tasks": [
    {
      "title": string,
      "description": string,
      "priority": "urgent" | "high" | "medium" | "low",
      "estimate": number,
      "labels": string[],
      "dependencies": string[],
      "is_epic": boolean,
      "subtasks": [
        {
          "title": string,
          "description": string,
          "priority": "urgent" | "high" | "medium" | "low",
          "estimate": number,
          "labels": string[],
          "dependencies": string[]
        }
      ]
    }
  ]
}

Guidelines for request-level fields:
- request_title: A clear, concise title (max ~80 chars) summarizing the overall request.
- request_category: Choose the single best-fit category.
- request_priority: Determine urgency from user's language, deadlines, and business impact. Default to "medium" if unclear.

Guidelines for task hierarchy:
- For complex requests, organize into Epics with subtasks.
- Set "is_epic" to true for high-level deliverables that contain subtasks.
- Keep subtask granularity at the agent-executable level.`,
      max_tokens: 4096,
    },
    {
      flow: "suggestions",
      name: "v1-baseline-suggestions",
      system_prompt: SUGGESTIONS_SYSTEM_PROMPT,
      user_prompt_template: `== Organization Dossier ==
{{orgDossier}}

== Work Completed (memory log, all sessions) ==
{{fullMemoryLog}}

== Current Tech Stack (accumulated) ==
{{techStack}}

Based on all of the above, identify the top 3-5 recommended next investments. For each, explain the business case clearly enough that a non-technical founder understands why it matters.

Return this exact JSON:
{
  "recommendations": [
    {
      "title": string,
      "category": "infrastructure" | "feature" | "integration" | "debt" | "security",
      "priority": "critical" | "high" | "medium",
      "business_case": string,
      "technical_rationale": string,
      "estimated_scope": "days" | "weeks" | "sprint"
    }
  ]
}`,
      max_tokens: 4096,
    },
  ];

  for (const seed of seeds) {
    // Check if baseline already exists for this flow
    const { data: existing } = await supabase
      .from("prompt_versions")
      .select("id")
      .eq("flow", seed.flow)
      .eq("is_baseline", true)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const { error } = await supabase.from("prompt_versions").insert({
      flow: seed.flow,
      version: 1,
      name: seed.name,
      system_prompt: seed.system_prompt,
      user_prompt_template: seed.user_prompt_template,
      model: DEFAULT_MODEL,
      temperature: 0,
      max_tokens: seed.max_tokens,
      is_active: true,
      is_baseline: true,
      metadata: { source: "hardcoded", seeded_at: new Date().toISOString() },
    });

    if (error) {
      console.error(`Failed to seed prompt for flow '${seed.flow}':`, error);
    }
  }
}
