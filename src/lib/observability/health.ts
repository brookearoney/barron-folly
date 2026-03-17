import { createAdminClient } from "@/lib/supabase/admin";
import type { HealthCheck, SystemHealth } from "@/lib/console/types";

// ---------------------------------------------------------------------------
// checkHealth – full system health check
// ---------------------------------------------------------------------------

export async function checkHealth(): Promise<SystemHealth> {
  const [
    dbHealth,
    queueHealth,
    traceHealth,
    auditHealth,
  ] = await Promise.all([
    checkServiceHealth("database"),
    checkServiceHealth("orchestrator-queue"),
    checkServiceHealth("trace-spans"),
    checkServiceHealth("audit-log"),
  ]);

  const services = [dbHealth, queueHealth, traceHealth, auditHealth];

  // Get aggregate metrics
  const [errorRate, activeTraces, queueDepth, avgLatency] = await Promise.all([
    getErrorRate(1),
    getActiveTraceCount(),
    getQueueDepth(),
    getAvgLatency(1),
  ]);

  // Determine overall status
  const hasUnhealthy = services.some((s) => s.status === "unhealthy");
  const hasDegraded = services.some((s) => s.status === "degraded");

  let overall: SystemHealth["overall"] = "healthy";
  if (hasUnhealthy) overall = "unhealthy";
  else if (hasDegraded || errorRate > 10) overall = "degraded";

  return {
    overall,
    services,
    activeTraces,
    queueDepth,
    errorRate,
    avgLatency_ms: avgLatency,
  };
}

// ---------------------------------------------------------------------------
// checkServiceHealth – health check for individual services
// ---------------------------------------------------------------------------

export async function checkServiceHealth(service: string): Promise<HealthCheck> {
  const start = Date.now();
  const now = new Date().toISOString();

  try {
    const supabase = createAdminClient();

    switch (service) {
      case "database": {
        const { error } = await supabase.from("organizations").select("id").limit(1);
        const latency = Date.now() - start;
        if (error) {
          return { service, status: "unhealthy", latency_ms: latency, lastChecked: now, details: { error: error.message } };
        }
        return {
          service,
          status: latency > 2000 ? "degraded" : "healthy",
          latency_ms: latency,
          lastChecked: now,
        };
      }

      case "orchestrator-queue": {
        const { data, error } = await supabase
          .from("orchestrator_queue")
          .select("status", { count: "exact" })
          .in("status", ["queued", "assigned", "running", "blocked"]);

        const latency = Date.now() - start;
        if (error) {
          return { service, status: "unhealthy", latency_ms: latency, lastChecked: now, details: { error: error.message } };
        }

        const total = data?.length ?? 0;
        const blocked = data?.filter((t) => t.status === "blocked").length ?? 0;
        const blockedRate = total > 0 ? blocked / total : 0;

        return {
          service,
          status: blockedRate > 0.5 ? "degraded" : "healthy",
          latency_ms: latency,
          lastChecked: now,
          details: { activeItems: total, blocked },
        };
      }

      case "trace-spans": {
        const { error } = await supabase.from("trace_spans").select("id").limit(1);
        const latency = Date.now() - start;
        if (error) {
          return { service, status: "unhealthy", latency_ms: latency, lastChecked: now, details: { error: error.message } };
        }
        return { service, status: "healthy", latency_ms: latency, lastChecked: now };
      }

      case "audit-log": {
        const { error } = await supabase.from("audit_log_v2").select("id").limit(1);
        const latency = Date.now() - start;
        if (error) {
          return { service, status: "unhealthy", latency_ms: latency, lastChecked: now, details: { error: error.message } };
        }
        return { service, status: "healthy", latency_ms: latency, lastChecked: now };
      }

      default: {
        return { service, status: "healthy", latency_ms: 0, lastChecked: now, details: { note: "Unknown service" } };
      }
    }
  } catch (err) {
    const latency = Date.now() - start;
    return {
      service,
      status: "unhealthy",
      latency_ms: latency,
      lastChecked: now,
      details: { error: err instanceof Error ? err.message : String(err) },
    };
  }
}

// ---------------------------------------------------------------------------
// getErrorRate – errors per hour over last N hours
// ---------------------------------------------------------------------------

export async function getErrorRate(hours: number = 1): Promise<number> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();

  const { count, error } = await supabase
    .from("trace_spans")
    .select("*", { count: "exact", head: true })
    .eq("status", "error")
    .gte("start_time", since);

  if (error) {
    console.error("Failed to get error rate:", error);
    return 0;
  }

  return hours > 0 ? Math.round((count ?? 0) / hours) : 0;
}

// ---------------------------------------------------------------------------
// getLatencyPercentiles – span duration percentiles over last N hours
// ---------------------------------------------------------------------------

export async function getLatencyPercentiles(hours: number = 24): Promise<{
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();

  const { data, error } = await supabase
    .from("trace_spans")
    .select("duration_ms")
    .eq("status", "completed")
    .not("duration_ms", "is", null)
    .gte("start_time", since)
    .order("duration_ms", { ascending: true })
    .limit(10000);

  if (error || !data?.length) {
    return { p50: 0, p90: 0, p95: 0, p99: 0 };
  }

  const durations = data.map((d) => d.duration_ms as number).sort((a, b) => a - b);

  return {
    p50: percentile(durations, 50),
    p90: percentile(durations, 90),
    p95: percentile(durations, 95),
    p99: percentile(durations, 99),
  };
}

