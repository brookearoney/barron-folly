/**
 * Prompt Auto-Evaluation — uses Claude Haiku as a judge to score prompt outputs.
 * Each flow has specific evaluation criteria weighted to produce a 0-100 composite score.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { PromptFlowType, EvalCriteria } from "@/lib/console/types";

const EVAL_MODEL = "claude-haiku-4-5-20251001";

function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ─── Default Eval Criteria per Flow ─────────────────────────────────────

const FLOW_CRITERIA: Record<PromptFlowType, EvalCriteria[]> = {
  clarify: [
    { name: "Question Relevance", description: "How relevant are the questions to the request? Do they address actual ambiguities?", weight: 0.3 },
    { name: "Specificity", description: "Are the questions specific and precise, not vague or generic?", weight: 0.25 },
    { name: "Coverage", description: "Do the questions cover the key gaps needed to build precise tasks?", weight: 0.25 },
    { name: "Appropriate Count", description: "Is the number of questions appropriate (2-4)? Not too many, not too few?", weight: 0.2 },
  ],
  construct: [
    { name: "Task Decomposition", description: "Is the work broken down into clear, actionable tasks with appropriate granularity?", weight: 0.3 },
    { name: "Estimate Reasonableness", description: "Are the time/effort estimates reasonable and calibrated?", weight: 0.2 },
    { name: "Dependency Accuracy", description: "Are task dependencies correctly identified and logical?", weight: 0.2 },
    { name: "Completeness", description: "Does the plan cover all aspects of the request without missing deliverables?", weight: 0.3 },
  ],
  dossier: [
    { name: "Information Accuracy", description: "Is the extracted information accurate based on the input?", weight: 0.35 },
    { name: "Completeness", description: "Are all relevant business aspects captured (model, stack, products, needs)?", weight: 0.35 },
    { name: "Actionability", description: "Is the dossier useful for engineering teams building software for this client?", weight: 0.3 },
  ],
  style_guide: [
    { name: "Design Coherence", description: "Does the style guide form a coherent, usable design system?", weight: 0.3 },
    { name: "Specificity", description: "Are values specific (hex codes, font names, concrete patterns) not vague?", weight: 0.35 },
    { name: "Brand Alignment", description: "Does the guide align with the company's actual brand identity?", weight: 0.35 },
  ],
  suggestions: [
    { name: "Relevance", description: "Are recommendations relevant to the organization's actual situation?", weight: 0.3 },
    { name: "Actionability", description: "Can the recommendations be directly acted upon? Are they concrete?", weight: 0.35 },
    { name: "Business Value", description: "Do the recommendations align with clear business value and ROI?", weight: 0.35 },
  ],
  scrape: [
    { name: "Content Extraction", description: "Was the relevant content extracted accurately?", weight: 0.5 },
    { name: "Completeness", description: "Was all useful content captured without significant omissions?", weight: 0.5 },
  ],
};

export function getEvalCriteria(flow: PromptFlowType): EvalCriteria[] {
  return FLOW_CRITERIA[flow] ?? [];
}

// ─── Auto-Evaluate ──────────────────────────────────────────────────────

export async function autoEvaluate(params: {
  flow: PromptFlowType;
  input: string;
  output: string;
  criteria?: EvalCriteria[];
}): Promise<{
  score: number;
  breakdown: Array<{ criteria: string; score: number; reasoning: string }>;
}> {
  const client = getClient();
  const criteria = params.criteria ?? getEvalCriteria(params.flow);

  if (criteria.length === 0) {
    return { score: 0, breakdown: [] };
  }

  const criteriaList = criteria
    .map((c, i) => `${i + 1}. ${c.name} (weight: ${c.weight}): ${c.description}`)
    .join("\n");

  const systemPrompt = `You are an expert AI output evaluator. Your job is to score the quality of an AI-generated output on specific criteria.

Score each criterion from 0 to 100 where:
- 0-20: Poor — fundamentally flawed or missing
- 21-40: Below average — significant issues
- 41-60: Average — acceptable but could be improved
- 61-80: Good — solid quality with minor issues
- 81-100: Excellent — exceptional quality

Be critical and calibrated. A score of 100 should be extremely rare. Most good outputs should score 65-85.

Return ONLY valid JSON. No markdown, no preamble.`;

  const userMessage = `Evaluate this AI output for the "${params.flow}" flow.

== INPUT (what the AI was given) ==
${params.input.slice(0, 3000)}

== OUTPUT (what the AI produced) ==
${params.output.slice(0, 5000)}

== EVALUATION CRITERIA ==
${criteriaList}

Score each criterion and provide a brief reasoning. Return this exact JSON:
{
  "scores": [
    {
      "criteria": string,
      "score": number,
      "reasoning": string
    }
  ]
}

There must be exactly ${criteria.length} scores, one for each criterion listed above, in the same order.`;

  try {
    const response = await client.messages.create({
      model: EVAL_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON from potential markdown wrapping
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Auto-eval: could not parse JSON from response:", text.slice(0, 200));
      return { score: 0, breakdown: [] };
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      scores: Array<{ criteria: string; score: number; reasoning: string }>;
    };

    // Calculate weighted composite score
    const breakdown = parsed.scores.map((s, i) => ({
      criteria: s.criteria,
      score: Math.max(0, Math.min(100, s.score)),
      reasoning: s.reasoning,
    }));

    let compositeScore = 0;
    for (let i = 0; i < breakdown.length && i < criteria.length; i++) {
      compositeScore += breakdown[i].score * criteria[i].weight;
    }

    return {
      score: Math.round(compositeScore * 100) / 100,
      breakdown,
    };
  } catch (err) {
    console.error("Auto-evaluation failed:", err);
    return { score: 0, breakdown: [] };
  }
}
