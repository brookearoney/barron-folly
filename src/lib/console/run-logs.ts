import { createAdminClient } from "@/lib/supabase/admin";
import type { AgentFlowType, AgentRunLog, RunLogStatus } from "./types";
import { sendErrorAlert } from "./alerting";

/**
 * Start a new run log entry and return its ID.
 */
export async function startRunLog(params: {
  orgId?: string;
  requestId?: string;
  flow: AgentFlowType;
  inputSummary?: string;
}): Promise<string> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("agent_run_logs")
    .insert({
      organization_id: params.orgId || null,
      request_id: params.requestId || null,
      flow: params.flow,
      status: "started" as RunLogStatus,
      input_summary: params.inputSummary
        ? params.inputSummary.slice(0, 500)
        : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to start run log:", error);
    throw new Error("Failed to create run log entry");
  }

  return data.id;
}

/**
 * Mark a run log as completed with output details.
 */
export async function completeRunLog(
  id: string,
  params: {
    outputSummary?: string;
    tokensInput?: number;
    tokensOutput?: number;
    metadata?: Record<string, unknown>;
    linearTaskId?: string;
  }
): Promise<void> {
  const supabase = createAdminClient();

  // Get the original record to compute duration
  const { data: original } = await supabase
    .from("agent_run_logs")
    .select("created_at")
    .eq("id", id)
    .single();

  const durationMs = original
    ? Date.now() - new Date(original.created_at).getTime()
    : 0;

  const { error } = await supabase
    .from("agent_run_logs")
    .update({
      status: "completed" as RunLogStatus,
      output_summary: params.outputSummary
        ? params.outputSummary.slice(0, 500)
        : null,
      tokens_input: params.tokensInput ?? 0,
      tokens_output: params.tokensOutput ?? 0,
      duration_ms: durationMs,
      metadata: params.metadata ?? {},
      linear_task_id: params.linearTaskId ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to complete run log:", error);
  }
}

/**
 * Mark a run log as failed with an error message. Sends an alert email automatically.
 */
export async function failRunLog(id: string, errorMessage: string): Promise<void> {
  const supabase = createAdminClient();

  // Get the original record to compute duration
  const { data: original } = await supabase
    .from("agent_run_logs")
    .select("created_at")
    .eq("id", id)
    .single();

  const durationMs = original
    ? Date.now() - new Date(original.created_at).getTime()
    : 0;

  const { error } = await supabase
    .from("agent_run_logs")
    .update({
      status: "failed" as RunLogStatus,
      error_message: errorMessage.slice(0, 2000),
      duration_ms: durationMs,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to mark run log as failed:", error);
  }

  // Send alert email for the failure
  try {
    const { data: runLog } = await supabase
      .from("agent_run_logs")
      .select("*")
      .eq("id", id)
      .single();

    if (runLog) {
      await sendErrorAlert(runLog as AgentRunLog);
    }
  } catch (alertErr) {
    console.error("Failed to send error alert (non-fatal):", alertErr);
  }
}

/**
 * Get paginated run logs with optional filters.
 */
export async function getRunLogs(params: {
  orgId?: string;
  flow?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AgentRunLog[]; total: number }> {
  const supabase = createAdminClient();
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  let query = supabase
    .from("agent_run_logs")
    .select("*", { count: "exact" });

  if (params.orgId) {
    query = query.eq("organization_id", params.orgId);
  }
  if (params.flow) {
    query = query.eq("flow", params.flow);
  }
  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Failed to fetch run logs:", error);
    return { logs: [], total: 0 };
  }

  return {
    logs: (data || []) as AgentRunLog[],
    total: count ?? 0,
  };
}

/**
 * Get aggregate stats for run logs, optionally scoped to an org.
 */
export async function getRunLogStats(orgId?: string): Promise<{
  total: number;
  completed: number;
  failed: number;
  avgDurationMs: number;
  totalTokens: number;
}> {
  const supabase = createAdminClient();

  let query = supabase
    .from("agent_run_logs")
    .select("status, duration_ms, tokens_input, tokens_output");

  if (orgId) {
    query = query.eq("organization_id", orgId);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Failed to fetch run log stats:", error);
    return { total: 0, completed: 0, failed: 0, avgDurationMs: 0, totalTokens: 0 };
  }

  const total = data.length;
  const completed = data.filter((r) => r.status === "completed").length;
  const failed = data.filter((r) => r.status === "failed").length;
  const totalDuration = data.reduce((sum, r) => sum + (r.duration_ms || 0), 0);
  const avgDurationMs = total > 0 ? Math.round(totalDuration / total) : 0;
  const totalTokens = data.reduce(
    (sum, r) => sum + (r.tokens_input || 0) + (r.tokens_output || 0),
    0
  );

  return { total, completed, failed, avgDurationMs, totalTokens };
}
