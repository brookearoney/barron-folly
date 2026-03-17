import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateEnhancedSuggestions,
  storeSuggestions,
} from "./suggestions-engine";
import type { Organization, Tier } from "@/lib/console/types";

// Tiers eligible for proactive suggestions (Copper excluded)
const ELIGIBLE_TIERS: Tier[] = ["steel", "titanium", "tungsten"];

// Minimum days between suggestion generation cycles
const COOLDOWN_DAYS = 7;

// Maximum active suggestions per org
const MAX_ACTIVE_SUGGESTIONS = 10;

// ─── Eligibility ────────────────────────────────────────────────────────

/**
 * Check if an organization is eligible for a new suggestion cycle.
 */
export async function isEligibleForSuggestions(
  orgId: string
): Promise<{ eligible: boolean; reason?: string; nextEligible?: string }> {
  const admin = createAdminClient();

  // Get org
  const { data: org, error } = await admin
    .from("organizations")
    .select("id, tier, business_dossier")
    .eq("id", orgId)
    .single();

  if (error || !org) {
    return { eligible: false, reason: "Organization not found" };
  }

  // Must have business dossier (AI-enabled)
  if (!org.business_dossier) {
    return {
      eligible: false,
      reason: "Organization needs AI onboarding (no business dossier)",
    };
  }

  // Tier check
  if (!ELIGIBLE_TIERS.includes(org.tier as Tier)) {
    return {
      eligible: false,
      reason: `Tier "${org.tier}" is not eligible for proactive suggestions (minimum: Steel)`,
    };
  }

  // Check active suggestion count
  const { count: activeCount } = await admin
    .from("org_suggestions")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "active");

  if ((activeCount || 0) >= MAX_ACTIVE_SUGGESTIONS) {
    return {
      eligible: false,
      reason: `Organization already has ${activeCount} active suggestions (max: ${MAX_ACTIVE_SUGGESTIONS})`,
    };
  }

  // Cooldown check: when was the last suggestion created?
  const { data: lastSuggestion } = await admin
    .from("org_suggestions")
    .select("created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (lastSuggestion) {
    const lastCreated = new Date(lastSuggestion.created_at).getTime();
    const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    const nextEligibleMs = lastCreated + cooldownMs;

    if (Date.now() < nextEligibleMs) {
      const nextEligible = new Date(nextEligibleMs).toISOString();
      const daysRemaining = Math.ceil(
        (nextEligibleMs - Date.now()) / (24 * 60 * 60 * 1000)
      );
      return {
        eligible: false,
        reason: `Cooldown active: ${daysRemaining} day(s) remaining`,
        nextEligible,
      };
    }
  }

  return { eligible: true };
}

// ─── Single Org Cycle ───────────────────────────────────────────────────

/**
 * Run a complete suggestion generation cycle for a single organization.
 */
export async function runSuggestionCycle(
  orgId: string
): Promise<{ generated: number; deduped: number; stored: number }> {
  // Generate enhanced suggestions (includes dedup internally)
  const candidates = await generateEnhancedSuggestions(orgId);

  if (candidates.length === 0) {
    return { generated: 0, deduped: 0, stored: 0 };
  }

  // Store them
  const stored = await storeSuggestions(orgId, candidates);

  return {
    generated: candidates.length,
    deduped: candidates.length, // already deduped by engine
    stored: stored.length,
  };
}

// ─── All Orgs Cycle ─────────────────────────────────────────────────────

/**
 * Run suggestion generation for all eligible organizations.
 */
export async function runAllSuggestionCycles(): Promise<
  Array<{
    orgId: string;
    orgName: string;
    generated: number;
    skipped?: string;
  }>
> {
  const admin = createAdminClient();

  // Get all orgs with eligible tiers
  const { data: orgs, error } = await admin
    .from("organizations")
    .select("id, name, tier, business_dossier")
    .in("tier", ELIGIBLE_TIERS);

  if (error || !orgs) {
    console.error("Failed to fetch organizations:", error);
    return [];
  }

  const results: Array<{
    orgId: string;
    orgName: string;
    generated: number;
    skipped?: string;
  }> = [];

  // Process sequentially to avoid overwhelming Claude API
  for (const org of orgs) {
    const typedOrg = org as unknown as Organization;

    // Check eligibility
    const eligibility = await isEligibleForSuggestions(org.id);
    if (!eligibility.eligible) {
      results.push({
        orgId: org.id,
        orgName: typedOrg.name,
        generated: 0,
        skipped: eligibility.reason,
      });
      continue;
    }

    try {
      const cycle = await runSuggestionCycle(org.id);
      results.push({
        orgId: org.id,
        orgName: typedOrg.name,
        generated: cycle.stored,
      });
    } catch (error) {
      console.error(
        `Suggestion cycle failed for org ${org.id}:`,
        error
      );
      results.push({
        orgId: org.id,
        orgName: typedOrg.name,
        generated: 0,
        skipped:
          error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

// ─── Expiry ─────────────────────────────────────────────────────────────

/**
 * Expire old suggestions that have been active for too long.
 */
export async function expireOldSuggestions(
  daysOld: number = 90
): Promise<number> {
  const admin = createAdminClient();

  const cutoff = new Date(
    Date.now() - daysOld * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await admin
    .from("org_suggestions")
    .update({
      status: "dismissed",
      dismissed_reason: "auto-expired",
      updated_at: new Date().toISOString(),
    })
    .eq("status", "active")
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    console.error("Failed to expire suggestions:", error);
    return 0;
  }

  return data?.length || 0;
}
