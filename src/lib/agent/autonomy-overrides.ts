import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AutonomyLevel,
  AutonomyDecision,
  AutonomyOverride,
} from "@/lib/console/types";

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

// ─── Get Active Overrides ────────────────────────────────────────────────

export async function getActiveOverrides(
  orgId: string,
  category?: string,
  taskId?: string
): Promise<AutonomyOverride[]> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  let query = admin
    .from("autonomy_overrides")
    .select("*")
    .eq("organization_id", orgId)
    .eq("active", true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch autonomy overrides: ${error.message}`);
  }

  const overrides = (data ?? []) as AutonomyOverride[];

  // Filter by scope relevance
  return overrides.filter((o) => {
    switch (o.scope) {
      case "org":
        return true; // org-level overrides always apply
      case "category":
        return category != null && o.scope_value === category;
      case "task":
        return taskId != null && o.scope_value === taskId;
      default:
        return false;
    }
  });
}

// ─── Create Override ─────────────────────────────────────────────────────

export async function createOverride(
  override: Omit<AutonomyOverride, "id" | "created_at">
): Promise<AutonomyOverride> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("autonomy_overrides")
    .insert({
      organization_id: override.organization_id,
      scope: override.scope,
      scope_value: override.scope_value,
      max_autonomy_level: override.max_autonomy_level,
      reason: override.reason,
      created_by: override.created_by,
      expires_at: override.expires_at,
      active: override.active,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create autonomy override: ${error?.message}`);
  }

  return data as AutonomyOverride;
}

// ─── Deactivate Override ─────────────────────────────────────────────────

export async function deactivateOverride(overrideId: string): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("autonomy_overrides")
    .update({ active: false })
    .eq("id", overrideId);

  if (error) {
    throw new Error(`Failed to deactivate override: ${error.message}`);
  }
}

// ─── Apply Overrides to Decision ─────────────────────────────────────────

export function applyOverrides(
  decision: AutonomyDecision,
  overrides: AutonomyOverride[]
): AutonomyDecision {
  if (overrides.length === 0) return decision;

  // Find the most restrictive override (lowest max_autonomy_level)
  let mostRestrictiveLevel = decision.level;
  const overrideReasons: string[] = [];

  for (const override of overrides) {
    const overrideOrder = AUTONOMY_ORDER[override.max_autonomy_level];
    const currentOrder = AUTONOMY_ORDER[mostRestrictiveLevel];

    if (overrideOrder < currentOrder) {
      mostRestrictiveLevel = override.max_autonomy_level;
      overrideReasons.push(
        `Override (${override.scope}${override.scope_value ? `: ${override.scope_value}` : ""}): capped at ${override.max_autonomy_level} - ${override.reason}`
      );
    }
  }

  // If no override was more restrictive, return original
  if (mostRestrictiveLevel === decision.level) {
    return decision;
  }

  // Determine new approval requirements based on reduced level
  let requiresApproval = decision.requiresApproval;
  let approvalType = decision.approvalType;

  if (mostRestrictiveLevel === "suggest") {
    requiresApproval = true;
    approvalType = approvalType ?? "standard";
  } else if (mostRestrictiveLevel === "auto_draft") {
    requiresApproval = true;
    approvalType = "client_preview";
  }

  return {
    ...decision,
    level: mostRestrictiveLevel,
    requiresApproval,
    approvalType,
    reasoning: [...decision.reasoning, ...overrideReasons],
  };
}

// ─── List All Overrides for an Org ───────────────────────────────────────

export async function listOverrides(
  orgId: string,
  includeInactive = false
): Promise<AutonomyOverride[]> {
  const admin = createAdminClient();

  let query = admin
    .from("autonomy_overrides")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list overrides: ${error.message}`);
  }

  return (data ?? []) as AutonomyOverride[];
}
