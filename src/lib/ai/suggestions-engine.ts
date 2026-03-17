import { createAdminClient } from "@/lib/supabase/admin";
import { generateSuggestions } from "@/lib/ai/claude";
import {
  buildOrgContext,
  buildMemoryLogContext,
  buildTechStackContext,
} from "@/lib/ai/context";
import { withRunLogging } from "@/lib/ai/with-logging";
import type {
  Organization,
  OrgSuggestion,
  SuggestionCandidate,
  SuggestionSource,
  RequestCategory,
} from "@/lib/console/types";

// ─── Text Similarity Helpers (mirrors dedup.ts) ─────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordSet(text: string): Set<string> {
  return new Set(normalize(text).split(" ").filter((w) => w.length > 2));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// ─── Category Mapping ───────────────────────────────────────────────────

const AI_CATEGORY_MAP: Record<string, RequestCategory> = {
  infrastructure: "web_platform",
  feature: "web_platform",
  integration: "integration",
  debt: "web_platform",
  security: "web_platform",
};

// ─── Signal Analyzers ───────────────────────────────────────────────────

/**
 * Analyze request history for usage patterns: high-activity categories, trends.
 */
export async function analyzeUsagePatterns(
  orgId: string
): Promise<SuggestionCandidate[]> {
  const admin = createAdminClient();
  const candidates: SuggestionCandidate[] = [];

  // Get request counts by category over the last 90 days
  const ninetyDaysAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: requests } = await admin
    .from("requests")
    .select("id, category, priority, status, created_at")
    .eq("organization_id", orgId)
    .gte("created_at", ninetyDaysAgo)
    .order("created_at", { ascending: false });

  if (!requests || requests.length < 3) return candidates;

  // Count by category
  const categoryCounts: Record<string, number> = {};
  const recentCategoryCounts: Record<string, number> = {};
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  for (const req of requests) {
    const cat = req.category || "other";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    if (req.created_at >= thirtyDaysAgo) {
      recentCategoryCounts[cat] = (recentCategoryCounts[cat] || 0) + 1;
    }
  }

  // Find trending categories (higher recent proportion than overall)
  const totalRequests = requests.length;
  const recentTotal = Object.values(recentCategoryCounts).reduce(
    (s, c) => s + c,
    0
  );

  for (const [cat, recentCount] of Object.entries(recentCategoryCounts)) {
    const overallCount = categoryCounts[cat] || 0;
    const overallRate = overallCount / totalRequests;
    const recentRate = recentTotal > 0 ? recentCount / recentTotal : 0;

    // Trending if recent rate is significantly higher
    if (recentRate > overallRate * 1.5 && recentCount >= 2) {
      candidates.push({
        title: `Invest in ${formatCategoryName(cat)} infrastructure`,
        description: `Your ${formatCategoryName(cat)} requests have been trending upward recently (${recentCount} in the last 30 days). Consider investing in foundational infrastructure to make future ${formatCategoryName(cat)} work faster and more reliable.`,
        category: cat as RequestCategory,
        rationale: `${recentCount} requests in last 30 days vs ${overallCount} total in 90 days shows a clear pattern of growing need.`,
        estimated_effort: recentCount > 4 ? "sprint" : "weeks",
        priority: recentCount > 4 ? "high" : "medium",
        confidence: Math.min(0.9, 0.5 + recentCount * 0.1),
        source: "system" as SuggestionSource,
        tags: [cat, "trend", "usage-pattern"],
      });
    }
  }

  // Check for high-priority request concentration
  const urgentHighRequests = requests.filter(
    (r) => r.priority === "urgent" || r.priority === "high"
  );
  if (urgentHighRequests.length > totalRequests * 0.4 && totalRequests >= 5) {
    candidates.push({
      title: "Proactive maintenance plan to reduce urgent requests",
      description:
        "A large portion of your requests come in as high priority or urgent. A proactive maintenance and monitoring plan could help catch issues before they become emergencies.",
      category: "web_platform",
      rationale: `${urgentHighRequests.length} of ${totalRequests} recent requests were high/urgent priority (${Math.round((urgentHighRequests.length / totalRequests) * 100)}%).`,
      estimated_effort: "weeks",
      priority: "high",
      confidence: 0.7,
      source: "system",
      tags: ["maintenance", "proactive", "priority-analysis"],
    });
  }

  return candidates;
}

/**
 * Analyze recently completed work and suggest follow-ups.
 */
