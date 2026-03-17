/**
 * Prompt A/B Testing — framework for running controlled experiments
 * on prompt variations with statistical significance tracking.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { PromptFlowType, ABTest, ABTestResults } from "@/lib/console/types";
import { getPromptPerformanceStats } from "./prompt-performance";

// ─── Create Test ────────────────────────────────────────────────────────

export async function createABTest(params: {
  flow: PromptFlowType;
  name: string;
  description: string;
  variantAId: string;
  variantBId: string;
  splitPercentage?: number;
  minSampleSize?: number;
}): Promise<ABTest> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prompt_ab_tests")
    .insert({
      flow: params.flow,
      name: params.name,
      description: params.description,
      variant_a_id: params.variantAId,
      variant_b_id: params.variantBId,
      split_percentage: params.splitPercentage ?? 50,
      status: "draft",
      min_sample_size: params.minSampleSize ?? 30,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to create A/B test:", error);
    throw new Error("Failed to create A/B test");
  }

  return data as ABTest;
}

// ─── Get Variant for Execution ──────────────────────────────────────────

/**
 * Determines which prompt version to use for a given flow execution.
 * If an A/B test is running, randomly assigns based on split percentage.
 * Otherwise returns the active prompt version ID.
 */
export async function getABTestVariant(
  flow: PromptFlowType
): Promise<{ testId: string | null; promptVersionId: string }> {
  const supabase = createAdminClient();

  // Check for a running A/B test on this flow
  const { data: runningTests } = await supabase
    .from("prompt_ab_tests")
    .select("*")
    .eq("flow", flow)
    .eq("status", "running")
    .limit(1);

  if (runningTests && runningTests.length > 0) {
    const test = runningTests[0] as ABTest;
    const roll = Math.random() * 100;

    // If roll < split_percentage, use variant B (challenger)
    const chosenVariant = roll < test.split_percentage
      ? test.variant_b_id
      : test.variant_a_id;

    return { testId: test.id, promptVersionId: chosenVariant };
  }

  // No A/B test running — get active prompt for this flow
  const { data: activePrompt } = await supabase
    .from("prompt_versions")
    .select("id")
    .eq("flow", flow)
    .eq("is_active", true)
    .single();

  return {
    testId: null,
    promptVersionId: activePrompt?.id ?? "",
  };
}

// ─── Test Results ───────────────────────────────────────────────────────

export async function getABTestResults(testId: string): Promise<ABTestResults> {
  const supabase = createAdminClient();

  const { data: test, error } = await supabase
    .from("prompt_ab_tests")
    .select("*")
    .eq("id", testId)
    .single();

  if (error || !test) {
    throw new Error("A/B test not found");
  }

  const [variantA, variantB] = await Promise.all([
    getPromptPerformanceStats(test.variant_a_id),
    getPromptPerformanceStats(test.variant_b_id),
  ]);

  const sampleSizeReached =
    variantA.totalRuns >= test.min_sample_size &&
    variantB.totalRuns >= test.min_sample_size;

  // Simple statistical significance check using a z-test approximation
  // for success rate comparison
  const statisticallySignificant = checkStatisticalSignificance(
    variantA.successRate,
    variantA.totalRuns,
    variantB.successRate,
    variantB.totalRuns
  );

  const recommendation = generateRecommendation(
    test as ABTest,
    variantA,
    variantB,
    sampleSizeReached,
    statisticallySignificant
  );

  return {
    test: test as ABTest,
    variantA,
    variantB,
    sampleSizeReached,
    statisticallySignificant,
    recommendation,
  };
}

/**
 * Two-proportion z-test at 95% confidence (z > 1.96).
 */
function checkStatisticalSignificance(
  rateA: number,
  nA: number,
  rateB: number,
  nB: number
): boolean {
  if (nA < 5 || nB < 5) return false;

  const pooledRate = (rateA * nA + rateB * nB) / (nA + nB);
  if (pooledRate === 0 || pooledRate === 1) return false;

  const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / nA + 1 / nB));
  if (se === 0) return false;

  const z = Math.abs(rateA - rateB) / se;
  return z > 1.96;
}

function generateRecommendation(
  test: ABTest,
  a: { totalRuns: number; successRate: number; avgCost: number; avgDuration: number; avgQualityScore: number | null },
  b: { totalRuns: number; successRate: number; avgCost: number; avgDuration: number; avgQualityScore: number | null },
  sampleSizeReached: boolean,
  statisticallySignificant: boolean
): string {
  if (!sampleSizeReached) {
    const remaining = Math.max(
      test.min_sample_size - a.totalRuns,
      test.min_sample_size - b.totalRuns,
      0
    );
    return `Need at least ${remaining} more runs to reach minimum sample size of ${test.min_sample_size} per variant.`;
  }

  if (!statisticallySignificant) {
    return "No statistically significant difference between variants yet. Consider running the test longer or increasing sample size.";
  }

  // Score each variant
  let aScore = 0;
  let bScore = 0;

  if (a.successRate > b.successRate) aScore += 2; else if (b.successRate > a.successRate) bScore += 2;
  if (a.avgCost < b.avgCost) aScore++; else if (b.avgCost < a.avgCost) bScore++;
  if (a.avgDuration < b.avgDuration) aScore++; else if (b.avgDuration < a.avgDuration) bScore++;

  if (a.avgQualityScore != null && b.avgQualityScore != null) {
    if (a.avgQualityScore > b.avgQualityScore) aScore += 2;
    else if (b.avgQualityScore > a.avgQualityScore) bScore += 2;
  }

  if (aScore > bScore) {
    return `Variant A (control) outperforms Variant B. Consider keeping the current prompt.`;
  } else if (bScore > aScore) {
    return `Variant B (challenger) outperforms Variant A. Consider promoting Variant B to active.`;
  }
  return "Both variants perform similarly. Consider other qualitative factors to decide.";
}

// ─── Test Lifecycle ─────────────────────────────────────────────────────

export async function startABTest(testId: string): Promise<ABTest> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prompt_ab_tests")
    .update({ status: "running", start_date: new Date().toISOString() })
    .eq("id", testId)
    .select("*")
    .single();

  if (error || !data) throw new Error("Failed to start A/B test");
  return data as ABTest;
}

export async function pauseABTest(testId: string): Promise<ABTest> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prompt_ab_tests")
    .update({ status: "paused" })
    .eq("id", testId)
    .select("*")
    .single();

  if (error || !data) throw new Error("Failed to pause A/B test");
  return data as ABTest;
}

export async function completeABTest(
  testId: string,
  winnerId: string,
  conclusion: string
): Promise<ABTest> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prompt_ab_tests")
    .update({
      status: "completed",
      winner_id: winnerId,
      conclusion,
      end_date: new Date().toISOString(),
    })
    .eq("id", testId)
    .select("*")
    .single();

  if (error || !data) throw new Error("Failed to complete A/B test");
  return data as ABTest;
}

// ─── Queries ────────────────────────────────────────────────────────────

export async function getActiveTests(): Promise<ABTest[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prompt_ab_tests")
    .select("*")
    .in("status", ["draft", "running", "paused"])
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as ABTest[];
}

export async function getAllTests(flow?: PromptFlowType): Promise<ABTest[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("prompt_ab_tests")
    .select("*")
    .order("created_at", { ascending: false });

  if (flow) {
    query = query.eq("flow", flow);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as ABTest[];
}

export async function getABTestById(testId: string): Promise<ABTest | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("prompt_ab_tests")
    .select("*")
    .eq("id", testId)
    .single();

  if (error || !data) return null;
  return data as ABTest;
}
