import { createAdminClient } from "@/lib/supabase/admin";

// Cost estimates (Sonnet pricing)
const INPUT_COST_PER_1K = 0.003;
const OUTPUT_COST_PER_1K = 0.015;
const ESTIMATED_HOURS_PER_TASK = 4;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function hoursBetween(a: string, b: string): number {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;
}

function periodStart(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function previousPeriodRange(days: number): { start: string; end: string } {
  const end = new Date(Date.now() - days * 86_400_000);
  const start = new Date(end.getTime() - days * 86_400_000);
  return { start: start.toISOString(), end: end.toISOString() };
}

function trendPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function weekKey(d: Date): string {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86_400_000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Time-to-first-response
// ---------------------------------------------------------------------------

export async function getTimeToFirstResponse(params: {
  orgId?: string;
  periodDays?: number;
}): Promise<{ avgHours: number; medianHours: number; p95Hours: number; count: number }> {
  const admin = createAdminClient();
  const days = params.periodDays ?? 30;
  const since = periodStart(days);

  // Get requests that moved past 'submitted' in the period
  let query = admin
    .from("requests")
    .select("id, created_at, updated_at, status")
    .neq("status", "submitted")
    .neq("status", "cancelled")
    .gte("created_at", since);

  if (params.orgId) query = query.eq("organization_id", params.orgId);

  const { data: requests } = await query;
  if (!requests?.length) return { avgHours: 0, medianHours: 0, p95Hours: 0, count: 0 };

  // For each request, check activity_log for first status change
  const hours: number[] = [];
  for (const req of requests) {
    const { data: firstActivity } = await admin
      .from("activity_log")
      .select("created_at")
      .eq("request_id", req.id)
      .in("action", ["status_change", "request_status_changed"])
      .order("created_at", { ascending: true })
      .limit(1);

    if (firstActivity?.length) {
      hours.push(hoursBetween(req.created_at, firstActivity[0].created_at));
    } else {
      // fallback: use updated_at if no activity log
      hours.push(hoursBetween(req.created_at, req.updated_at));
    }
  }

  hours.sort((a, b) => a - b);
  const avg = hours.reduce((s, v) => s + v, 0) / hours.length;

  return {
    avgHours: Math.round(avg * 100) / 100,
    medianHours: Math.round(percentile(hours, 50) * 100) / 100,
    p95Hours: Math.round(percentile(hours, 95) * 100) / 100,
    count: hours.length,
  };
}

// ---------------------------------------------------------------------------
// Cycle time (submitted -> shipped/done)
// ---------------------------------------------------------------------------

export async function getCycleTime(params: {
  orgId?: string;
  periodDays?: number;
}): Promise<{ avgHours: number; medianHours: number; p95Hours: number; count: number }> {
  const admin = createAdminClient();
  const days = params.periodDays ?? 30;
  const since = periodStart(days);

  let query = admin
    .from("requests")
    .select("created_at, updated_at")
    .in("status", ["shipped", "done"])
    .gte("updated_at", since);

  if (params.orgId) query = query.eq("organization_id", params.orgId);

  const { data: requests } = await query;
  if (!requests?.length) return { avgHours: 0, medianHours: 0, p95Hours: 0, count: 0 };

  const hours = requests.map((r) => hoursBetween(r.created_at, r.updated_at));
  hours.sort((a, b) => a - b);
  const avg = hours.reduce((s, v) => s + v, 0) / hours.length;

  return {
    avgHours: Math.round(avg * 100) / 100,
    medianHours: Math.round(percentile(hours, 50) * 100) / 100,
    p95Hours: Math.round(percentile(hours, 95) * 100) / 100,
    count: hours.length,
  };
}

// ---------------------------------------------------------------------------
// Throughput
// ---------------------------------------------------------------------------

export async function getThroughput(params: {
  orgId?: string;
  periodDays?: number;
  groupBy?: "day" | "week" | "month";
}): Promise<Array<{ period: string; completed: number; failed: number; total: number }>> {
  const admin = createAdminClient();
  const days = params.periodDays ?? 30;
  const since = periodStart(days);
  const groupBy = params.groupBy ?? "day";

  let query = admin
    .from("orchestrator_queue")
    .select("status, completed_at, created_at")
    .in("status", ["completed", "failed"])
    .gte("created_at", since);

  if (params.orgId) query = query.eq("organization_id", params.orgId);

  const { data: tasks } = await query;
  if (!tasks?.length) return [];

  const buckets: Record<string, { completed: number; failed: number }> = {};

  for (const t of tasks) {
    const date = new Date(t.completed_at || t.created_at);
    const key =
      groupBy === "week" ? weekKey(date) : groupBy === "month" ? monthKey(date) : dayKey(date);

    if (!buckets[key]) buckets[key] = { completed: 0, failed: 0 };
    if (t.status === "completed") buckets[key].completed++;
    else buckets[key].failed++;
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, v]) => ({
      period,
      completed: v.completed,
      failed: v.failed,
      total: v.completed + v.failed,
    }));
}

