/**
 * Prompt Performance Tracker — records and analyzes per-version execution metrics.
 * Tracks tokens, cost, duration, and quality scores for comparison and optimization.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { PromptFlowType, PromptPerformanceStats } from "@/lib/console/types";

// ─── Cost Calculation ───────────────────────────────────────────────────

/** Anthropic pricing per million tokens (USD). */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5-20251001": { input: 0.80, output: 4.0 },
  // Fallback for unknown models
  default: { input: 3.0, output: 15.0 },
};

export function calculateCost(model: string, tokensInput: number, tokensOutput: number): number {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING.default;
  return (tokensInput * pricing.input + tokensOutput * pricing.output) / 1_000_000;
}

// ─── Record Execution ───────────────────────────────────────────────────

export async function recordPromptExecution(params: {
  promptVersionId: string;
  flow: PromptFlowType;
  runLogId?: string;
  orgId: string;
  tokensInput: number;
  tokensOutput: number;
  durationMs: number;
  success: boolean;
  error?: string;
  model?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const supabase = createAdminClient();

  const costUsd = calculateCost(
    params.model ?? "claude-sonnet-4-20250514",
    params.tokensInput,
    params.tokensOutput
  );

  const { data, error } = await supabase
    .from("prompt_performance")
    .insert({
      prompt_version_id: params.promptVersionId,
      flow: params.flow,
      run_log_id: params.runLogId ?? null,
      organization_id: params.orgId,
      tokens_input: params.tokensInput,
      tokens_output: params.tokensOutput,
      cost_usd: costUsd,
      duration_ms: params.durationMs,
      success: params.success,
      error_message: params.error ?? null,
      metadata: params.metadata ?? {},
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to record prompt execution:", error);
    throw new Error("Failed to record prompt execution");
  }

  return data.id;
}

// ─── Performance Stats ──────────────────────────────────────────────────

function computePercentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, idx)];
}

export async function getPromptPerformanceStats(promptVersionId: string): Promise<PromptPerformanceStats> {
  const supabase = createAdminClient();

  // Get prompt version metadata
  const { data: promptVersion } = await supabase
    .from("prompt_versions")
    .select("id, flow, version, name")
    .eq("id", promptVersionId)
    .single();

  // Get all performance records for this version
  const { data: records } = await supabase
    .from("prompt_performance")
    .select("*")
    .eq("prompt_version_id", promptVersionId)
    .order("created_at", { ascending: true });

  const rows = records ?? [];
  const totalRuns = rows.length;
  const successCount = rows.filter((r) => r.success).length;

  const durations = rows.map((r) => r.duration_ms).sort((a, b) => a - b);
  const qualityScores = rows.filter((r) => r.quality_score != null).map((r) => r.quality_score as number);

  return {
    promptVersionId,
    flow: promptVersion?.flow ?? "dossier",
    version: promptVersion?.version ?? 0,
    name: promptVersion?.name ?? "Unknown",
    totalRuns,
    successRate: totalRuns > 0 ? successCount / totalRuns : 0,
    avgTokensInput: totalRuns > 0 ? Math.round(rows.reduce((s, r) => s + r.tokens_input, 0) / totalRuns) : 0,
    avgTokensOutput: totalRuns > 0 ? Math.round(rows.reduce((s, r) => s + r.tokens_output, 0) / totalRuns) : 0,
    avgTotalTokens: totalRuns > 0 ? Math.round(rows.reduce((s, r) => s + r.tokens_input + r.tokens_output, 0) / totalRuns) : 0,
    avgCost: totalRuns > 0 ? rows.reduce((s, r) => s + Number(r.cost_usd), 0) / totalRuns : 0,
    totalCost: rows.reduce((s, r) => s + Number(r.cost_usd), 0),
    avgDuration: totalRuns > 0 ? Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / totalRuns) : 0,
    avgQualityScore: qualityScores.length > 0
      ? Math.round((qualityScores.reduce((s, q) => s + q, 0) / qualityScores.length) * 100) / 100
      : null,
    p50Duration: computePercentile(durations, 50),
    p95Duration: computePercentile(durations, 95),
  };
}

// ─── Compare Versions ───────────────────────────────────────────────────

