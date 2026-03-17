import { createAdminClient } from "@/lib/supabase/admin";
import type { ClientPolicy, Tier, RequestCategory, RiskLevel } from "./types";

// ─── Fetch Policy ────────────────────────────────────────────────────────

export async function getClientPolicy(orgId: string): Promise<ClientPolicy | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("client_policies")
    .select("*")
    .eq("organization_id", orgId)
    .single();

  if (error || !data) return null;
  return data as ClientPolicy;
}

// ─── Upsert Policy ──────────────────────────────────────────────────────

export async function upsertClientPolicy(
  orgId: string,
  policy: Partial<ClientPolicy>
): Promise<ClientPolicy> {
  const admin = createAdminClient();

  const payload = {
    ...policy,
    organization_id: orgId,
    updated_at: new Date().toISOString(),
  };

  // Remove id from payload to let Supabase handle it
  delete payload.id;

  const { data, error } = await admin
    .from("client_policies")
    .upsert(payload, { onConflict: "organization_id" })
    .select()
    .single();

  if (error) throw error;
  return data as ClientPolicy;
}

// ─── Default Policies Per Tier ───────────────────────────────────────────

export function getDefaultPolicyForTier(tier: Tier): Partial<ClientPolicy> {
  const base: Partial<ClientPolicy> = {
    allowed_categories: [],
    blocked_categories: [],
    allowed_environments: ["staging"],
    risk_level: "medium",
    regulated: false,
    auto_approve_categories: [],
    code_conventions: {},
    do_not_do: [],
    prod_change_blackout_hours: null,
  };

  switch (tier) {
    case "copper":
      return {
        ...base,
        requires_human_approval_above: "low",
        max_concurrent_agent_tasks: 2,
        autopilot_enabled: true,
        autopilot_categories: ["content", "seo"],
        allowed_environments: ["staging"],
      };

    case "steel":
      return {
        ...base,
        requires_human_approval_above: "medium",
        max_concurrent_agent_tasks: 4,
        autopilot_enabled: true,
        autopilot_categories: ["content", "seo", "brand", "design_system"],
        allowed_environments: ["staging", "preview"],
      };

    case "titanium":
      return {
        ...base,
        requires_human_approval_above: "medium",
        max_concurrent_agent_tasks: 6,
        autopilot_enabled: true,
        autopilot_categories: ["content", "seo", "brand"],
        allowed_environments: ["staging", "preview"],
      };

    case "tungsten":
      return {
        ...base,
        requires_human_approval_above: "low",
        max_concurrent_agent_tasks: 10,
        autopilot_enabled: true,
        autopilot_categories: ["content", "seo"],
        allowed_environments: ["staging", "preview", "production"],
      };

    default:
      return base;
  }
}

// ─── Policy Compliance Check ─────────────────────────────────────────────

const RISK_LEVEL_ORDER: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export function checkPolicyCompliance(
  policy: ClientPolicy,
  action: { category: RequestCategory; riskLevel: RiskLevel; environment: string }
): { allowed: boolean; reason?: string; requiresApproval: boolean } {
  // Check blocked categories
  if (policy.blocked_categories.length > 0 && policy.blocked_categories.includes(action.category)) {
    return {
      allowed: false,
      reason: `Category "${action.category}" is blocked by client policy.`,
      requiresApproval: false,
    };
  }

  // Check allowed categories (if specified, acts as whitelist)
  if (
    policy.allowed_categories.length > 0 &&
    !policy.allowed_categories.includes(action.category)
  ) {
    return {
      allowed: false,
      reason: `Category "${action.category}" is not in the allowed list.`,
      requiresApproval: false,
    };
  }

  // Check allowed environments
  if (!policy.allowed_environments.includes(action.environment)) {
    return {
      allowed: false,
      reason: `Environment "${action.environment}" is not allowed. Permitted: ${policy.allowed_environments.join(", ")}.`,
      requiresApproval: false,
    };
  }

  // Check blackout hours
  if (policy.prod_change_blackout_hours && action.environment === "production") {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const { start, end } = policy.prod_change_blackout_hours;

    const inBlackout =
      start <= end
        ? currentHour >= start && currentHour < end
        : currentHour >= start || currentHour < end;

    if (inBlackout) {
      return {
        allowed: false,
        reason: `Production changes are blocked during blackout hours (${start}:00 - ${end}:00 UTC).`,
        requiresApproval: false,
      };
    }
  }

  // Check if auto-approved
  if (policy.auto_approve_categories.includes(action.category)) {
    return { allowed: true, requiresApproval: false };
  }

  // Check approval threshold
  const actionLevel = RISK_LEVEL_ORDER[action.riskLevel];
  const thresholdLevel = RISK_LEVEL_ORDER[policy.requires_human_approval_above];
  const requiresApproval = actionLevel >= thresholdLevel;

  return { allowed: true, requiresApproval };
}
