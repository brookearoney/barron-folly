import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditAction, AuditEntry, RiskLevel } from "@/lib/console/types";

// ---------------------------------------------------------------------------
// auditLog – write a single audit entry
// ---------------------------------------------------------------------------

export async function auditLog(
  entry: Omit<AuditEntry, "id" | "created_at">
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("audit_log_v2").insert({
    trace_id: entry.traceId,
    span_id: entry.spanId,
    task_id: entry.taskId,
    org_id: entry.orgId,
    actor_type: entry.actorType,
    actor_id: entry.actorId,
    action: entry.action,
    resource: entry.resource,
    details: entry.details,
    risk_level: entry.riskLevel,
    ip_address: entry.ip_address,
  });

  if (error) {
    console.error("Failed to write audit log:", error);
  }
}

// ---------------------------------------------------------------------------
// getAuditTrail – query audit entries with filters
// ---------------------------------------------------------------------------

export async function getAuditTrail(params: {
  orgId: string;
  taskId?: string;
  traceId?: string;
  action?: AuditAction;
  actorType?: string;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
}): Promise<{ entries: AuditEntry[]; total: number }> {
  const supabase = createAdminClient();
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  let query = supabase
    .from("audit_log_v2")
    .select("*", { count: "exact" })
    .eq("org_id", params.orgId);

  if (params.taskId) query = query.eq("task_id", params.taskId);
  if (params.traceId) query = query.eq("trace_id", params.traceId);
  if (params.action) query = query.eq("action", params.action);
  if (params.actorType) query = query.eq("actor_type", params.actorType);
  if (params.since) query = query.gte("created_at", params.since);
  if (params.until) query = query.lte("created_at", params.until);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Failed to fetch audit trail:", error);
    return { entries: [], total: 0 };
  }

  return {
    entries: (data ?? []).map(rowToAuditEntry),
    total: count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// getAuditSummary – aggregate stats for an org over a period
// ---------------------------------------------------------------------------

export async function getAuditSummary(
  orgId: string,
  days: number = 30
): Promise<{
  totalActions: number;
  byAction: Record<string, number>;
  byActor: Record<string, number>;
  riskBreakdown: Record<string, number>;
}> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from("audit_log_v2")
    .select("action, actor_type, risk_level")
    .eq("org_id", orgId)
    .gte("created_at", since);

  if (error || !data) {
    console.error("Failed to fetch audit summary:", error);
    return { totalActions: 0, byAction: {}, byActor: {}, riskBreakdown: {} };
  }

  const byAction: Record<string, number> = {};
  const byActor: Record<string, number> = {};
  const riskBreakdown: Record<string, number> = {};

  for (const row of data) {
    byAction[row.action] = (byAction[row.action] ?? 0) + 1;
    byActor[row.actor_type] = (byActor[row.actor_type] ?? 0) + 1;

    const risk = row.risk_level ?? "none";
    riskBreakdown[risk] = (riskBreakdown[risk] ?? 0) + 1;
  }

  return {
    totalActions: data.length,
    byAction,
    byActor,
    riskBreakdown,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowToAuditEntry(row: Record<string, unknown>): AuditEntry {
  return {
    id: row.id as string,
    traceId: (row.trace_id as string) ?? null,
    spanId: (row.span_id as string) ?? null,
    taskId: (row.task_id as string) ?? null,
    orgId: row.org_id as string,
    actorType: row.actor_type as AuditEntry["actorType"],
    actorId: (row.actor_id as string) ?? null,
    action: row.action as AuditAction,
    resource: row.resource as string,
    details: (row.details as Record<string, unknown>) ?? {},
    riskLevel: (row.risk_level as RiskLevel) ?? null,
    ip_address: (row.ip_address as string) ?? null,
    created_at: row.created_at as string,
  };
}
