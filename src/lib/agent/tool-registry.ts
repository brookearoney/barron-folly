import type { AgentTool, AgentGroup, ToolRiskTier } from "@/lib/console/types";

// ─── Tool Registry ──────────────────────────────────────────────────────
// Defines all available tools organized by risk tier. Each tool specifies
// which agent groups can use it, at what risk levels, and with what limits.

const ALL_GROUPS: AgentGroup[] = [
  "research", "content", "frontend", "integration", "data", "infra", "security", "qa", "ops",
];

const READ_GROUPS: AgentGroup[] = [...ALL_GROUPS];
const WRITE_GROUPS: AgentGroup[] = ["content", "frontend", "integration", "data", "infra", "ops"];
const DEPLOY_GROUPS: AgentGroup[] = ["frontend", "infra", "ops"];
const ADMIN_GROUPS: AgentGroup[] = ["infra", "security", "ops"];

// ─── Safe Tools (read/analyze, no side effects) ─────────────────────────

const SAFE_TOOLS: AgentTool[] = [
  {
    id: "read_files",
    name: "Read Files",
    description: "Read source files and configuration from the project repository",
    category: "read",
    riskTier: "safe",
    requiredApproval: false,
    allowedAgentGroups: READ_GROUPS,
    allowedRiskLevels: ["low", "medium", "high"],
    timeout_ms: 10_000,
  },
  {
    id: "search_code",
    name: "Search Code",
    description: "Search the codebase using grep, AST queries, or symbol lookup",
    category: "read",
    riskTier: "safe",
    requiredApproval: false,
    allowedAgentGroups: READ_GROUPS,
    allowedRiskLevels: ["low", "medium", "high"],
    timeout_ms: 15_000,
  },
  {
    id: "analyze_data",
    name: "Analyze Data",
    description: "Run read-only analytics queries against reporting views",
    category: "analyze",
    riskTier: "safe",
    requiredApproval: false,
    allowedAgentGroups: READ_GROUPS,
    allowedRiskLevels: ["low", "medium", "high"],
    rateLimits: { maxPerHour: 100, maxPerDay: 500 },
    timeout_ms: 30_000,
  },
  {
    id: "read_database",
    name: "Read Database",
    description: "Execute read-only SELECT queries against the Supabase database",
    category: "read",
    riskTier: "safe",
    requiredApproval: false,
    allowedAgentGroups: READ_GROUPS,
    allowedRiskLevels: ["low", "medium", "high"],
    rateLimits: { maxPerHour: 200, maxPerDay: 1000 },
    timeout_ms: 15_000,
  },
  {
    id: "fetch_web_page",
    name: "Fetch Web Page",
    description: "Retrieve content from a public URL for research or scraping",
    category: "read",
    riskTier: "safe",
    requiredApproval: false,
    allowedAgentGroups: ["research", "content", "seo" as AgentGroup, "ops"],
    allowedRiskLevels: ["low", "medium", "high"],
    rateLimits: { maxPerHour: 60, maxPerDay: 300 },
    timeout_ms: 20_000,
  },
  {
    id: "lint_check",
    name: "Lint / Type Check",
    description: "Run linting and type checking without modifying files",
    category: "analyze",
    riskTier: "safe",
    requiredApproval: false,
    allowedAgentGroups: ["frontend", "qa", "ops", "integration"],
    allowedRiskLevels: ["low", "medium", "high"],
    timeout_ms: 60_000,
  },
  {
    id: "run_tests",
    name: "Run Tests",
    description: "Execute test suites in a sandboxed environment",
    category: "analyze",
    riskTier: "safe",
    requiredApproval: false,
    allowedAgentGroups: ["frontend", "qa", "ops", "integration"],
    allowedRiskLevels: ["low", "medium", "high"],
    timeout_ms: 120_000,
  },
  {
    id: "audit_security",
    name: "Audit Security",
    description: "Run dependency audit, secret scanning, or SAST analysis",
    category: "analyze",
    riskTier: "safe",
    requiredApproval: false,
    allowedAgentGroups: ["security", "qa", "ops", "infra"],
    allowedRiskLevels: ["low", "medium", "high"],
    timeout_ms: 60_000,
  },
];

