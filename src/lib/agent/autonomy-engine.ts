import { TIER_CONFIG } from "@/lib/stripe/tiers";
import type {
  Tier,
  RequestCategory,
  RiskLevel,
  AgentGroup,
  ClientPolicy,
  ApprovalType,
  AutonomyLevel,
  AutonomyDecision,
} from "@/lib/console/types";
import { calculateConfidence } from "./confidence";
import { getActiveOverrides, applyOverrides } from "./autonomy-overrides";

// ─── Autonomy Level Ordering ─────────────────────────────────────────────

const AUTONOMY_ORDER: Record<AutonomyLevel, number> = {
  suggest: 0,
  auto_draft: 1,
  auto_execute: 2,
  full_auto: 3,
};

const AUTONOMY_LEVELS: AutonomyLevel[] = [
  "suggest",
  "auto_draft",
  "auto_execute",
  "full_auto",
];

// ─── Tier Trust Levels ───────────────────────────────────────────────────

const TIER_TRUST: Record<Tier, number> = {
  copper: 0.3,
  steel: 0.5,
  titanium: 0.7,
  tungsten: 0.9,
};

// ─── Tool Restrictions by Autonomy Level ─────────────────────────────────

const TOOLS_BY_LEVEL: Record<AutonomyLevel, string[]> = {
  suggest: ["read", "analyze"],
  auto_draft: ["read", "analyze", "write", "communicate"],
  auto_execute: ["read", "analyze", "write", "communicate", "execute"],
  full_auto: ["read", "analyze", "write", "communicate", "execute", "deploy"],
};

// ─── Restrictions by Autonomy Level ──────────────────────────────────────

const RESTRICTIONS_BY_LEVEL: Record<AutonomyLevel, string[]> = {
  suggest: [
    "Must not execute any actions",
    "Must not modify any data",
    "Must not communicate with clients",
    "Must present proposal for human review",
  ],
  auto_draft: [
    "Must not deploy to any environment",
    "Must not modify production data",
    "Must hold output for review before delivery",
  ],
  auto_execute: [
    "Must not deploy to production",
    "Must not modify database schemas",
    "Must notify human after execution",
  ],
  full_auto: [
    "Must not modify billing or payment systems",
    "Must surface failures immediately",
  ],
};

// ─── Core Decision Engine ────────────────────────────────────────────────

interface DetermineAutonomyParams {
  orgId: string;
  tier: Tier;
  category: RequestCategory;
  riskLevel: RiskLevel;
  riskScore: number;
  complexity: "simple" | "moderate" | "complex";
  agentGroup: AgentGroup;
  hasHistoricalSuccess: boolean;
  policy: ClientPolicy;
}

