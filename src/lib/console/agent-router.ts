import type { AgentGroup } from "./types";

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