// ─── Guarded Tools (write, but recoverable) ─────────────────────────────

const GUARDED_TOOLS: AgentTool[] = [
  {
    id: "write_files",
    name: "Write Files",
    description: "Create or modify source files in the repository",
    category: "write",
    riskTier: "guarded",
    requiredApproval: false,
    allowedAgentGroups: WRITE_GROUPS,
    allowedRiskLevels: ["low", "medium"],
    rateLimits: { maxPerHour: 50, maxPerDay: 200 },
    timeout_ms: 15_000,
  },
  {
    id: "create_branch",
    name: "Create Branch",
    description: "Create a new git branch for changes",
    category: "write",
    riskTier: "guarded",
    requiredApproval: false,
    allowedAgentGroups: WRITE_GROUPS,
    allowedRiskLevels: ["low", "medium"],
    rateLimits: { maxPerHour: 10, maxPerDay: 30 },
    timeout_ms: 15_000,
  },
  {
    id: "create_pr",
    name: "Create Pull Request",
    description: "Open a pull request for code review",
    category: "write",
    riskTier: "guarded",
    requiredApproval: false,
    allowedAgentGroups: WRITE_GROUPS,
    allowedRiskLevels: ["low", "medium"],
    rateLimits: { maxPerHour: 5, maxPerDay: 20 },
    timeout_ms: 20_000,
  },
  {
    id: "send_notification",
    name: "Send Notification",
    description: "Send an internal notification via Slack or in-app",
    category: "communicate",
    riskTier: "guarded",
    requiredApproval: false,
    allowedAgentGroups: ALL_GROUPS,
    allowedRiskLevels: ["low", "medium"],
    rateLimits: { maxPerHour: 20, maxPerDay: 100 },
    timeout_ms: 10_000,
  },
  {
    id: "create_linear_issue",
    name: "Create Linear Issue",
    description: "Create a new issue or sub-task in Linear",
    category: "write",
    riskTier: "guarded",
    requiredApproval: false,
    allowedAgentGroups: ALL_GROUPS,
    allowedRiskLevels: ["low", "medium"],
    rateLimits: { maxPerHour: 15, maxPerDay: 50 },
    timeout_ms: 15_000,
  },
  {
    id: "update_linear_issue",
    name: "Update Linear Issue",
    description: "Modify an existing Linear issue status, labels, or assignments",
    category: "write",
    riskTier: "guarded",
    requiredApproval: false,
    allowedAgentGroups: ALL_GROUPS,
    allowedRiskLevels: ["low", "medium"],
    rateLimits: { maxPerHour: 30, maxPerDay: 100 },
    timeout_ms: 10_000,
  },
  {
    id: "write_content",
    name: "Write Content",
    description: "Create or edit blog posts, copy, or documentation",
    category: "write",
    riskTier: "guarded",
    requiredApproval: false,
    allowedAgentGroups: ["content", "research", "ops"],
    allowedRiskLevels: ["low", "medium"],
    rateLimits: { maxPerHour: 20, maxPerDay: 80 },
    timeout_ms: 30_000,
  },
];

// ─── Elevated Tools (significant impact, partially reversible) ──────────