export function determineAutonomy(params: DetermineAutonomyParams): AutonomyDecision {
  const {
    tier,
    category,
    riskLevel,
    riskScore,
    complexity,
    hasHistoricalSuccess,
    policy,
  } = params;

  const reasoning: string[] = [];
  let level: AutonomyLevel = "suggest";

  const tierConfig = TIER_CONFIG[tier];
  const isAutopilotCategory = policy.autopilot_enabled && policy.autopilot_categories.includes(category);
  const isAutoApproveCategory = policy.auto_approve_categories.includes(category);

  // ── Step 1: Determine base autonomy level ──────────────────────────────

  // Full Auto: Tungsten + low risk + autopilot category + historical success
  if (
    tier === "tungsten" &&
    riskLevel === "low" &&
    isAutopilotCategory &&
    hasHistoricalSuccess
  ) {
    level = "full_auto";
    reasoning.push("Tungsten tier with low risk, autopilot category, and proven track record");
  }
  // Auto Execute: Titanium+ + low/medium risk + autopilot category
  else if (
    AUTONOMY_ORDER[tierToMinAutoExecute(tier)] >= 0 &&
    (tier === "titanium" || tier === "tungsten") &&
    (riskLevel === "low" || riskLevel === "medium") &&
    isAutopilotCategory
  ) {
    level = "auto_execute";
    reasoning.push(`${tierConfig.name} tier with ${riskLevel} risk in autopilot category`);
  }
  // Auto Draft: Steel+ + low risk + auto_approve, OR any tier + content/seo + low risk
  else if (
    (["steel", "titanium", "tungsten"].includes(tier) &&
      riskLevel === "low" &&
      isAutoApproveCategory)
  ) {
    level = "auto_draft";
    reasoning.push(`${tierConfig.name} tier with low risk in auto-approve category`);
  } else if (
    (category === "content" || category === "seo") &&
    riskLevel === "low"
  ) {
    level = "auto_draft";
    reasoning.push(`Low-risk ${category} task eligible for auto-draft`);
  }
  // Suggest: Default
  else {
    level = "suggest";
    reasoning.push("Default safe mode: human review required");
  }

  // ── Step 2: Apply constraints that cap or reduce autonomy ──────────────

  // Risk score > 65 always caps at suggest
  if (riskScore > 65) {
    if (AUTONOMY_ORDER[level] > AUTONOMY_ORDER["suggest"]) {
      level = "suggest";
      reasoning.push(`High risk score (${riskScore}) caps autonomy at suggest`);
    }
  }

  // Regulated orgs cap at auto_draft
  if (policy.regulated) {
    if (AUTONOMY_ORDER[level] > AUTONOMY_ORDER["auto_draft"]) {
      level = "auto_draft";
      reasoning.push("Regulated organization caps autonomy at auto_draft");
    }
  }

  // Complex tasks drop one autonomy level
  if (complexity === "complex" && AUTONOMY_ORDER[level] > 0) {
    const newIndex = AUTONOMY_ORDER[level] - 1;
    level = AUTONOMY_LEVELS[newIndex];
    reasoning.push("Complex task reduces autonomy by one level");
  }

  // If autopilot is disabled globally, cap at suggest
  if (!policy.autopilot_enabled && AUTONOMY_ORDER[level] > AUTONOMY_ORDER["suggest"]) {
    level = "suggest";
    reasoning.push("Autopilot disabled for this organization");
  }

  // ── Step 3: Determine approval requirements ───────────────────────────

  let requiresApproval = false;
  let approvalType: ApprovalType | undefined;

  if (level === "suggest") {
    requiresApproval = true;
    approvalType = riskLevel === "high" ? "architecture" : "standard";
    reasoning.push(`Approval required: ${approvalType}`);
  } else if (level === "auto_draft") {
    requiresApproval = true;
    approvalType = "client_preview";
    reasoning.push("Draft held for client preview approval");
  }

  // ── Step 4: Check for escalation needs ─────────────────────────────────

  let escalationNeeded = false;
  let escalationReason: string | undefined;

  if (riskScore > 80) {
    escalationNeeded = true;
    escalationReason = `Very high risk score (${riskScore}) requires immediate attention`;
    reasoning.push("Escalation flagged due to very high risk score");
  }

  if (!hasHistoricalSuccess && AUTONOMY_ORDER[level] >= AUTONOMY_ORDER["auto_execute"]) {
    escalationNeeded = true;
    escalationReason = "No historical success in this category for auto-execute or higher";
    reasoning.push("Escalation flagged: no proven success history for elevated autonomy");
  }

  // ── Step 5: Compute confidence ─────────────────────────────────────────

  const tierTrust = TIER_TRUST[tier];
  const confidence = calculateConfidence({
    historicalSuccessRate: hasHistoricalSuccess ? 0.85 : 0.3,
    taskSimilarity: hasHistoricalSuccess ? 0.7 : 0.4,
    riskScore,
    tierTrust,
    categoryFamiliarity: isAutopilotCategory ? 0.8 : 0.4,
    policyAlignment: isAutopilotCategory || isAutoApproveCategory ? 0.9 : 0.5,
  });

  // Low confidence drops autonomy
  if (confidence < 0.4 && AUTONOMY_ORDER[level] > AUTONOMY_ORDER["suggest"]) {
    level = "suggest";
    reasoning.push(`Low confidence (${(confidence * 100).toFixed(0)}%) drops autonomy to suggest`);
    requiresApproval = true;
    approvalType = "standard";
  }

  // ── Step 6: Build restrictions and tools ───────────────────────────────

  const restrictions = [...RESTRICTIONS_BY_LEVEL[level]];
  const allowedTools = [...TOOLS_BY_LEVEL[level]];

  // Add policy do_not_do as restrictions
  if (policy.do_not_do.length > 0) {
    restrictions.push(...policy.do_not_do);
  }

  return {
    level,
    confidence,
    reasoning,
    requiresApproval,
    approvalType,
    escalationNeeded,
    escalationReason,
    restrictions,
    allowedTools,
  };
}

// ─── Full Autonomy Pipeline (with overrides) ─────────────────────────────

export async function resolveAutonomy(params: DetermineAutonomyParams & {
  taskId?: string;
}): Promise<AutonomyDecision> {
  // 1. Get base decision
  const baseDecision = determineAutonomy(params);

  // 2. Fetch active overrides
  const overrides = await getActiveOverrides(
    params.orgId,
    params.category,
    params.taskId
  );

  // 3. Apply overrides
  if (overrides.length > 0) {
    return applyOverrides(baseDecision, overrides);
  }

  return baseDecision;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function tierToMinAutoExecute(_tier: Tier): AutonomyLevel {
  return "suggest"; // helper for readability, actual logic is inline
}
