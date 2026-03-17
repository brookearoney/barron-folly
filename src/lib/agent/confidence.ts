import { createAdminClient } from "@/lib/supabase/admin";
import type { ConfidenceFactors, Tier } from "@/lib/console/types";

// ─── Weights for confidence factors ──────────────────────────────────────

const WEIGHTS = {
  historicalSuccessRate: 0.25,
  taskSimilarity: 0.15,
  riskScore: 0.20,
  tierTrust: 0.15,
  categoryFamiliarity: 0.15,
  policyAlignment: 0.10,
} as const;

// ─── Tier Trust Values ───────────────────────────────────────────────────

const TIER_TRUST_VALUES: Record<Tier, number> = {
  copper: 0.3,
  steel: 0.5,
  titanium: 0.7,
  tungsten: 0.9,
};

// ─── Calculate Confidence Score ──────────────────────────────────────────

export function calculateConfidence(factors: ConfidenceFactors): number {
  // Normalize risk score: higher risk = lower confidence contribution
  const riskConfidence = Math.max(0, 1 - factors.riskScore / 100);

  const weighted =
    factors.historicalSuccessRate * WEIGHTS.historicalSuccessRate +
    factors.taskSimilarity * WEIGHTS.taskSimilarity +
    riskConfidence * WEIGHTS.riskScore +
    factors.tierTrust * WEIGHTS.tierTrust +
    factors.categoryFamiliarity * WEIGHTS.categoryFamiliarity +
    factors.policyAlignment * WEIGHTS.policyAlignment;

  // Clamp to 0-1
  return Math.max(0, Math.min(1, weighted));
}

// ─── Get Historical Confidence from DB ───────────────────────────────────

export async function getHistoricalConfidence(
  orgId: string,
  category: string
): Promise<ConfidenceFactors> {
  const admin = createAdminClient();

  // Query completed tasks in this category for this org
  const [taskResult, runLogResult, orgResult] = await Promise.all([
    admin
      .from("orchestrator_queue")
      .select("status, category, completed_at")
      .eq("organization_id", orgId)
      .in("status", ["completed", "failed"]),
    admin
      .from("agent_run_logs")
      .select("status, flow, duration_ms")
      .eq("organization_id", orgId),
    admin
      .from("organizations")
      .select("tier")
      .eq("id", orgId)
      .single(),
  ]);

  const tasks = (taskResult.data ?? []) as Array<{
    status: string;
    category: string | null;
    completed_at: string | null;
  }>;

  const runLogs = (runLogResult.data ?? []) as Array<{
    status: string;
    flow: string;
    duration_ms: number;
  }>;

  const tier = (orgResult.data?.tier as Tier) ?? "copper";

  // Calculate historical success rate for this category
  const categoryTasks = tasks.filter((t) => t.category === category);
  const totalCategoryTasks = categoryTasks.length;
  const successfulCategoryTasks = categoryTasks.filter((t) => t.status === "completed").length;
  const historicalSuccessRate =
    totalCategoryTasks > 0 ? successfulCategoryTasks / totalCategoryTasks : 0;

  // Task similarity: ratio of category tasks to total tasks (higher = more familiar)
  const totalTasks = tasks.length;
  const taskSimilarity = totalTasks > 0
    ? Math.min(1, categoryTasks.length / Math.max(totalTasks * 0.3, 1))
    : 0;

  // Category familiarity: diminishing returns curve based on task count
  // 0 tasks = 0, 5 tasks = 0.5, 10+ tasks = ~0.8-0.9
  const categoryFamiliarity = totalCategoryTasks > 0
    ? Math.min(1, 1 - Math.exp(-totalCategoryTasks / 8))
    : 0;

  // Risk score: derive from recent failure rate
  const recentTasks = tasks.slice(-20); // last 20 tasks
  const recentFailures = recentTasks.filter((t) => t.status === "failed").length;
  const recentFailureRate = recentTasks.length > 0 ? recentFailures / recentTasks.length : 0.5;
  const riskScore = Math.round(recentFailureRate * 100);

  // Run log success for overall agent reliability
  const completedRuns = runLogs.filter((r) => r.status === "completed").length;
  const totalRuns = runLogs.length;
  const runSuccessRate = totalRuns > 0 ? completedRuns / totalRuns : 0;

  // Policy alignment: we'll estimate based on whether tasks went through without issues
  // Tasks that completed without being blocked or failing give higher alignment
  const policyAlignment = totalCategoryTasks > 0
    ? Math.min(1, (successfulCategoryTasks / totalCategoryTasks) * runSuccessRate + 0.3)
    : 0.3;

  return {
    historicalSuccessRate,
    taskSimilarity,
    riskScore,
    tierTrust: TIER_TRUST_VALUES[tier],
    categoryFamiliarity,
    policyAlignment: Math.min(1, policyAlignment),
  };
}
