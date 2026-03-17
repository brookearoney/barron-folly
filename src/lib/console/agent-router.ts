import { createAdminClient } from "@/lib/supabase/admin";
import type { AgentGroup } from "./types";

const ALL_AGENT_GROUPS: AgentGroup[] = [
  "research", "content", "frontend", "integration", "data", "infra", "security", "qa", "ops",
];

const CATEGORY_MAP: Record<string, AgentGroup> = {
  web_platform: "frontend",
  design_system: "frontend",
  internal_tool: "frontend",
  automation: "ops",
  integration: "integration",
  ai_agent: "integration",
  seo: "content",
  content: "content",
  brand: "content",
};

/** Alternative groups that can handle overflow for a primary group */
const OVERFLOW_ALTERNATIVES: Partial<Record<AgentGroup, AgentGroup[]>> = {
  frontend: ["ops", "integration"],
  content: ["research", "ops"],
  integration: ["ops", "frontend"],
  ops: ["integration", "infra"],
  data: ["research", "ops"],
  research: ["content", "ops"],
  infra: ["ops"],
  security: ["ops", "infra"],
  qa: ["ops"],
};

/** Threshold: if a group has this many more queued+running tasks than average, consider overflow */
const OVERLOAD_THRESHOLD = 5;

const KEYWORD_ROUTES: { keywords: string[]; group: AgentGroup }[] = [
  { keywords: ["security", "auth", "authentication", "authorization", "vulnerability", "csrf", "xss"], group: "security" },
  { keywords: ["deploy", "dns", "infra", "infrastructure", "hosting", "server", "ci/cd", "pipeline", "docker", "kubernetes"], group: "infra" },
  { keywords: ["test", "qa", "quality", "e2e", "unit test", "regression", "coverage"], group: "qa" },
  { keywords: ["report", "dashboard", "data", "analytics", "metrics", "visualization", "chart"], group: "data" },
  { keywords: ["research", "audit", "analysis", "competitor", "benchmark", "review"], group: "research" },
];

/**
 * Route a task to the appropriate agent group based on its category and description.
 *
 * Priority:
 * 1. Direct category mapping
 * 2. Keyword analysis of description
 * 3. Fallback to 'ops'
 */
export function routeToAgentGroup(category: string, description?: string): AgentGroup {
  // Direct category mapping
  const directMatch = CATEGORY_MAP[category];
  if (directMatch) return directMatch;

  // Keyword analysis on description
  if (description) {
    const lower = description.toLowerCase();
    for (const route of KEYWORD_ROUTES) {
      if (route.keywords.some((kw) => lower.includes(kw))) {
        return route.group;
      }
    }
  }

  // Fallback
  return "ops";
}

/**
 * Get the count of queued + running tasks per agent group.
 * Useful for load balancing and monitoring.
 */
export async function getAgentGroupLoad(): Promise<Record<AgentGroup, number>> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("orchestrator_queue")
    .select("agent_group")
    .in("status", ["queued", "assigned", "running"]);

  const load: Record<AgentGroup, number> = {
    research: 0,
    content: 0,
    frontend: 0,
    integration: 0,
    data: 0,
    infra: 0,
    security: 0,
    qa: 0,
    ops: 0,
  };

  if (error || !data) return load;

  for (const row of data) {
    const group = row.agent_group as AgentGroup;
    if (group && group in load) {
      load[group]++;
    }
  }

  return load;
}

/**
 * Route with load-balancing awareness.
 * If the primary group is overloaded (many queued tasks compared to average),
 * attempt to route to an alternative group.
 */
export async function routeToAgentGroupWithLoadBalancing(
  category: string,
  description?: string
): Promise<AgentGroup> {
  const primary = routeToAgentGroup(category, description);

  try {
    const load = await getAgentGroupLoad();
    const totalLoad = Object.values(load).reduce((a, b) => a + b, 0);
    const avgLoad = totalLoad / ALL_AGENT_GROUPS.length;

    // If primary group is not overloaded, use it
    if (load[primary] <= avgLoad + OVERLOAD_THRESHOLD) {
      return primary;
    }

    // Try alternatives
    const alternatives = OVERFLOW_ALTERNATIVES[primary] ?? [];
    for (const alt of alternatives) {
      if (load[alt] < load[primary]) {
        return alt;
      }
    }
  } catch {
    // Load balancing is non-critical; fall back to primary
  }

  return primary;
}
