import { createAdminClient } from "@/lib/supabase/admin";
import type { SuggestionMetrics } from "@/lib/console/types";

// ─── Metrics ────────────────────────────────────────────────────────────

/**
 * Get suggestion metrics for a specific organization.
 */
export async function getSuggestionMetrics(
  orgId: string
): Promise<SuggestionMetrics> {
  const admin = createAdminClient();

  const { data: suggestions } = await admin
    .from("org_suggestions")
    .select("id, status, category, confidence, created_at, updated_at")
    .eq("organization_id", orgId);

  return computeMetrics(suggestions || []);
}

/**
 * Get global suggestion metrics across all organizations.
 */
export async function getGlobalSuggestionMetrics(): Promise<SuggestionMetrics> {
  const admin = createAdminClient();

  const { data: suggestions } = await admin
    .from("org_suggestions")
    .select("id, status, category, confidence, created_at, updated_at");

  return computeMetrics(suggestions || []);
}

/**
 * Analyze suggestion effectiveness by category, source, and priority.
 */
export async function getSuggestionEffectiveness(
  orgId?: string
): Promise<{
  byCategory: Record<
    string,
    { accepted: number; dismissed: number; rate: number }
  >;
  bySource: Record<
    string,
    { accepted: number; dismissed: number; rate: number }
  >;
  byPriority: Record<
    string,
    { accepted: number; dismissed: number; rate: number }
  >;
}> {
  const admin = createAdminClient();

  let query = admin
    .from("org_suggestions")
    .select("id, status, category, source, priority")
    .in("status", ["requested", "implemented", "dismissed"]);

  if (orgId) {
    query = query.eq("organization_id", orgId);
  }

  const { data: suggestions } = await query;
  const items = suggestions || [];

  const byCategory: Record<
    string,
    { accepted: number; dismissed: number; rate: number }
  > = {};
  const bySource: Record<
    string,
    { accepted: number; dismissed: number; rate: number }
  > = {};
  const byPriority: Record<
    string,
    { accepted: number; dismissed: number; rate: number }
  > = {};

  for (const s of items) {
    const isAccepted =
      s.status === "requested" || s.status === "implemented";
    const isDismissed = s.status === "dismissed";

    // By category
    const cat = s.category || "uncategorized";
    if (!byCategory[cat]) {
      byCategory[cat] = { accepted: 0, dismissed: 0, rate: 0 };
    }
    if (isAccepted) byCategory[cat].accepted++;
    if (isDismissed) byCategory[cat].dismissed++;

    // By source
    const src = s.source || "ai";
    if (!bySource[src]) {
      bySource[src] = { accepted: 0, dismissed: 0, rate: 0 };
    }
    if (isAccepted) bySource[src].accepted++;
    if (isDismissed) bySource[src].dismissed++;

    // By priority
    const pri = s.priority || "medium";
    if (!byPriority[pri]) {
      byPriority[pri] = { accepted: 0, dismissed: 0, rate: 0 };
    }
    if (isAccepted) byPriority[pri].accepted++;
    if (isDismissed) byPriority[pri].dismissed++;
  }

  // Compute rates
  for (const bucket of [byCategory, bySource, byPriority]) {
    for (const key of Object.keys(bucket)) {
      const total = bucket[key].accepted + bucket[key].dismissed;
      bucket[key].rate = total > 0 ? bucket[key].accepted / total : 0;
    }
  }

  return { byCategory, bySource, byPriority };
}

// ─── Helpers ────────────────────────────────────────────────────────────

interface SuggestionRow {
  id: string;
  status: string;
  category: string | null;
  confidence: number | null;
  created_at: string;
  updated_at: string;
}

function computeMetrics(suggestions: SuggestionRow[]): SuggestionMetrics {
  const totalGenerated = suggestions.length;

  const acceptedCount = suggestions.filter(
    (s) => s.status === "requested" || s.status === "implemented"
  ).length;

  const dismissedCount = suggestions.filter(
    (s) => s.status === "dismissed"
  ).length;

  const actioned = acceptedCount + dismissedCount;
  const acceptanceRate = actioned > 0 ? acceptedCount / actioned : 0;

  const confidences = suggestions
    .map((s) => s.confidence)
    .filter((c): c is number => c !== null && c !== undefined);
  const avgConfidence =
    confidences.length > 0
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
      : 0;

  // Top categories
  const categoryCounts: Record<string, number> = {};
  for (const s of suggestions) {
    const cat = s.category || "uncategorized";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const topCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Average time to action (hours)
  const actionedSuggestions = suggestions.filter(
    (s) => s.status !== "active"
  );
  let avgTimeToAction = 0;
  if (actionedSuggestions.length > 0) {
    const totalHours = actionedSuggestions.reduce((sum, s) => {
      const created = new Date(s.created_at).getTime();
      const updated = new Date(s.updated_at).getTime();
      return sum + (updated - created) / (1000 * 60 * 60);
    }, 0);
    avgTimeToAction = totalHours / actionedSuggestions.length;
  }

  return {
    totalGenerated,
    acceptedCount,
    dismissedCount,
    acceptanceRate: Math.round(acceptanceRate * 100) / 100,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    topCategories,
    avgTimeToAction: Math.round(avgTimeToAction * 10) / 10,
  };
}
