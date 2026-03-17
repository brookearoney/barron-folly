import { createAdminClient } from "@/lib/supabase/admin";
import { TIER_CONFIG, type TierEntitlements } from "@/lib/stripe/tiers";
import type { Tier, RequestCategory, Organization } from "./types";

// ─── Check Request Entitlement ──────────────────────────────────────────

export async function checkRequestEntitlement(orgId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentUsage: { monthlyRequests: number; activeParallelTasks: number };
  limits: { maxMonthlyRequests: number | null; maxParallelTasks: number };
}> {
  const admin = createAdminClient();

  // Get org tier
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id, tier")
    .eq("id", orgId)
    .single();

  if (orgError || !org) {
    return {
      allowed: false,
      reason: "Organization not found",
      currentUsage: { monthlyRequests: 0, activeParallelTasks: 0 },
      limits: { maxMonthlyRequests: 0, maxParallelTasks: 0 },
    };
  }

  const tier = (org as unknown as Pick<Organization, "id" | "tier">).tier;
  const config = TIER_CONFIG[tier];

  // Count monthly requests (current month)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const { count: monthlyRequests } = await admin
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .gte("created_at", monthStart)
    .lt("created_at", monthEnd);

  // Count active parallel tasks
  const { count: activeParallelTasks } = await admin
    .from("orchestrator_queue")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .in("status", ["assigned", "running"]);

  const usage = {
    monthlyRequests: monthlyRequests ?? 0,
    activeParallelTasks: activeParallelTasks ?? 0,
  };

  const limits = {
    maxMonthlyRequests: config.maxMonthlyRequests,
    maxParallelTasks: config.maxParallelTasks,
  };

  // Check monthly request limit
  if (config.maxMonthlyRequests !== null && usage.monthlyRequests >= config.maxMonthlyRequests) {
    return {
      allowed: false,
      reason: `Monthly request limit reached (${usage.monthlyRequests}/${config.maxMonthlyRequests}). Upgrade your plan for more requests.`,
      currentUsage: usage,
      limits,
    };
  }

  // Check parallel task limit
  if (usage.activeParallelTasks >= config.maxParallelTasks) {
    return {
      allowed: false,
      reason: `Maximum parallel tasks reached (${usage.activeParallelTasks}/${config.maxParallelTasks}). Wait for active tasks to complete or upgrade your plan.`,
      currentUsage: usage,
      limits,
    };
  }

  return { allowed: true, currentUsage: usage, limits };
}

// ─── Check Category Entitlement ─────────────────────────────────────────

export async function checkCategoryEntitlement(
  orgId: string,
  category: RequestCategory
): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const admin = createAdminClient();

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id, tier")
    .eq("id", orgId)
    .single();

  if (orgError || !org) {
    return { allowed: false, reason: "Organization not found" };
  }

  const tier = (org as unknown as Pick<Organization, "id" | "tier">).tier;
  const config = TIER_CONFIG[tier];

  if (config.allowedRequestTypes === "all") {
    return { allowed: true };
  }

  if (!config.allowedRequestTypes.includes(category)) {
    return {
      allowed: false,
      reason: `Category "${category}" is not available on the ${config.name} plan. Upgrade to access this request type.`,
    };
  }

  return { allowed: true };
}

// ─── Get Entitlement Status ─────────────────────────────────────────────

export async function getEntitlementStatus(orgId: string): Promise<{
  tier: Tier;
  entitlements: TierEntitlements;
  usage: {
    monthlyRequests: number;
    activeParallelTasks: number;
    totalRequests: number;
  };
  limits: {
    monthlyRequestsRemaining: number | null;
    parallelTasksRemaining: number;
  };
}> {
  const admin = createAdminClient();

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id, tier")
    .eq("id", orgId)
    .single();

  if (orgError || !org) {
    throw new Error(`Organization not found: ${orgId}`);
  }

  const tier = (org as unknown as Pick<Organization, "id" | "tier">).tier;
  const config = TIER_CONFIG[tier];

  // Count monthly requests
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const [
    { count: monthlyRequests },
    { count: activeParallelTasks },
    { count: totalRequests },
  ] = await Promise.all([
    admin
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("created_at", monthStart)
      .lt("created_at", monthEnd),
    admin
      .from("orchestrator_queue")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("status", ["assigned", "running"]),
    admin
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId),
  ]);

  const monthly = monthlyRequests ?? 0;
  const parallel = activeParallelTasks ?? 0;

  return {
    tier,
    entitlements: config,
    usage: {
      monthlyRequests: monthly,
      activeParallelTasks: parallel,
      totalRequests: totalRequests ?? 0,
    },
    limits: {
      monthlyRequestsRemaining:
        config.maxMonthlyRequests !== null
          ? Math.max(0, config.maxMonthlyRequests - monthly)
          : null,
      parallelTasksRemaining: Math.max(0, config.maxParallelTasks - parallel),
    },
  };
}
