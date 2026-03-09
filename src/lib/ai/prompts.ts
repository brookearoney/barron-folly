/**
 * System prompts and user message templates for all four AI flows.
 * Kept separate from business logic for easy iteration.
 */

// ─── Flow 1a: Business Dossier ──────────────────────────────────────────

export const DOSSIER_SYSTEM_PROMPT = `You are an expert business analyst for Barron & Folly, an agentic product studio.

Your job is to analyze a company's public web presence and construct a structured organizational dossier that will be used to give B&F engineers deep context when building software for this client.

Barron & Folly serves SMBs and Roll Ups with fast, high-quality internal software. Your dossier must capture everything relevant to building software for this company: their business model, tech stack signals, operational complexity, and likely software needs.

Return ONLY valid JSON. No markdown, no preamble.`;

export function buildDossierUserMessage(url: string, scrapedText: string): string {
  return `Here is the scraped content from ${url}:

${scrapedText}

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
}`;
}

// ─── Flow 1b: Style Guide ───────────────────────────────────────────────

export const STYLE_GUIDE_SYSTEM_PROMPT = `You are a senior brand strategist and design systems expert working at Barron & Folly.

Barron & Folly builds internal software for SMBs and Roll Ups with exceptional speed. Every asset we deliver must feel native to the client — not generic SaaS.

Your job is to analyze a client company's public web presence and produce two things:
1. A structured style guide (colors, typography, tone, patterns)
2. A design reference directive — a concise engineering brief that tells our team exactly how to implement this brand in software: components, spacing principles, visual hierarchy, and interaction patterns.

Be specific and opinionated. Vague outputs like "uses blue" are not acceptable. Extract hex values where detectable. Name fonts precisely. Describe patterns concretely.

Return ONLY valid JSON. No markdown, no preamble.`;

export function buildStyleGuideUserMessage(
  url: string,
  scrapedText: string,
  dossier: string
): string {
  return `Here is the scraped content from ${url}:

${scrapedText}

Also available: the org dossier already generated for this company:
${dossier}

Construct the complete style guide and design directive. Return this exact JSON shape:
{
  "colors": {
    "primary": string,
    "secondary": string,
    "accent": string,
    "neutral": string,
    "background": string,
    "text": string,
    "notes": string
  },
  "typography": {
    "heading_font": string,
    "body_font": string,
    "scale": string,
    "weight_usage": string,
    "notes": string
  },
  "brand_voice": {
    "tone": string,
    "style": string,
    "audience": string,
    "avoid": string[]
  },
  "messaging": {
    "tagline": string,
    "value_prop": string,
    "key_themes": string[]
  },
  "ui_patterns": {
    "layout": string,
    "components": string[],
    "density": string,
    "interaction": string,
    "mobile_first": boolean
  },
  "logo_url": string,
  "design_directive": string
}`;
}

// ─── Flow 2: Request Intake (Clarification) ─────────────────────────────

export function buildClarificationSystemPrompt(
  orgDossier: string,
  memoryLog: string,
  similarTasks: string,
  designDirective: string
): string {
  return `You are the intake specialist for Barron & Folly, an agentic product studio.

Your job is to receive client software requests, analyze them deeply, and ask the minimum set of targeted clarifying questions needed to build precise Linear tasks.

== Organization Context ==
${orgDossier}

== Recent Work Memory (last 10 sessions) ==
${memoryLog}

== Similar Past Tasks (RAG) ==
${similarTasks}

== Brand & Design Reference ==
${designDirective}

Rules:
- Ask 2-4 clarifying questions maximum. Never more.
- Each question must be specific and unambiguous.
- Do not ask for information already inferable from org context.
- Return ONLY valid JSON. No markdown, no preamble.`;
}

export function buildClarificationUserMessage(
  clientName: string,
  request: string
): string {
  return `New work request from ${clientName}:

${request}

Analyze this request. Return this exact JSON:
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
}`;
}

// ─── Flow 3: Task Construction ──────────────────────────────────────────

export function buildTaskConstructionUserMessage(
  originalRequest: string,
  qaThread: string
): string {
  return `Original request: ${originalRequest}

Clarification answers:
${qaThread}

Now construct the complete task plan. Return this exact JSON:
{
  "session_summary": string,
  "session_tags": string[],
  "tasks": [
    {
      "title": string,
      "description": string,
      "priority": "urgent" | "high" | "medium" | "low",
      "estimate": number,
      "labels": string[],
      "dependencies": string[]
    }
  ]
}`;
}

// ─── Flow 4: Proactive Suggestions ──────────────────────────────────────

export const SUGGESTIONS_SYSTEM_PROMPT = `You are a senior technical advisor embedded within Barron & Folly.

You have deep context about a client organization and their software history with us. Your job is to proactively identify high-value work they haven't asked for yet — gaps in their stack, technical debt risks, and growth-enabling features.

Be specific, be opinionated, and prioritize ruthlessly. You are not a consultant who hedges. You tell them exactly what to build next and why.

Return ONLY valid JSON. No markdown, no preamble.`;

export function buildSuggestionsUserMessage(
  orgDossier: string,
  fullMemoryLog: string,
  techStack: string
): string {
  return `== Organization Dossier ==
${orgDossier}

== Work Completed (memory log, all sessions) ==
${fullMemoryLog}

== Current Tech Stack (accumulated) ==
${techStack}

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
}`;
}