export async function analyzeCompletedWork(
  orgId: string
): Promise<SuggestionCandidate[]> {
  const admin = createAdminClient();
  const candidates: SuggestionCandidate[] = [];

  // Get recently completed tasks (last 30 days)
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: completedTasks } = await admin
    .from("orchestrator_queue")
    .select(
      "id, title, description, category, completed_at, result_summary, metadata"
    )
    .eq("organization_id", orgId)
    .eq("status", "completed")
    .gte("completed_at", thirtyDaysAgo)
    .order("completed_at", { ascending: false })
    .limit(20);

  if (!completedTasks || completedTasks.length === 0) return candidates;

  // Pattern-based follow-up suggestions
  const followUpPatterns: Array<{
    keywords: string[];
    title: string;
    description: string;
    category: RequestCategory;
    tags: string[];
  }> = [
    {
      keywords: ["landing page", "homepage", "new page"],
      title: "Add analytics tracking to recently launched pages",
      description:
        "You recently launched new pages. Adding analytics tracking (heatmaps, conversion funnels, scroll depth) will help you understand user behavior and optimize for conversions.",
      category: "web_platform",
      tags: ["analytics", "follow-up", "conversion"],
    },
    {
      keywords: ["api", "endpoint", "integration"],
      title: "Add monitoring and error alerting for new integrations",
      description:
        "New integrations benefit from proactive monitoring. Set up error alerting and health checks to catch issues before they impact your users.",
      category: "integration",
      tags: ["monitoring", "follow-up", "reliability"],
    },
    {
      keywords: ["design", "ui", "component", "layout"],
      title: "Create responsive and accessibility audit for new UI work",
      description:
        "Recent UI changes should be audited for responsive behavior across devices and accessibility compliance (WCAG 2.1 AA).",
      category: "design_system",
      tags: ["accessibility", "responsive", "follow-up"],
    },
    {
      keywords: ["automation", "workflow", "cron", "scheduled"],
      title: "Add failure notifications for new automations",
      description:
        "New automations should have failure alerting configured so you are notified immediately if something breaks in production.",
      category: "automation",
      tags: ["monitoring", "follow-up", "reliability"],
    },
    {
      keywords: ["deploy", "release", "launch"],
      title: "Set up rollback procedures for recent deployments",
      description:
        "Ensure recent deployments have documented rollback procedures and quick-revert capabilities in case issues are discovered post-launch.",
      category: "web_platform",
      tags: ["deployment", "follow-up", "safety"],
    },
  ];

  for (const task of completedTasks) {
    const taskText = `${task.title || ""} ${task.description || ""} ${task.result_summary || ""}`.toLowerCase();

    for (const pattern of followUpPatterns) {
      const matches = pattern.keywords.some((kw) => taskText.includes(kw));
      if (matches) {
        // Only add if we haven't already added this pattern
        const alreadyAdded = candidates.some(
          (c) => c.title === pattern.title
        );
        if (!alreadyAdded) {
          candidates.push({
            title: pattern.title,
            description: pattern.description,
            category: pattern.category,
            rationale: `Follow-up to recently completed task: "${task.title}"`,
            estimated_effort: "days",
            priority: "medium",
            confidence: 0.6,
            source: "system",
            tags: pattern.tags,
          });
        }
      }
    }
  }

  return candidates;
}

/**
 * Analyze tech debt signals from failed/retried tasks.
 */