// ---------------------------------------------------------------------------
// detectAnomalies – identify unusual patterns
// ---------------------------------------------------------------------------

export async function detectAnomalies(
  orgId: string
): Promise<Array<{ type: string; severity: "info" | "warning" | "critical"; message: string; details: Record<string, unknown> }>> {
  const anomalies: Array<{ type: string; severity: "info" | "warning" | "critical"; message: string; details: Record<string, unknown> }> = [];
  const supabase = createAdminClient();

  // 1. Error rate spike: compare last hour to average of last 24h
  const [recentErrors, baselineErrors] = await Promise.all([
    getErrorRate(1),
    getErrorRate(24).then((r) => r), // already per-hour average
  ]);

  if (baselineErrors > 0 && recentErrors > baselineErrors * 2) {
    anomalies.push({
      type: "error_rate_spike",
      severity: recentErrors > baselineErrors * 5 ? "critical" : "warning",
      message: `Error rate spike detected: ${recentErrors}/hr vs baseline ${baselineErrors}/hr`,
      details: { currentRate: recentErrors, baselineRate: baselineErrors },
    });
  }

  // 2. Latency spike: compare recent p95 to 24h p95
  const [recentLatency, baselineLatency] = await Promise.all([
    getLatencyPercentiles(1),
    getLatencyPercentiles(24),
  ]);

  if (baselineLatency.p95 > 0 && recentLatency.p95 > baselineLatency.p95 * 3) {
    anomalies.push({
      type: "latency_spike",
      severity: "warning",
      message: `P95 latency spike: ${recentLatency.p95}ms vs baseline ${baselineLatency.p95}ms`,
      details: { current: recentLatency, baseline: baselineLatency },
    });
  }

  // 3. Queue depth growing
  const since1h = new Date(Date.now() - 3_600_000).toISOString();
  const since2h = new Date(Date.now() - 7_200_000).toISOString();

  const [{ count: queuedNow }, { count: queuedBefore }] = await Promise.all([
    supabase
      .from("orchestrator_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "queued")
      .gte("created_at", since1h),
    supabase
      .from("orchestrator_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "queued")
      .gte("created_at", since2h)
      .lte("created_at", since1h),
  ]);

  const qNow = queuedNow ?? 0;
  const qBefore = queuedBefore ?? 0;
  if (qBefore > 0 && qNow > qBefore * 2 && qNow > 5) {
    anomalies.push({
      type: "queue_growth",
      severity: qNow > 20 ? "critical" : "warning",
      message: `Queue growing faster than processing: ${qNow} items vs ${qBefore} previous hour`,
      details: { currentQueueNew: qNow, previousHourNew: qBefore },
    });
  }

  // 4. SLA breach rate
  const { data: slaTasks } = await supabase
    .from("orchestrator_queue")
    .select("sla_deadline, status, created_at")
    .not("sla_deadline", "is", null)
    .in("status", ["queued", "assigned", "running", "blocked"])
    .gte("created_at", new Date(Date.now() - 86_400_000).toISOString());

  if (slaTasks && slaTasks.length > 0) {
    const now = Date.now();
    const breached = slaTasks.filter(
      (t) => t.sla_deadline && new Date(t.sla_deadline).getTime() < now
    ).length;
    const breachRate = breached / slaTasks.length;

    if (breachRate > 0.2) {
      anomalies.push({
        type: "sla_breach_rate",
        severity: breachRate > 0.5 ? "critical" : "warning",
        message: `SLA breach rate at ${Math.round(breachRate * 100)}%: ${breached}/${slaTasks.length} active tasks breached`,
        details: { breached, total: slaTasks.length, breachRate: Math.round(breachRate * 100) },
      });
    }
  }

  // 5. Unusual tool access patterns (org-specific)
  const recentToolExecs = await supabase
    .from("tool_execution_records")
    .select("tool_id, status")
    .eq("organization_id", orgId)
    .gte("created_at", since1h);

  if (recentToolExecs.data && recentToolExecs.data.length > 0) {
    const denied = recentToolExecs.data.filter((t) => t.status === "denied").length;
    const deniedRate = denied / recentToolExecs.data.length;

    if (deniedRate > 0.3 && denied > 3) {
      anomalies.push({
        type: "tool_access_pattern",
        severity: "warning",
        message: `Unusual tool denial rate: ${denied}/${recentToolExecs.data.length} tool executions denied`,
        details: { denied, total: recentToolExecs.data.length, deniedRate: Math.round(deniedRate * 100) },
      });
    }
  }

  return anomalies;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function getActiveTraceCount(): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("trace_spans")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  if (error) return 0;
  return count ?? 0;
}

async function getQueueDepth(): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("orchestrator_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "queued");

  if (error) return 0;
  return count ?? 0;
}

async function getAvgLatency(hours: number): Promise<number> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();

  const { data, error } = await supabase
    .from("trace_spans")
    .select("duration_ms")
    .eq("status", "completed")
    .not("duration_ms", "is", null)
    .gte("start_time", since)
    .limit(5000);

  if (error || !data?.length) return 0;

  const total = data.reduce((sum, d) => sum + ((d.duration_ms as number) ?? 0), 0);
  return Math.round(total / data.length);
}