export async function comparePromptVersions(
  versionA: string,
  versionB: string
): Promise<{
  a: PromptPerformanceStats;
  b: PromptPerformanceStats;
  winner: "a" | "b" | "tie";
  improvements: string[];
}> {
  const [a, b] = await Promise.all([
    getPromptPerformanceStats(versionA),
    getPromptPerformanceStats(versionB),
  ]);

  const improvements: string[] = [];
  let scoreA = 0;
  let scoreB = 0;

  // Compare success rate
  if (a.successRate > b.successRate + 0.05) {
    improvements.push(`Version A has ${((a.successRate - b.successRate) * 100).toFixed(1)}% higher success rate`);
    scoreA++;
  } else if (b.successRate > a.successRate + 0.05) {
    improvements.push(`Version B has ${((b.successRate - a.successRate) * 100).toFixed(1)}% higher success rate`);
    scoreB++;
  }

  // Compare token usage
  if (a.avgTotalTokens > 0 && b.avgTotalTokens > 0) {
    const tokenDiff = ((a.avgTotalTokens - b.avgTotalTokens) / a.avgTotalTokens) * 100;
    if (tokenDiff > 10) {
      improvements.push(`Version B uses ${tokenDiff.toFixed(0)}% fewer tokens`);
      scoreB++;
    } else if (tokenDiff < -10) {
      improvements.push(`Version A uses ${Math.abs(tokenDiff).toFixed(0)}% fewer tokens`);
      scoreA++;
    }
  }

  // Compare cost
  if (a.avgCost > 0 && b.avgCost > 0) {
    const costDiff = ((a.avgCost - b.avgCost) / a.avgCost) * 100;
    if (costDiff > 10) {
      improvements.push(`Version B is ${costDiff.toFixed(0)}% cheaper per run`);
      scoreB++;
    } else if (costDiff < -10) {
      improvements.push(`Version A is ${Math.abs(costDiff).toFixed(0)}% cheaper per run`);
      scoreA++;
    }
  }

  // Compare duration
  if (a.avgDuration > 0 && b.avgDuration > 0) {
    const durationDiff = ((a.avgDuration - b.avgDuration) / a.avgDuration) * 100;
    if (durationDiff > 15) {
      improvements.push(`Version B is ${durationDiff.toFixed(0)}% faster`);
      scoreB++;
    } else if (durationDiff < -15) {
      improvements.push(`Version A is ${Math.abs(durationDiff).toFixed(0)}% faster`);
      scoreA++;
    }
  }

  // Compare quality
  if (a.avgQualityScore != null && b.avgQualityScore != null) {
    const qualityDiff = b.avgQualityScore - a.avgQualityScore;
    if (qualityDiff > 5) {
      improvements.push(`Version B scores ${qualityDiff.toFixed(1)} points higher on quality`);
      scoreB++;
    } else if (qualityDiff < -5) {
      improvements.push(`Version A scores ${Math.abs(qualityDiff).toFixed(1)} points higher on quality`);
      scoreA++;
    }
  }

  const winner = scoreA > scoreB ? "a" : scoreB > scoreA ? "b" : "tie";

  if (improvements.length === 0) {
    improvements.push("No significant differences detected between versions");
  }

  return { a, b, winner, improvements };
}

// ─── Flow Performance ───────────────────────────────────────────────────

export async function getFlowPerformance(flow: PromptFlowType): Promise<PromptPerformanceStats[]> {
  const supabase = createAdminClient();

  const { data: versions } = await supabase
    .from("prompt_versions")
    .select("id")
    .eq("flow", flow)
    .order("version", { ascending: false });

  if (!versions || versions.length === 0) return [];

  const stats = await Promise.all(
    versions.map((v) => getPromptPerformanceStats(v.id))
  );

  return stats;
}

// ─── Quality Rating ─────────────────────────────────────────────────────

export async function ratePromptExecution(
  recordId: string,
  score: number,
  source: "admin" | "client"
): Promise<void> {
  const supabase = createAdminClient();

  const clampedScore = Math.max(0, Math.min(100, score));

  const { error } = await supabase
    .from("prompt_performance")
    .update({
      quality_score: clampedScore,
      quality_source: source,
    })
    .eq("id", recordId);

  if (error) {
    console.error("Failed to rate prompt execution:", error);
    throw new Error("Failed to rate prompt execution");
  }
}

// ─── Recent Performance Records ─────────────────────────────────────────

export async function getRecentPerformanceRecords(params?: {
  flow?: PromptFlowType;
  limit?: number;
}): Promise<Array<{
  id: string;
  prompt_version_id: string;
  flow: string;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  duration_ms: number;
  success: boolean;
  quality_score: number | null;
  quality_source: string | null;
  created_at: string;
}>> {
  const supabase = createAdminClient();
  const limit = params?.limit ?? 50;

  let query = supabase
    .from("prompt_performance")
    .select("id, prompt_version_id, flow, tokens_input, tokens_output, cost_usd, duration_ms, success, quality_score, quality_source, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (params?.flow) {
    query = query.eq("flow", params.flow);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data;
}