export async function analyzeTechDebt(
  orgId: string
): Promise<SuggestionCandidate[]> {
  const admin = createAdminClient();
  const candidates: SuggestionCandidate[] = [];

  const sixtyDaysAgo = new Date(
    Date.now() - 60 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Find failed or retried tasks
  const { data: problemTasks } = await admin
    .from("orchestrator_queue")
    .select(
      "id, title, description, category, status, attempt_count, last_error, agent_group"
    )
    .eq("organization_id", orgId)
    .gte("created_at", sixtyDaysAgo)
    .or("status.eq.failed,attempt_count.gt.1")
    .limit(50);

  if (!problemTasks || problemTasks.length === 0) return candidates;

  const failedCount = problemTasks.filter((t) => t.status === "failed").length;
  const retriedCount = problemTasks.filter(
    (t) => t.attempt_count > 1
  ).length;

  // Group errors by pattern
  const errorPatterns: Record<string, number> = {};
  for (const task of problemTasks) {
    if (task.last_error) {
      // Extract a simplified error key
      const errorKey = task.last_error.slice(0, 80).trim();
      errorPatterns[errorKey] = (errorPatterns[errorKey] || 0) + 1;
    }
  }

  if (failedCount >= 3) {
    candidates.push({
      title: "Address recurring task failures",
      description: `${failedCount} tasks have failed in the last 60 days. Investigating root causes and fixing underlying issues will improve reliability and reduce wasted effort.`,
      category: "web_platform",
      rationale: `${failedCount} failed tasks and ${retriedCount} tasks requiring retries indicate systemic issues worth addressing.`,
      estimated_effort: "weeks",
      priority: failedCount >= 5 ? "high" : "medium",
      confidence: 0.75,
      source: "system",
      tags: ["tech-debt", "reliability", "failures"],
    });
  }

  // Look for retry-heavy categories
  const categoryRetries: Record<string, number> = {};
  for (const task of problemTasks.filter((t) => t.attempt_count > 1)) {
    const cat = task.category || "unknown";
    categoryRetries[cat] = (categoryRetries[cat] || 0) + 1;
  }

  for (const [cat, count] of Object.entries(categoryRetries)) {
    if (count >= 2) {
      candidates.push({
        title: `Improve ${formatCategoryName(cat)} reliability`,
        description: `Multiple ${formatCategoryName(cat)} tasks have required retries. Investing in better error handling, validation, or testing in this area will reduce failures.`,
        category: (cat === "unknown" ? "other" : cat) as RequestCategory,
        rationale: `${count} tasks in the ${cat} category required multiple attempts.`,
        estimated_effort: "days",
        priority: "medium",
        confidence: 0.65,
        source: "system",
        tags: ["tech-debt", "reliability", cat],
      });
    }
  }

  return candidates;
}

/**
 * Suggest seasonal/time-based improvements based on business context.
 */
export async function analyzeSeasonalTrends(
  orgId: string
): Promise<SuggestionCandidate[]> {
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (!org || !org.business_dossier) return [];

  const typedOrg = org as unknown as Organization;
  const orgContext = buildOrgContext(typedOrg);
  const memoryLog = buildMemoryLogContext(typedOrg.memory_log || []);
  const techStack = buildTechStackContext(typedOrg);

  // Use the existing AI suggestions generator with seasonal context
  try {
    const result = await withRunLogging(
      {
        orgId,
        flow: "suggestions",
        inputSummary: `Generating AI suggestions for ${typedOrg.name}`,
      },
      () => generateSuggestions(orgContext, memoryLog, techStack)
    );

    return result.recommendations.map((rec) => ({
      title: rec.title,
      description: rec.business_case,
      category: (AI_CATEGORY_MAP[rec.category] || "other") as RequestCategory,
      rationale: rec.technical_rationale,
      estimated_effort: rec.estimated_scope,
      priority: rec.priority === "critical" ? "high" : (rec.priority as "high" | "medium" | "low"),
      confidence: 0.7,
      source: "ai" as SuggestionSource,
      tags: [rec.category, "ai-generated"],
    }));
  } catch (error) {
    console.error("AI suggestion generation failed:", error);
    return [];
  }
}

// ─── Deduplication ──────────────────────────────────────────────────────

/**
 * Remove suggestions that are too similar to existing active/requested suggestions,
 * or to each other within the candidate batch.
 */
export async function deduplicateSuggestions(
  orgId: string,
  candidates: SuggestionCandidate[]
): Promise<SuggestionCandidate[]> {
  const admin = createAdminClient();

  // Get existing active or requested suggestions
  const { data: existing } = await admin
    .from("org_suggestions")
    .select("id, title, description, status")
    .eq("organization_id", orgId)
    .in("status", ["active", "requested"]);

  const existingSuggestions = existing || [];
  const existingWordSets = existingSuggestions.map((s) =>
    wordSet(`${s.title} ${s.description}`)
  );

  const deduped: SuggestionCandidate[] = [];
  const dedupedWordSets: Set<string>[] = [];

  for (const candidate of candidates) {
    const candidateWords = wordSet(`${candidate.title} ${candidate.description}`);

    // Check against existing suggestions (threshold 0.5 for suggestions)
    const duplicateOfExisting = existingWordSets.some(
      (existingWords) => jaccardSimilarity(candidateWords, existingWords) > 0.5
    );
    if (duplicateOfExisting) continue;

    // Check against already-accepted candidates in this batch
    const duplicateOfBatch = dedupedWordSets.some(
      (batchWords) => jaccardSimilarity(candidateWords, batchWords) > 0.5
    );
    if (duplicateOfBatch) continue;

    deduped.push(candidate);
    dedupedWordSets.push(candidateWords);
  }

  return deduped;
}

// ─── Storage ────────────────────────────────────────────────────────────

/**
 * Persist suggestion candidates to the database.
 */
export async function storeSuggestions(
  orgId: string,
  suggestions: SuggestionCandidate[]
): Promise<OrgSuggestion[]> {
  if (suggestions.length === 0) return [];

  const admin = createAdminClient();

  const insertData = suggestions.map((s) => ({
    organization_id: orgId,
    title: s.title,
    description: s.description,
    category: s.category,
    rationale: s.rationale,
    estimated_effort: s.estimated_effort,
    priority: s.priority,
    status: "active" as const,
    source: s.source,
    confidence: s.confidence,
    tags: s.tags,
    metadata: s.metadata || {},
    expires_at: new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000
    ).toISOString(),
  }));

  const { data, error } = await admin
    .from("org_suggestions")
    .insert(insertData)
    .select();

  if (error) {
    console.error("Failed to store suggestions:", error);
    throw error;
  }

  return (data || []) as OrgSuggestion[];
}