// ---------------------------------------------------------------------------
// Value delivered per client
// ---------------------------------------------------------------------------

export async function getValueDelivered(params: {
  orgId: string;
  periodDays?: number;
}): Promise<{
  totalRequests: number;
  completedRequests: number;
  totalTasks: number;
  completedTasks: number;
  totalAgentMinutes: number;
  totalTokensUsed: number;
  estimatedHoursSaved: number;
  categories: Record<string, number>;
}> {
  const admin = createAdminClient();
  const days = params.periodDays ?? 30;
  const since = periodStart(days);

  const [{ data: requests }, { data: tasks }, { data: runs }] = await Promise.all([
    admin
      .from("requests")
      .select("status, category")
      .eq("organization_id", params.orgId)
      .gte("created_at", since),
    admin
      .from("orchestrator_queue")
      .select("status")
      .eq("organization_id", params.orgId)
      .gte("created_at", since),
    admin
      .from("agent_run_logs")
      .select("duration_ms, tokens_input, tokens_output")
      .eq("organization_id", params.orgId)
      .gte("created_at", since),
  ]);

  const reqs = requests || [];
  const tks = tasks || [];
  const rns = runs || [];

  const completedRequests = reqs.filter(
    (r) => r.status === "shipped" || r.status === "done",
  ).length;
  const completedTasks = tks.filter((t) => t.status === "completed").length;

  const totalAgentMs = rns.reduce((s, r) => s + (r.duration_ms || 0), 0);
  const totalTokens = rns.reduce(
    (s, r) => s + (r.tokens_input || 0) + (r.tokens_output || 0),
    0,
  );

  const categories: Record<string, number> = {};
  for (const r of reqs) {
    categories[r.category] = (categories[r.category] || 0) + 1;
  }

  return {
    totalRequests: reqs.length,
    completedRequests,
    totalTasks: tks.length,
    completedTasks,
    totalAgentMinutes: Math.round(totalAgentMs / 60_000),
    totalTokensUsed: totalTokens,
    estimatedHoursSaved: completedTasks * ESTIMATED_HOURS_PER_TASK,
    categories,
  };
}

// ---------------------------------------------------------------------------
// AI performance metrics
// ---------------------------------------------------------------------------

export async function getAIMetrics(params: {
  orgId?: string;
  periodDays?: number;
}): Promise<{
  totalRuns: number;
  successRate: number;
  avgDurationMs: number;
  totalTokens: number;
  costEstimate: number;
  byFlow: Record<string, { count: number; successRate: number; avgDurationMs: number }>;
}> {
  const admin = createAdminClient();
  const days = params.periodDays ?? 30;
  const since = periodStart(days);

  let query = admin
    .from("agent_run_logs")
    .select("flow, status, duration_ms, tokens_input, tokens_output")
    .gte("created_at", since);

  if (params.orgId) query = query.eq("organization_id", params.orgId);

  const { data: runs } = await query;
  if (!runs?.length) {
    return {
      totalRuns: 0,
      successRate: 0,
      avgDurationMs: 0,
      totalTokens: 0,
      costEstimate: 0,
      byFlow: {},
    };
  }

  const completed = runs.filter((r) => r.status === "completed").length;
  const totalDuration = runs.reduce((s, r) => s + (r.duration_ms || 0), 0);
  const totalInput = runs.reduce((s, r) => s + (r.tokens_input || 0), 0);
  const totalOutput = runs.reduce((s, r) => s + (r.tokens_output || 0), 0);
  const totalTokens = totalInput + totalOutput;
  const costEstimate =
    (totalInput / 1000) * INPUT_COST_PER_1K + (totalOutput / 1000) * OUTPUT_COST_PER_1K;

  const byFlow: Record<string, { count: number; successRate: number; avgDurationMs: number }> = {};
  const flowGroups: Record<string, typeof runs> = {};
  for (const r of runs) {
    if (!flowGroups[r.flow]) flowGroups[r.flow] = [];
    flowGroups[r.flow].push(r);
  }
  for (const [flow, group] of Object.entries(flowGroups)) {
    const fc = group.filter((r) => r.status === "completed").length;
    const fd = group.reduce((s, r) => s + (r.duration_ms || 0), 0);
    byFlow[flow] = {
      count: group.length,
      successRate: group.length > 0 ? Math.round((fc / group.length) * 100) : 0,
      avgDurationMs: group.length > 0 ? Math.round(fd / group.length) : 0,
    };
  }

  return {
    totalRuns: runs.length,
    successRate: runs.length > 0 ? Math.round((completed / runs.length) * 100) : 0,
    avgDurationMs: runs.length > 0 ? Math.round(totalDuration / runs.length) : 0,
    totalTokens,
    costEstimate: Math.round(costEstimate * 100) / 100,
    byFlow,
  };
}