const ELEVATED_TOOLS: AgentTool[] = [
  {
    id: "modify_database",
    name: "Modify Database",
    description: "Execute INSERT, UPDATE, or non-destructive ALTER statements",
    category: "execute",
    riskTier: "elevated",
    requiredApproval: true,
    allowedAgentGroups: ["data", "infra", "ops"],
    allowedRiskLevels: ["low", "medium"],
    rateLimits: { maxPerHour: 10, maxPerDay: 30 },
    timeout_ms: 30_000,
  },
  {
    id: "deploy_staging",
    name: "Deploy to Staging",
    description: "Trigger a deployment to the staging/preview environment",
    category: "deploy",
    riskTier: "elevated",
    requiredApproval: false,
    allowedAgentGroups: DEPLOY_GROUPS,
    allowedRiskLevels: ["low", "medium"],
    rateLimits: { maxPerHour: 5, maxPerDay: 15 },
    timeout_ms: 300_000,
  },
  {
    id: "send_client_email",
    name: "Send Client Email",
    description: "Send an email to a client contact (approval summary, status update)",
    category: "communicate",
    riskTier: "elevated",
    requiredApproval: true,
    allowedAgentGroups: ["ops", "content"],
    allowedRiskLevels: ["low", "medium"],
    rateLimits: { maxPerHour: 5, maxPerDay: 20 },
    timeout_ms: 15_000,
  },
  {
    id: "modify_config",
    name: "Modify Configuration",
    description: "Update environment variables, feature flags, or runtime configs",
    category: "write",
    riskTier: "elevated",
    requiredApproval: true,
    allowedAgentGroups: ["infra", "ops"],
    allowedRiskLevels: ["low", "medium"],
    rateLimits: { maxPerHour: 5, maxPerDay: 10 },
    timeout_ms: 15_000,
  },
  {
    id: "run_migration",
    name: "Run Migration",
    description: "Apply a database migration to a non-production environment",
    category: "execute",
    riskTier: "elevated",
    requiredApproval: true,
    allowedAgentGroups: ["data", "infra", "ops"],
    allowedRiskLevels: ["low", "medium"],
    rateLimits: { maxPerHour: 3, maxPerDay: 10 },
    timeout_ms: 120_000,
  },
  {
    id: "manage_dns_staging",
    name: "Manage DNS (Staging)",
    description: "Create or update DNS records for non-production domains",
    category: "execute",
    riskTier: "elevated",
    requiredApproval: true,
    allowedAgentGroups: ["infra", "ops"],
    allowedRiskLevels: ["low", "medium"],
    rateLimits: { maxPerHour: 3, maxPerDay: 10 },
    timeout_ms: 30_000,
  },
];

// ─── Critical Tools (irreversible or high-impact) ───────────────────────

const CRITICAL_TOOLS: AgentTool[] = [
  {
    id: "deploy_production",
    name: "Deploy to Production",
    description: "Trigger a deployment to the production environment",
    category: "deploy",
    riskTier: "critical",
    requiredApproval: true,
    allowedAgentGroups: ["infra", "ops"],
    allowedRiskLevels: ["low"],
    rateLimits: { maxPerHour: 2, maxPerDay: 5 },
    timeout_ms: 600_000,
  },
  {
    id: "modify_auth",
    name: "Modify Auth / Permissions",
    description: "Change authentication settings, RLS policies, or user permissions",
    category: "execute",
    riskTier: "critical",
    requiredApproval: true,
    allowedAgentGroups: ["security", "infra"],
    allowedRiskLevels: ["low"],
    rateLimits: { maxPerHour: 3, maxPerDay: 5 },
    timeout_ms: 30_000,
  },
  {
    id: "delete_data",
    name: "Delete Data",
    description: "Execute DELETE or DROP statements against the database",
    category: "execute",
    riskTier: "critical",
    requiredApproval: true,
    allowedAgentGroups: ["data", "infra"],
    allowedRiskLevels: ["low"],
    rateLimits: { maxPerHour: 2, maxPerDay: 5 },
    timeout_ms: 30_000,
  },
  {
    id: "modify_billing",
    name: "Modify Billing",
    description: "Update Stripe subscriptions, pricing, or billing configurations",
    category: "execute",
    riskTier: "critical",
    requiredApproval: true,
    allowedAgentGroups: ["ops"],
    allowedRiskLevels: ["low"],
    rateLimits: { maxPerHour: 2, maxPerDay: 5 },
    timeout_ms: 30_000,
  },
  {
    id: "modify_secrets",
    name: "Modify Secrets",
    description: "Rotate, add, or remove API keys and secrets in the vault",
    category: "execute",
    riskTier: "critical",
    requiredApproval: true,
    allowedAgentGroups: ["security", "infra"],
    allowedRiskLevels: ["low"],
    rateLimits: { maxPerHour: 3, maxPerDay: 10 },
    timeout_ms: 15_000,
  },
  {
    id: "manage_dns_production",
    name: "Manage DNS (Production)",
    description: "Create or update DNS records for production domains",
    category: "deploy",
    riskTier: "critical",
    requiredApproval: true,
    allowedAgentGroups: ["infra"],
    allowedRiskLevels: ["low"],
    rateLimits: { maxPerHour: 2, maxPerDay: 5 },
    timeout_ms: 30_000,
  },
  {
    id: "rollback_production",
    name: "Rollback Production",
    description: "Roll back the production deployment to a previous version",
    category: "deploy",
    riskTier: "critical",
    requiredApproval: true,
    allowedAgentGroups: ["infra", "ops"],
    allowedRiskLevels: ["low", "medium"],
    rateLimits: { maxPerHour: 3, maxPerDay: 5 },
    timeout_ms: 300_000,
  },
];

