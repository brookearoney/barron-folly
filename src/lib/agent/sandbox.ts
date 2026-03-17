import type { AgentGroup, RiskLevel, SandboxConfig, ToolRiskTier } from "@/lib/console/types";

// ─── Execution Sandbox ──────────────────────────────────────────────────
// Provides resource isolation configs for tool execution. Higher risk
// tools get tighter restrictions and more extensive logging.

// ─── Base configs per risk tier ─────────────────────────────────────────

const SANDBOX_CONFIGS: Record<ToolRiskTier, SandboxConfig> = {
  safe: {
    maxExecutionTime_ms: 120_000,    // 2 minutes
    maxMemoryMB: 256,
    allowedEnvironments: ["staging", "preview", "development"],
    networkAccess: true,
    fileSystemAccess: "read",
  },
  guarded: {
    maxExecutionTime_ms: 60_000,     // 1 minute
    maxMemoryMB: 512,
    allowedEnvironments: ["staging", "preview", "development"],
    networkAccess: true,
    fileSystemAccess: "readwrite",
  },
  elevated: {
    maxExecutionTime_ms: 300_000,    // 5 minutes
    maxMemoryMB: 1024,
    allowedEnvironments: ["staging", "preview"],
    networkAccess: true,
    fileSystemAccess: "readwrite",
  },
  critical: {
    maxExecutionTime_ms: 600_000,    // 10 minutes
    maxMemoryMB: 2048,
    allowedEnvironments: ["production", "staging"],
    networkAccess: true,
    fileSystemAccess: "readwrite",
  },
};

// ─── Risk-level overrides ───────────────────────────────────────────────
// At higher risk levels, we tighten sandbox constraints regardless of
// the tool's own risk tier.

const RISK_LEVEL_OVERRIDES: Record<RiskLevel, Partial<SandboxConfig>> = {
  low: {},
  medium: {
    maxExecutionTime_ms: 60_000,
    allowedEnvironments: ["staging", "preview", "development"],
  },
  high: {
    maxExecutionTime_ms: 30_000,
    maxMemoryMB: 256,
    allowedEnvironments: ["preview", "development"],
    networkAccess: false,
    fileSystemAccess: "read",
  },
};

// ─── Group-level adjustments ────────────────────────────────────────────
// Certain agent groups get expanded or restricted access.

const GROUP_ENVIRONMENT_EXPANSIONS: Partial<Record<AgentGroup, string[]>> = {
  infra: ["production", "staging", "preview", "development"],
  ops: ["production", "staging", "preview", "development"],
};

const GROUP_FILESYSTEM_RESTRICTIONS: Partial<Record<AgentGroup, SandboxConfig["fileSystemAccess"]>> = {
  research: "read",
  security: "read",
  qa: "read",
};

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Create a sandbox configuration appropriate for the given tool risk tier,
 * task risk level, and agent group. Applies layered overrides:
 * 1. Base config from tool risk tier
 * 2. Risk-level overrides (tighten for higher risk tasks)
 * 3. Agent-group adjustments (expand infra, restrict research)
 */
export function createSandbox(
  toolRiskTier: ToolRiskTier,
  riskLevel: RiskLevel,
  agentGroup: AgentGroup
): SandboxConfig {
  // Start with base config for the tool's risk tier
  const base = { ...SANDBOX_CONFIGS[toolRiskTier] };

  // Apply risk-level overrides (these tighten, never loosen)
  const riskOverride = RISK_LEVEL_OVERRIDES[riskLevel];
  if (riskOverride.maxExecutionTime_ms !== undefined) {
    base.maxExecutionTime_ms = Math.min(base.maxExecutionTime_ms, riskOverride.maxExecutionTime_ms);
  }
  if (riskOverride.maxMemoryMB !== undefined) {
    base.maxMemoryMB = Math.min(base.maxMemoryMB, riskOverride.maxMemoryMB);
  }
  if (riskOverride.allowedEnvironments !== undefined) {
    // Intersect: only keep environments allowed by both
    base.allowedEnvironments = base.allowedEnvironments.filter(
      (env) => riskOverride.allowedEnvironments!.includes(env)
    );
  }
  if (riskOverride.networkAccess !== undefined && !riskOverride.networkAccess) {
    base.networkAccess = false;
  }
  if (riskOverride.fileSystemAccess !== undefined) {
    base.fileSystemAccess = restrictFileAccess(base.fileSystemAccess, riskOverride.fileSystemAccess);
  }

  // Apply group-level environment expansions (only for low-risk tasks)
  if (riskLevel === "low" && GROUP_ENVIRONMENT_EXPANSIONS[agentGroup]) {
    const expanded = GROUP_ENVIRONMENT_EXPANSIONS[agentGroup]!;
    // Union with base environments
    const envSet = new Set([...base.allowedEnvironments, ...expanded]);
    base.allowedEnvironments = [...envSet];
  }

  // Apply group-level filesystem restrictions
  const groupRestriction = GROUP_FILESYSTEM_RESTRICTIONS[agentGroup];
  if (groupRestriction) {
    base.fileSystemAccess = restrictFileAccess(base.fileSystemAccess, groupRestriction);
  }

  return base;
}

/**
 * Validate that a requested environment is allowed by the sandbox config.
 */
export function isEnvironmentAllowed(sandbox: SandboxConfig, environment: string): boolean {
  return sandbox.allowedEnvironments.includes(environment);
}

/**
 * Get the base sandbox config for a given tool risk tier (useful for display).
 */
export function getBaseSandboxConfig(toolRiskTier: ToolRiskTier): SandboxConfig {
  return { ...SANDBOX_CONFIGS[toolRiskTier] };
}

// ─── Helpers ────────────────────────────────────────────────────────────

const FS_ACCESS_ORDER: Record<SandboxConfig["fileSystemAccess"], number> = {
  none: 0,
  read: 1,
  readwrite: 2,
};

/** Return the more restrictive of two file access levels. */
function restrictFileAccess(
  a: SandboxConfig["fileSystemAccess"],
  b: SandboxConfig["fileSystemAccess"]
): SandboxConfig["fileSystemAccess"] {
  return FS_ACCESS_ORDER[a] <= FS_ACCESS_ORDER[b] ? a : b;
}