// ---------------------------------------------------------------------------
// Approval metrics
// ---------------------------------------------------------------------------

export async function getApprovalMetrics(params: {
  orgId?: string;
  periodDays?: number;
}): Promise<{
  totalApprovals: number;
  approved: number;
  denied: number;
  revisionRequested: number;
  avgDecisionTimeHours: number;
  byRiskLevel: Record<string, { count: number; approvedRate: number }>;
}> {
  const admin = createAdminClient();
  const days = params.periodDays ?? 30;
  const since = periodStart(days);

  let query = admin
    .from("approvals")
    .select("decision, risk_level, created_at, decided_at")
    .gte("created_at", since);

  if (params.orgId) query = query.eq("organization_id", params.orgId);

  const { data: approvals } = await query;
  if (!approvals?.length) {
    return {
      totalApprovals: 0,
      approved: 0,
      denied: 0,
      revisionRequested: 0,
      avgDecisionTimeHours: 0,
      byRiskLevel: {},
    };
  }

  const approved = approvals.filter((a) => a.decision === "approved").length;
  const denied = approvals.filter((a) => a.decision === "denied").length;
  const revision = approvals.filter((a) => a.decision === "revision_requested").length;

  const decided = approvals.filter((a) => a.decided_at);
  const avgDecisionHours =
    decided.length > 0
      ? decided.reduce((s, a) => s + hoursBetween(a.created_at, a.decided_at!), 0) / decided.length
      : 0;

  const riskGroups: Record<string, typeof approvals> = {};
  for (const a of approvals) {
    const rl = a.risk_level || "low";
    if (!riskGroups[rl]) riskGroups[rl] = [];
    riskGroups[rl].push(a);
  }

  const byRiskLevel: Record<string, { count: number; approvedRate: number }> = {};
  for (const [level, group] of Object.entries(riskGroups)) {
    const approvedCount = group.filter((a) => a.decision === "approved").length;
    byRiskLevel[level] = {
      count: group.length,
      approvedRate: group.length > 0 ? Math.round((approvedCount / group.length) * 100) : 0,
    };
  }

  return {
    totalApprovals: approvals.length,
    approved,
    denied,
    revisionRequested: revision,
    avgDecisionTimeHours: Math.round(avgDecisionHours * 100) / 100,
    byRiskLevel,
  };
}

// ---------------------------------------------------------------------------
// Queue health
// ---------------------------------------------------------------------------

