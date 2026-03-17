import type { AgentGroup, GroupCapabilityProfile, RiskLevel } from "@/lib/console/types";

// ─── Agent Group Capability Profiles ────────────────────────────────────
// Defines what each of the 9 agent groups can do, which tools they have
// by default, which additional tools unlock at each risk level, and
// escalation paths.

const CAPABILITY_PROFILES: Record<AgentGroup, GroupCapabilityProfile> = {
  // ── Research ──────────────────────────────────────────────────────────
  // Pure research and analysis. Read everything, write nothing.
  research: {
    group: "research",
    defaultTools: [
      "read_files",
      "search_code",
      "analyze_data",
      "read_database",
      "fetch_web_page",
    ],
    riskLevelTools: {
      low: ["audit_security"],
      medium: [],
      high: [],
    },
    maxConcurrentTools: 5,
    requiresHumanReview: "high",
    canEscalateTo: ["content", "data", "ops"],
  },

  // ── Content ───────────────────────────────────────────────────────────
  // Reads + writes content. Cannot deploy or touch databases.
  content: {
    group: "content",
    defaultTools: [
      "read_files",
      "search_code",
      "analyze_data",
      "read_database",
      "fetch_web_page",
      "write_content",
      "create_linear_issue",
      "update_linear_issue",
      "send_notification",
    ],
    riskLevelTools: {
      low: ["write_files", "create_branch", "create_pr"],
      medium: ["send_client_email"],
      high: [],
    },
    maxConcurrentTools: 4,
    requiresHumanReview: "medium",
    canEscalateTo: ["research", "frontend", "ops"],
  },

  // ── Frontend ──────────────────────────────────────────────────────────
  // Full read/write/deploy-staging cycle. Cannot touch production directly.
  frontend: {
    group: "frontend",
    defaultTools: [
      "read_files",
      "search_code",
      "analyze_data",
      "read_database",
      "write_files",
      "create_branch",
      "create_pr",
      "create_linear_issue",
      "update_linear_issue",
      "send_notification",
      "lint_check",
      "run_tests",
    ],
    riskLevelTools: {
      low: ["deploy_staging"],
      medium: [],
      high: [],
    },
    maxConcurrentTools: 6,
    requiresHumanReview: "medium",
    canEscalateTo: ["qa", "infra", "ops"],
  },

  // ── Integration ───────────────────────────────────────────────────────
  // Connects external systems. Careful with writes.
  integration: {
    group: "integration",
    defaultTools: [
      "read_files",
      "search_code",
      "analyze_data",
      "read_database",
      "fetch_web_page",
      "write_files",
      "create_branch",
      "create_pr",
      "create_linear_issue",
      "update_linear_issue",
      "send_notification",
      "lint_check",
      "run_tests",
    ],
    riskLevelTools: {
      low: ["modify_config"],
      medium: [],
      high: [],
    },
    maxConcurrentTools: 5,
    requiresHumanReview: "medium",
    canEscalateTo: ["infra", "security", "ops"],
  },

  // ── Data ──────────────────────────────────────────────────────────────
  // Analytics and database operations.
  data: {
    group: "data",
    defaultTools: [
      "read_files",
      "search_code",
      "analyze_data",
      "read_database",
      "create_linear_issue",
      "update_linear_issue",
      "send_notification",
    ],
    riskLevelTools: {
      low: ["modify_database", "run_migration", "write_files", "create_branch", "create_pr"],
      medium: [],
      high: [],
    },
    maxConcurrentTools: 4,
    requiresHumanReview: "medium",
    canEscalateTo: ["research", "infra", "ops"],
  },

  // ── Infra ─────────────────────────────────────────────────────────────
  // Full infrastructure access including production deploys (with approval).
  infra: {
    group: "infra",
    defaultTools: [
      "read_files",
      "search_code",
      "analyze_data",
      "read_database",
      "write_files",
      "create_branch",
      "create_pr",
      "create_linear_issue",
      "update_linear_issue",
      "send_notification",
      "lint_check",
      "run_tests",
      "audit_security",
    ],
    riskLevelTools: {
      low: [
        "modify_database",
        "deploy_staging",
        "modify_config",
        "run_migration",
        "manage_dns_staging",
        "deploy_production",
        "modify_auth",
        "delete_data",
        "modify_secrets",
        "manage_dns_production",
        "rollback_production",
      ],
      medium: [
        "deploy_staging",
        "modify_config",
        "run_migration",
        "manage_dns_staging",
        "rollback_production",
      ],
      high: [],
    },
    maxConcurrentTools: 8,
    requiresHumanReview: "high",
    canEscalateTo: ["security", "ops"],
  },

  // ── Security ──────────────────────────────────────────────────────────
  // Full read + audit access. Cannot write without approval.
  security: {
    group: "security",
    defaultTools: [
      "read_files",
      "search_code",
      "analyze_data",
      "read_database",
      "audit_security",
      "create_linear_issue",
      "update_linear_issue",
      "send_notification",
    ],
    riskLevelTools: {
      low: ["modify_auth", "modify_secrets", "write_files", "create_branch", "create_pr"],
      medium: [],
      high: [],
    },
    maxConcurrentTools: 4,
    requiresHumanReview: "medium",
    canEscalateTo: ["infra", "ops"],
  },

  // ── QA ────────────────────────────────────────────────────────────────
  // Testing and quality. Read + run tests + report.
  qa: {
    group: "qa",
    defaultTools: [
      "read_files",
      "search_code",
      "analyze_data",
      "read_database",
      "lint_check",
      "run_tests",
      "audit_security",
      "create_linear_issue",
      "update_linear_issue",
      "send_notification",
    ],
    riskLevelTools: {
      low: ["write_files", "create_branch", "create_pr"],
      medium: [],
      high: [],
    },
    maxConcurrentTools: 5,
    requiresHumanReview: "medium",
    canEscalateTo: ["frontend", "ops"],
  },

  // ── Ops ───────────────────────────────────────────────────────────────
  // General operations. Broad access, acts as fallback for other groups.
  ops: {
    group: "ops",
    defaultTools: [
      "read_files",
      "search_code",
      "analyze_data",
      "read_database",
      "write_files",
      "create_branch",
      "create_pr",
      "create_linear_issue",
      "update_linear_issue",
      "send_notification",
      "write_content",
      "lint_check",
      "run_tests",
    ],
    riskLevelTools: {
      low: [
        "deploy_staging",
        "send_client_email",
        "modify_config",
        "deploy_production",
        "modify_billing",
        "rollback_production",
      ],
      medium: [
        "deploy_staging",
        "send_client_email",
        "rollback_production",
      ],
      high: [],
    },
    maxConcurrentTools: 8,
    requiresHumanReview: "high",
    canEscalateTo: ["infra", "security"],
  },
};