// ─── Conversion ─────────────────────────────────────────────────────────

/**
 * Convert a suggestion into a formal request, linking them together.
 */
export async function convertSuggestionToRequest(
  suggestionId: string,
  userId: string
): Promise<{ suggestion: OrgSuggestion; requestId: string }> {
  const admin = createAdminClient();

  // Get the suggestion
  const { data: suggestion, error: fetchError } = await admin
    .from("org_suggestions")
    .select("*")
    .eq("id", suggestionId)
    .single();

  if (fetchError || !suggestion) {
    throw new Error("Suggestion not found");
  }

  if (suggestion.status !== "active") {
    throw new Error(`Suggestion is not active (status: ${suggestion.status})`);
  }

  // Create a new request from the suggestion
  const { data: request, error: requestError } = await admin
    .from("requests")
    .insert({
      organization_id: suggestion.organization_id,
      created_by: userId,
      title: suggestion.title,
      description: `${suggestion.description}\n\nRationale: ${suggestion.rationale || "N/A"}\nEstimated effort: ${suggestion.estimated_effort || "N/A"}`,
      category: suggestion.category || "other",
      priority: suggestion.priority === "high" ? "high" : "medium",
      status: "submitted",
      ai_phase: "none",
    })
    .select("id")
    .single();

  if (requestError || !request) {
    throw new Error("Failed to create request from suggestion");
  }

  // Update the suggestion status
  const { data: updatedSuggestion, error: updateError } = await admin
    .from("org_suggestions")
    .update({
      status: "requested",
      request_id: request.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", suggestionId)
    .select()
    .single();

  if (updateError) {
    throw new Error("Failed to update suggestion status");
  }

  return {
    suggestion: updatedSuggestion as OrgSuggestion,
    requestId: request.id,
  };
}

// ─── Main Engine ────────────────────────────────────────────────────────

/**
 * Generate enhanced suggestions from multiple signal sources,
 * deduplicate, and store.
 */
export async function generateEnhancedSuggestions(
  orgId: string
): Promise<SuggestionCandidate[]> {
  // Run all signal analyzers in parallel
  const [usageResults, completedResults, debtResults, aiResults] =
    await Promise.allSettled([
      analyzeUsagePatterns(orgId),
      analyzeCompletedWork(orgId),
      analyzeTechDebt(orgId),
      analyzeSeasonalTrends(orgId),
    ]);

  // Collect all candidates, ignoring failed analyzers
  const allCandidates: SuggestionCandidate[] = [];

  for (const result of [usageResults, completedResults, debtResults, aiResults]) {
    if (result.status === "fulfilled") {
      allCandidates.push(...result.value);
    } else {
      console.error("Signal analyzer failed:", result.reason);
    }
  }

  // Sort by confidence descending, then priority
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  allCandidates.sort((a, b) => {
    const confDiff = b.confidence - a.confidence;
    if (Math.abs(confDiff) > 0.1) return confDiff;
    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  });

  // Cap at 10 candidates before dedup
  const capped = allCandidates.slice(0, 10);

  // Deduplicate
  const deduped = await deduplicateSuggestions(orgId, capped);

  return deduped;
}

// ─── Helpers ────────────────────────────────────────────────────────────

function formatCategoryName(category: string): string {
  const names: Record<string, string> = {
    web_platform: "Web Platform",
    automation: "Automation",
    design_system: "Design System",
    integration: "Integration",
    internal_tool: "Internal Tools",
    seo: "SEO",
    content: "Content",
    brand: "Brand",
    ai_agent: "AI Agent",
    other: "General",
  };
  return names[category] || category.replace(/_/g, " ");
}