export async function getQueueHealth(params: {
  orgId?: string;
}): Promise<{
  queueDepth: number;
  avgWaitTimeHours: number;
  avgProcessTimeHours: number;
  blockedCount: number;
  failureRate: number;
  byAgentGroup: Record<
    string,
    { queued: number; running: number; completed: number; failed: number }
  >;
}> {
  const admin = createAdminClient();

  let query = admin
    .from("orchestrator_queue")
    .select("status, agent_group, created_at, assigned_at, started_at, completed_at");

  if (params.orgId) query = query.eq("organization_id", params.orgId);

  const { data: tasks } = await query;
  if (!tasks?.length) {
    return {
      queueDepth: 0,
      avgWaitTimeHours: 0,
      avgProcessTimeHours: 0,
      blockedCount: 0,
      failureRate: 0,
      byAgentGroup: {},
    };
  }

  const queued = tasks.filter((t) => t.status === "queued");
  const blocked = tasks.filter((t) => t.status === "blocked");
  const failed = tasks.filter((t) => t.status === "failed");
  const completed = tasks.filter((t) => t.status === "completed");

  // Wait time: created_at -> started_at for completed tasks
  const withStart = tasks.filter((t) => t.started_at);
  const avgWait =
    withStart.length > 0
      ? withStart.reduce((s, t) => s + hoursBetween(t.created_at, t.started_at!), 0) /
        withStart.length
      : 0;

  // Process time: started_at -> completed_at for completed tasks
  const withBoth = tasks.filter((t) => t.started_at && t.completed_at);
  const avgProcess =
    withBoth.length > 0
      ? withBoth.reduce((s, t) => s + hoursBetween(t.started_at!, t.completed_at!), 0) /
        withBoth.length
      : 0;

  const finishedCount = completed.length + failed.length;
  const failureRate =
    finishedCount > 0 ? Math.round((failed.length / finishedCount) * 100) : 0;

  // By agent group
  const byAgentGroup: Record<
    string,
    { queued: number; running: number; completed: number; failed: number }
  > = {};
  for (const t of tasks) {
    const group = t.agent_group || "unassigned";
    if (!byAgentGroup[group])
      byAgentGroup[group] = { queued: 0, running: 0, completed: 0, failed: 0 };
    if (t.status === "queued") byAgentGroup[group].queued++;
    else if (t.status === "running" || t.status === "assigned") byAgentGroup[group].running++;
    else if (t.status === "completed") byAgentGroup[group].completed++;
    else if (t.status === "failed") byAgentGroup[group].failed++;
  }

  return {
    queueDepth: queued.length,
    avgWaitTimeHours: Math.round(avgWait * 100) / 100,
    avgProcessTimeHours: Math.round(avgProcess * 100) / 100,
    blockedCount: blocked.length,
    failureRate,
    byAgentGroup,
  };
}

// ---------------------------------------------------------------------------
// Dashboard summary
// ---------------------------------------------------------------------------

export async function getDashboardSummary(params: {
  orgId?: string;
  periodDays?: number;
}): Promise<{
  ttfr: { avgHours: number; trend: number };
  cycleTime: { avgHours: number; trend: number };
  throughput: { current: number; trend: number };
  successRate: { current: number; trend: number };
  activeRequests: number;
  queueDepth: number;
}> {
  const admin = createAdminClient();
  const days = params.periodDays ?? 30;
  const since = periodStart(days);
  const prev = previousPeriodRange(days);

  // Current period metrics
  const [ttfr, cycleTime, aiMetrics, queueHealth] = await Promise.all([
    getTimeToFirstResponse(params),
    getCycleTime(params),
    getAIMetrics(params),
    getQueueHealth({ orgId: params.orgId }),
  ]);

  // Previous period metrics for trends
  const [prevTtfr, prevCycleTime, prevAiMetrics] = await Promise.all([
    getTimeToFirstResponse({ ...params, periodDays: days * 2 }).then((r) => r), // hacky but we'll compute the diff
    getCycleTime({ ...params, periodDays: days * 2 }),
    getAIMetrics({ ...params, periodDays: days * 2 }),
  ]);

  // Count completed tasks in current vs previous period
  let currentQuery = admin
    .from("orchestrator_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")
    .gte("completed_at", since);
  if (params.orgId) currentQuery = currentQuery.eq("organization_id", params.orgId);
  const { count: currentCompleted } = await currentQuery;

  let prevQuery = admin
    .from("orchestrator_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")
    .gte("completed_at", prev.start)
    .lte("completed_at", prev.end);
  if (params.orgId) prevQuery = prevQuery.eq("organization_id", params.orgId);
  const { count: prevCompleted } = await prevQuery;

  // Active requests count
  const activeStatuses = ["submitted", "backlog", "todo", "in_progress", "in_review"];
  let activeQuery = admin
    .from("requests")
    .select("*", { count: "exact", head: true })
    .in("status", activeStatuses);
  if (params.orgId) activeQuery = activeQuery.eq("organization_id", params.orgId);
  const { count: activeRequests } = await activeQuery;

  return {
    ttfr: {
      avgHours: ttfr.avgHours,
      trend: trendPercent(ttfr.avgHours, prevTtfr.avgHours),
    },
    cycleTime: {
      avgHours: cycleTime.avgHours,
      trend: trendPercent(cycleTime.avgHours, prevCycleTime.avgHours),
    },
    throughput: {
      current: currentCompleted ?? 0,
      trend: trendPercent(currentCompleted ?? 0, prevCompleted ?? 0),
    },
    successRate: {
      current: aiMetrics.successRate,
      trend: trendPercent(aiMetrics.successRate, prevAiMetrics.successRate),
    },
    activeRequests: activeRequests ?? 0,
    queueDepth: queueHealth.queueDepth,
  };
}