// ─── Registry ───────────────────────────────────────────────────────────

const ALL_TOOLS: AgentTool[] = [
  ...SAFE_TOOLS,
  ...GUARDED_TOOLS,
  ...ELEVATED_TOOLS,
  ...CRITICAL_TOOLS,
];

/** In-memory index by tool ID */
const TOOL_INDEX = new Map<string, AgentTool>(
  ALL_TOOLS.map((t) => [t.id, t])
);

/** In-memory index by risk tier */
const TIER_INDEX = new Map<ToolRiskTier, AgentTool[]>();
for (const tool of ALL_TOOLS) {
  const list = TIER_INDEX.get(tool.riskTier) ?? [];
  list.push(tool);
  TIER_INDEX.set(tool.riskTier, list);
}

// ─── Public API ─────────────────────────────────────────────────────────

/** Get a single tool by its ID. Returns undefined if not found. */
export function getTool(toolId: string): AgentTool | undefined {
  return TOOL_INDEX.get(toolId);
}

/** Get all registered tools. */
export function getAllTools(): AgentTool[] {
  return [...ALL_TOOLS];
}

/** Get tools filtered by risk tier. */
export function getToolsByRiskTier(riskTier: ToolRiskTier): AgentTool[] {
  return [...(TIER_INDEX.get(riskTier) ?? [])];
}

/** Get tools available to a specific agent group. */
export function getToolsForAgentGroup(group: AgentGroup): AgentTool[] {
  return ALL_TOOLS.filter((t) => t.allowedAgentGroups.includes(group));
}

/** Get tools available to a specific agent group at a given risk level. */
export function getAccessibleTools(group: AgentGroup, riskLevel: import("@/lib/console/types").RiskLevel): AgentTool[] {
  return ALL_TOOLS.filter(
    (t) =>
      t.allowedAgentGroups.includes(group) &&
      t.allowedRiskLevels.includes(riskLevel)
  );
}

/** Check whether a specific tool is accessible to a group at a risk level. */
export function isToolAccessible(
  toolId: string,
  group: AgentGroup,
  riskLevel: import("@/lib/console/types").RiskLevel
): boolean {
  const tool = TOOL_INDEX.get(toolId);
  if (!tool) return false;
  return tool.allowedAgentGroups.includes(group) && tool.allowedRiskLevels.includes(riskLevel);
}

/** Get count of tools per risk tier (useful for dashboard stats). */
export function getToolCountsByRiskTier(): Record<ToolRiskTier, number> {
  return {
    safe: TIER_INDEX.get("safe")?.length ?? 0,
    guarded: TIER_INDEX.get("guarded")?.length ?? 0,
    elevated: TIER_INDEX.get("elevated")?.length ?? 0,
    critical: TIER_INDEX.get("critical")?.length ?? 0,
  };
}
