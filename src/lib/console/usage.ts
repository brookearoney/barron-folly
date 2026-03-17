import { createAdminClient } from "@/lib/supabase/admin";
import type { UsageRecord } from "./types";

// ─── Helpers ────────────────────────────────────────────────────────────

function getCurrentPeriod(): { periodStart: string; periodEnd: string } {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  return { periodStart, periodEnd };
}

async function upsertUsageField(
  orgId: string,
  field: string,
  increment: number
): Promise<void> {
  const admin = createAdminClient();
  const { periodStart, periodEnd } = getCurrentPeriod();

  // Try to upsert — increment the field
  const { data: existing } = await admin
    .from("usage_records")
    .select("id, " + field)
    .eq("organization_id", orgId)
    .eq("period_start", periodStart)
    .single();

  if (existing) {
    const record = existing as unknown as Record<string, unknown>;
    const currentVal = (typeof record[field] === "number" ? record[field] : 0) as number;
    await admin
      .from("usage_records")
      .update({
        [field]: currentVal + increment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id as string);
  } else {
    await admin.from("usage_records").insert({
      organization_id: orgId,
      period_start: periodStart,
      period_end: periodEnd,
      [field]: increment,
    });
  }
}

// ─── Track Request Usage ────────────────────────────────────────────────

export async function trackRequestUsage(orgId: string): Promise<void> {
  await upsertUsageField(orgId, "requests_count", 1);
}

// ─── Track Task Completion ──────────────────────────────────────────────

export async function trackTaskCompletion(orgId: string): Promise<void> {
  await upsertUsageField(orgId, "tasks_completed", 1);
}

// ─── Track Token Usage ──────────────────────────────────────────────────

export async function trackTokenUsage(orgId: string, tokens: number): Promise<void> {
  await upsertUsageField(orgId, "tokens_used", tokens);
}

// ─── Get Current Usage ──────────────────────────────────────────────────

export async function getCurrentUsage(orgId: string): Promise<UsageRecord | null> {
  const admin = createAdminClient();
  const { periodStart } = getCurrentPeriod();

  const { data, error } = await admin
    .from("usage_records")
    .select("*")
    .eq("organization_id", orgId)
    .eq("period_start", periodStart)
    .single();

  if (error || !data) return null;
  return data as unknown as UsageRecord;
}

// ─── Get Usage History ──────────────────────────────────────────────────

export async function getUsageHistory(
  orgId: string,
  months: number = 6
): Promise<UsageRecord[]> {
  const admin = createAdminClient();

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffDate = cutoff.toISOString().split("T")[0];

  const { data, error } = await admin
    .from("usage_records")
    .select("*")
    .eq("organization_id", orgId)
    .gte("period_start", cutoffDate)
    .order("period_start", { ascending: false });

  if (error) throw new Error(`Failed to fetch usage history: ${error.message}`);
  return (data ?? []) as unknown as UsageRecord[];
}
