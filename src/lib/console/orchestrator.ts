import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePriority } from "./priority";
import { routeToAgentGroup } from "./agent-router";
import type {
  AgentGroup,
  QueueStatus,
  RiskLevel,
  Tier,
  OrchestratorTask,
  QueueStats,
  Organization,
} from "./types";

/** Default SLA windows by tier (in hours) */
const TIER_SLA_HOURS: Record<Tier, number> = {
  tungsten: 4,
  titanium: 12,
  steel: 24,
  copper: 72,
};

/** Max concurrent active tasks per tier */
const TIER_CONCURRENCY: Record<Tier, number> = {
  tungsten: 10,
  titanium: 6,
  steel: 3,
  copper: 1,
};

// ---------------------------------------------------------------------------
// enqueueTask
// ---------------------------------------------------------------------------
export async function enqueueTask(params: {
  organizationId: string;
  requestId?: string;
  linearIssueId?: string;
  linearIssueKey?: string;
  title: string;
  description?: string;
  category?: string;
  agentGroup?: AgentGroup;
  riskLevel?: RiskLevel;
  requiresApproval?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<OrchestratorTask> {
  const admin = createAdminClient();

  // Look up org tier
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id, tier, max_concurrent_requests")
    .eq("id", params.organizationId)
    .single();

  if (orgError || !org) {
    throw new Error(`Organization not found: ${params.organizationId}`);
  }

  const tier = (org as unknown as Organization).tier;

  // Determine agent group
  const agentGroup =
    params.agentGroup ??
    (params.category ? routeToAgentGroup(params.category, params.description) : "ops");

  const riskLevel = params.riskLevel ?? "low";

  // Calculate SLA deadline
  const now = new Date();
  const slaHours = TIER_SLA_HOURS[tier] ?? 72;
  const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000).toISOString();

  // Calculate priority
  const priority = calculatePriority({
    tier,
    riskLevel,
    category: params.category,
    createdAt: now.toISOString(),
    slaDeadline,
  });

  const record = {
    organization_id: params.organizationId,
    request_id: params.requestId ?? null,
    linear_issue_id: params.linearIssueId ?? null,
    linear_issue_key: params.linearIssueKey ?? null,
    title: params.title,
    description: params.description ?? null,
    category: params.category ?? null,
    tier,
    priority,
    sla_deadline: slaDeadline,
    agent_group: agentGroup,
    risk_level: riskLevel,
    status: "queued" as const,
    requires_approval: params.requiresApproval ?? false,
    metadata: params.metadata ?? {},
  };

  const { data, error } = await admin
    .from("orchestrator_queue")
    .insert(record)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to enqueue task: ${error?.message}`);
  }

  return data as unknown as OrchestratorTask;
}

// ---------------------------------------------------------------------------
// dequeueNext
// ---------------------------------------------------------------------------
export async function dequeueNext(
  agentGroup?: AgentGroup
): Promise<OrchestratorTask | null> {
  const admin = createAdminClient();

  // Build query for queued tasks ordered by priority desc, created_at asc
  let query = admin
    .from("orchestrator_queue")
    .select("*")
    .eq("status", "queued")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

  if (agentGroup) {
    query = query.eq("agent_group", agentGroup);
  }

  const { data: candidates, error } = await query.limit(20);
  if (error || !candidates?.length) return null;

  // Check concurrency limits per org
  for (const candidate of candidates) {
    const task = candidate as unknown as OrchestratorTask;
    const tier = task.tier as Tier;
    const maxConcurrent = TIER_CONCURRENCY[tier] ?? 1;

    // Count currently active tasks for this org
    const { count } = await admin
      .from("orchestrator_queue")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", task.organization_id)
      .in("status", ["assigned", "running"]);

    if ((count ?? 0) < maxConcurrent) {
      // Assign this task
      const now = new Date().toISOString();
      const { data: updated, error: updateError } = await admin
        .from("orchestrator_queue")
        .update({
          status: "assigned",
          assigned_at: now,
          updated_at: now,
        })
        .eq("id", task.id)
        .eq("status", "queued") // Optimistic concurrency check
        .select("*")
        .single();

      if (updateError || !updated) continue; // Another worker grabbed it
      return updated as unknown as OrchestratorTask;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// updateTaskStatus
// ---------------------------------------------------------------------------
export async function updateTaskStatus(
  taskId: string,
  status: QueueStatus,
  details?: {
    error?: string;
    resultSummary?: string;
    artifacts?: Record<string, unknown>;
    blockedReason?: string;
  }
): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const update: Record<string, unknown> = {
    status,
    updated_at: now,
  };

  if (status === "running") {
    update.started_at = now;
  } else if (status === "completed") {
    update.completed_at = now;
  } else if (status === "blocked") {
    update.blocked_at = now;
    if (details?.blockedReason) update.blocked_reason = details.blockedReason;
  } else if (status === "failed") {
    update.completed_at = now;
  }

  if (details?.error) update.last_error = details.error;
  if (details?.resultSummary) update.result_summary = details.resultSummary;
  if (details?.artifacts) update.result_artifacts = details.artifacts;

  const { error } = await admin
    .from("orchestrator_queue")
    .update(update)
    .eq("id", taskId);

  if (error) {
    throw new Error(`Failed to update task status: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// blockTask
// ---------------------------------------------------------------------------
export async function blockTask(taskId: string, reason: string): Promise<void> {
  await updateTaskStatus(taskId, "blocked", { blockedReason: reason });
}

// ---------------------------------------------------------------------------
// getQueueStats
// ---------------------------------------------------------------------------
export async function getQueueStats(orgId?: string): Promise<QueueStats> {
  const admin = createAdminClient();

  let baseQuery = admin.from("orchestrator_queue").select("*");
  if (orgId) baseQuery = baseQuery.eq("organization_id", orgId);

  const { data: tasks, error } = await baseQuery;
  if (error) throw new Error(`Failed to fetch queue stats: ${error.message}`);

  const all = (tasks ?? []) as unknown as OrchestratorTask[];

  const stats: QueueStats = {
    total: all.length,
    queued: 0,
    running: 0,
    blocked: 0,
    completed: 0,
    failed: 0,
    avgWaitTimeMs: 0,
    avgProcessTimeMs: 0,
  };

  let totalWaitMs = 0;
  let waitCount = 0;
  let totalProcessMs = 0;
  let processCount = 0;

  for (const t of all) {
    switch (t.status) {
      case "queued":
        stats.queued++;
        break;
      case "assigned":
      case "running":
        stats.running++;
        break;
      case "blocked":
        stats.blocked++;
        break;
      case "completed":
        stats.completed++;
        break;
      case "failed":
        stats.failed++;
        break;
    }

    // Wait time: created_at -> assigned_at
    if (t.assigned_at) {
      totalWaitMs += new Date(t.assigned_at).getTime() - new Date(t.created_at).getTime();
      waitCount++;
    }

    // Process time: started_at -> completed_at
    if (t.started_at && t.completed_at) {
      totalProcessMs += new Date(t.completed_at).getTime() - new Date(t.started_at).getTime();
      processCount++;
    }
  }

  stats.avgWaitTimeMs = waitCount > 0 ? Math.round(totalWaitMs / waitCount) : 0;
  stats.avgProcessTimeMs = processCount > 0 ? Math.round(totalProcessMs / processCount) : 0;

  return stats;
}

// ---------------------------------------------------------------------------
// getQueueTasks
// ---------------------------------------------------------------------------
export async function getQueueTasks(params: {
  orgId?: string;
  status?: QueueStatus;
  agentGroup?: AgentGroup;
  limit?: number;
  offset?: number;
}): Promise<{ tasks: OrchestratorTask[]; total: number }> {
  const admin = createAdminClient();
  const limit = params.limit ?? 30;
  const offset = params.offset ?? 0;

  let query = admin
    .from("orchestrator_queue")
    .select("*, organization:organizations(id, name, slug, tier)", {
      count: "exact",
    })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.orgId) query = query.eq("organization_id", params.orgId);
  if (params.status) query = query.eq("status", params.status);
  if (params.agentGroup) query = query.eq("agent_group", params.agentGroup);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to fetch queue tasks: ${error.message}`);

  return {
    tasks: (data ?? []) as unknown as OrchestratorTask[],
    total: count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// cancelTask
// ---------------------------------------------------------------------------
export async function cancelTask(taskId: string, reason?: string): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin
    .from("orchestrator_queue")
    .update({
      status: "cancelled",
      completed_at: now,
      updated_at: now,
      last_error: reason ?? "Cancelled by admin",
    })
    .eq("id", taskId);

  if (error) {
    throw new Error(`Failed to cancel task: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// retryTask
// ---------------------------------------------------------------------------
export async function retryTask(taskId: string): Promise<OrchestratorTask> {
  const admin = createAdminClient();

  // Get the existing task
  const { data: task, error: fetchError } = await admin
    .from("orchestrator_queue")
    .select("*")
    .eq("id", taskId)
    .single();

  if (fetchError || !task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const t = task as unknown as OrchestratorTask;

  if (t.attempt_count >= t.max_attempts) {
    throw new Error(`Task has exceeded max attempts (${t.max_attempts})`);
  }

  const now = new Date().toISOString();
  const newPriority = calculatePriority({
    tier: t.tier,
    riskLevel: t.risk_level,
    category: t.category ?? undefined,
    createdAt: t.created_at,
    slaDeadline: t.sla_deadline ?? undefined,
  });

  const { data: updated, error: updateError } = await admin
    .from("orchestrator_queue")
    .update({
      status: "queued",
      priority: newPriority,
      attempt_count: t.attempt_count + 1,
      last_error: null,
      assigned_at: null,
      started_at: null,
      completed_at: null,
      blocked_at: null,
      blocked_reason: null,
      updated_at: now,
    })
    .eq("id", taskId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error(`Failed to retry task: ${updateError?.message}`);
  }

  return updated as unknown as OrchestratorTask;
}