// ─── Public API ─────────────────────────────────────────────────────────

/** Get the capability profile for an agent group. */
export function getGroupCapabilities(group: AgentGroup): GroupCapabilityProfile {
  return CAPABILITY_PROFILES[group];
}

/** Get all capability profiles. */
export function getAllGroupCapabilities(): GroupCapabilityProfile[] {
  return Object.values(CAPABILITY_PROFILES);
}

/** Get the full set of tool IDs available to a group at a given risk level. */
export function getAvailableToolIds(group: AgentGroup, riskLevel: RiskLevel): string[] {
  const profile = CAPABILITY_PROFILES[group];
  const toolSet = new Set<string>(profile.defaultTools);

  // Add risk-level-specific tools
  const riskTools = profile.riskLevelTools[riskLevel] ?? [];
  for (const toolId of riskTools) {
    toolSet.add(toolId);
  }

  return [...toolSet];
}

/** Check if a group can use a specific tool at a given risk level. */
export function canGroupUseTool(group: AgentGroup, toolId: string, riskLevel: RiskLevel): boolean {
  const available = getAvailableToolIds(group, riskLevel);
  return available.includes(toolId);
}

/** Check if human review is required for this group at the given risk level. */
export function requiresHumanReview(group: AgentGroup, riskLevel: RiskLevel): boolean {
  const profile = CAPABILITY_PROFILES[group];
  const RISK_ORDER: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 };
  return RISK_ORDER[riskLevel] >= RISK_ORDER[profile.requiresHumanReview];
}

/** Get the groups that a given group can escalate work to. */
export function getEscalationTargets(group: AgentGroup): AgentGroup[] {
  return [...CAPABILITY_PROFILES[group].canEscalateTo];
}

/** Get the maximum number of concurrent tools for a group. */
export function getMaxConcurrentTools(group: AgentGroup): number {
  return CAPABILITY_PROFILES[group].maxConcurrentTools;
}
