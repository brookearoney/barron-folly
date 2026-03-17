import { createAdminClient } from "@/lib/supabase/admin";
import { startRunLog, completeRunLog, failRunLog } from "@/lib/console/run-logs";
import { getTool } from "./tool-registry";
import { canGroupUseTool, requiresHumanReview } from "./group-capabilities";
import { createSandbox } from "./sandbox";
import type {
  ToolExecutionContext,
  ToolExecutionResult,
  ToolExecutionRecord,
  AgentTool,
  SandboxConfig,
} from "@/lib/console/types";

// ─── Tool Runner ────────────────────────────────────────────────────────
// The execution engine that runs tools with full safety controls:
// access validation, rate limiting, policy checks, sandboxing,
// retry logic, and result logging.

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;

// In-memory rate limit tracker (per-process; for distributed use, migrate to Redis)
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

// ─── Main Entry Point ───────────────────────────────────────────────────

/**
 * Execute a tool with full safety checks, sandboxing, and logging.
 *
 * Flow:
 * 1. Validate the tool exists
 * 2. Validate agent group + risk level access
 * 3. Check rate limits
 * 4. Check if human review is required
 * 5. Create sandbox config
 * 6. Execute with retry logic
 * 7. Log the result
 * 8. Check if escalation is needed
 */
export async function runTool(
  toolId: string,
  params: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<ToolExecutionResult> {
  const startTime = Date.now();

  // 1. Validate tool exists
  const tool = getTool(toolId);
  if (!tool) {
    return createFailureResult(toolId, startTime, `Unknown tool: ${toolId}`);
  }

  // 2. Validate access
  const accessError = validateToolAccess(toolId, context);
  if (accessError) {
    await logToolExecution({
      tool,
      context,
      params,
      status: "denied",
      startTime,
      error: accessError,
    });
    return createFailureResult(toolId, startTime, accessError);
  }

  // 3. Check rate limits
  const rateLimitError = checkRateLimits(toolId, context.orgId);
  if (rateLimitError) {
    await logToolExecution({
      tool,
      context,
      params,
      status: "denied",
      startTime,
      error: rateLimitError,
    });
    return createFailureResult(toolId, startTime, rateLimitError);
  }

  // 4. Check if human review is required
  const needsReview = requiresHumanReview(context.agentGroup, context.riskLevel);
  if (needsReview && tool.requiredApproval) {
    await logToolExecution({
      tool,
      context,
      params,
      status: "denied",
      startTime,
      error: "Human review required before executing this tool at the current risk level",
    });
    return {
      success: false,
      toolId,
      output: null,
      duration_ms: Date.now() - startTime,
      error: "Human review required before executing this tool at the current risk level",
      requiresEscalation: true,
    };
  }

  // 5. Create sandbox config
  const sandbox = createSandbox(tool.riskTier, context.riskLevel, context.agentGroup);

  // 6. Start run log for observability
  let runLogId: string | null = null;
  try {
    runLogId = await startRunLog({
      orgId: context.orgId,
      flow: "construct", // tool execution falls under the 'construct' flow
      inputSummary: `Tool: ${tool.name} | Task: ${context.taskId}`,
    });
  } catch {
    // Run log creation is non-critical
  }

  // 7. Execute with retry logic
  let result: ToolExecutionResult;
  let lastError: string | undefined;
  let attemptNumber = 0;

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    attemptNumber = attempt + 1;

    try {
      result = await executeWithTimeout(tool, params, context, sandbox);

      if (result.success) {
        // Increment rate limit counter
        incrementRateLimit(toolId, context.orgId);

        // Log success
        await logToolExecution({
          tool,
          context,
          params,
          status: "completed",
          startTime,
          output: result.output,
          duration_ms: result.duration_ms,
          tokensUsed: result.tokensUsed,
          sandbox,
          attemptNumber,
        });

        // Complete run log
        if (runLogId) {
          try {
            await completeRunLog(runLogId, {
              outputSummary: `Tool ${tool.name} completed successfully`,
              tokensInput: result.tokensUsed ?? 0,
              metadata: { toolId, attempt: attemptNumber },
            });
          } catch {
            // non-critical
          }
        }

        return result;
      }

      // Non-retryable failure
      if (!isTransientError(result.error)) {
        lastError = result.error;
        break;
      }

      lastError = result.error;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);

      if (!isTransientError(lastError)) {
        break;
      }
    }

    // Exponential backoff before retry
    if (attempt < MAX_RETRY_ATTEMPTS - 1) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  // All attempts failed
  const failureResult = createFailureResult(toolId, startTime, lastError ?? "Unknown error");
  failureResult.requiresEscalation = shouldEscalate(tool, attemptNumber);

  await logToolExecution({
    tool,
    context,
    params,
    status: "failed",
    startTime,
    error: lastError,
    sandbox,
    attemptNumber,
    requiresEscalation: failureResult.requiresEscalation,
  });

  if (runLogId) {
    try {
      await failRunLog(runLogId, lastError ?? "Unknown error");
    } catch {
      // non-critical
    }
  }

  return failureResult;
}

// ─── Access Validation ──────────────────────────────────────────────────

/**
 * Validate that the agent group at the given risk level can use this tool.
 * Returns null if access is granted, or an error message string if denied.
 */
export function validateToolAccess(
  toolId: string,
  context: ToolExecutionContext
): string | null {
  const tool = getTool(toolId);
  if (!tool) {
    return `Tool not found: ${toolId}`;
  }

  // Check agent group is allowed by the tool itself
  if (!tool.allowedAgentGroups.includes(context.agentGroup)) {
    return `Agent group "${context.agentGroup}" is not allowed to use tool "${tool.name}"`;
  }

  // Check risk level is allowed by the tool
  if (!tool.allowedRiskLevels.includes(context.riskLevel)) {
    return `Tool "${tool.name}" is not available at risk level "${context.riskLevel}"`;
  }

  // Check the group's capability profile allows this tool at this risk level
  if (!canGroupUseTool(context.agentGroup, toolId, context.riskLevel)) {
    return `Agent group "${context.agentGroup}" cannot use tool "${tool.name}" at risk level "${context.riskLevel}" per capability profile`;
  }

  return null;
}

// ─── Rate Limiting ──────────────────────────────────────────────────────

/**
 * Check if rate limits are exceeded for this tool + org combination.
 * Returns null if within limits, or an error message if exceeded.
 */
export function checkRateLimits(toolId: string, orgId: string): string | null {
  const tool = getTool(toolId);
  if (!tool?.rateLimits) return null;

  const hourKey = `${toolId}:${orgId}:hour`;
  const dayKey = `${toolId}:${orgId}:day`;
  const now = Date.now();

  // Check hourly limit
  const hourBucket = rateLimitBuckets.get(hourKey);
  if (hourBucket) {
    if (now < hourBucket.resetAt) {
      if (hourBucket.count >= tool.rateLimits.maxPerHour) {
        return `Hourly rate limit exceeded for tool "${tool.name}" (${tool.rateLimits.maxPerHour}/hour)`;
      }
    } else {
      // Reset expired bucket
      rateLimitBuckets.delete(hourKey);
    }
  }

  // Check daily limit
  const dayBucket = rateLimitBuckets.get(dayKey);
  if (dayBucket) {
    if (now < dayBucket.resetAt) {
      if (dayBucket.count >= tool.rateLimits.maxPerDay) {
        return `Daily rate limit exceeded for tool "${tool.name}" (${tool.rateLimits.maxPerDay}/day)`;
      }
    } else {
      rateLimitBuckets.delete(dayKey);
    }
  }

  return null;
}

/** Increment rate limit counters after a successful execution. */
function incrementRateLimit(toolId: string, orgId: string): void {
  const tool = getTool(toolId);
  if (!tool?.rateLimits) return;

  const now = Date.now();
  const hourKey = `${toolId}:${orgId}:hour`;
  const dayKey = `${toolId}:${orgId}:day`;

  // Hourly bucket
  const hourBucket = rateLimitBuckets.get(hourKey);
  if (hourBucket && now < hourBucket.resetAt) {
    hourBucket.count++;
  } else {
    rateLimitBuckets.set(hourKey, { count: 1, resetAt: now + 3_600_000 });
  }

  // Daily bucket
  const dayBucket = rateLimitBuckets.get(dayKey);
  if (dayBucket && now < dayBucket.resetAt) {
    dayBucket.count++;
  } else {
    rateLimitBuckets.set(dayKey, { count: 1, resetAt: now + 86_400_000 });
  }
}

/**
 * Get the current rate limit status for a tool + org. Useful for the admin dashboard.
 */
export function getRateLimitStatus(
  toolId: string,
  orgId: string
): { hourlyUsed: number; dailyUsed: number; hourlyLimit: number; dailyLimit: number } | null {
  const tool = getTool(toolId);
  if (!tool?.rateLimits) return null;

  const now = Date.now();
  const hourKey = `${toolId}:${orgId}:hour`;
  const dayKey = `${toolId}:${orgId}:day`;

  const hourBucket = rateLimitBuckets.get(hourKey);
  const dayBucket = rateLimitBuckets.get(dayKey);

  return {
    hourlyUsed: hourBucket && now < hourBucket.resetAt ? hourBucket.count : 0,
    dailyUsed: dayBucket && now < dayBucket.resetAt ? dayBucket.count : 0,
    hourlyLimit: tool.rateLimits.maxPerHour,
    dailyLimit: tool.rateLimits.maxPerDay,
  };
}

// ─── Execution ──────────────────────────────────────────────────────────

/**
 * Execute a tool with timeout handling. This is the actual execution wrapper.
 * In a real system, this would dispatch to specific tool implementations.
 * For now, it provides the framework with proper timeout and error handling.
 */
async function executeWithTimeout(
  tool: AgentTool,
  params: Record<string, unknown>,
  context: ToolExecutionContext,
  sandbox: SandboxConfig
): Promise<ToolExecutionResult> {
  const startTime = Date.now();
  const effectiveTimeout = Math.min(tool.timeout_ms, sandbox.maxExecutionTime_ms);

  return new Promise<ToolExecutionResult>((resolve) => {
    const timer = setTimeout(() => {
      resolve({
        success: false,
        toolId: tool.id,
        output: null,
        duration_ms: Date.now() - startTime,
        error: `Tool execution timed out after ${effectiveTimeout}ms`,
      });
    }, effectiveTimeout);

    // Dispatch to tool implementation
    dispatchToolExecution(tool, params, context, sandbox)
      .then((output) => {
        clearTimeout(timer);
        resolve({
          success: true,
          toolId: tool.id,
          output,
          duration_ms: Date.now() - startTime,
        });
      })
      .catch((err) => {
        clearTimeout(timer);
        resolve({
          success: false,
          toolId: tool.id,
          output: null,
          duration_ms: Date.now() - startTime,
          error: err instanceof Error ? err.message : String(err),
        });
      });
  });
}

/**
 * Dispatch to the actual tool implementation. This is the extensibility point
 * where specific tool handlers are registered.
 *
 * Each tool ID maps to its handler function. New tools are added by extending
 * the TOOL_HANDLERS map below. Unregistered tools return a placeholder response
 * indicating the handler hasn't been implemented yet.
 */
async function dispatchToolExecution(
  tool: AgentTool,
  params: Record<string, unknown>,
  _context: ToolExecutionContext,
  _sandbox: SandboxConfig
): Promise<unknown> {
  const handler = TOOL_HANDLERS[tool.id];
  if (handler) {
    return handler(params);
  }

  // Placeholder: tool handler not yet implemented
  return {
    status: "not_implemented",
    message: `Tool handler for "${tool.name}" (${tool.id}) is not yet implemented`,
    params,
  };
}

/**
 * Tool handler registry. Extend this map to add real implementations.
 * Each handler receives the params object and returns the tool output.
 */
const TOOL_HANDLERS: Record<
  string,
  (params: Record<string, unknown>) => Promise<unknown>
> = {
  // Placeholder handlers — real implementations will be added as tools are built.
  // Example:
  // read_files: async (params) => {
  //   const { path } = params as { path: string };
  //   return await readFileContents(path);
  // },
};

// ─── Logging ────────────────────────────────────────────────────────────

interface LogParams {
  tool: AgentTool;
  context: ToolExecutionContext;
  params: Record<string, unknown>;
  status: ToolExecutionRecord["status"];
  startTime: number;
  output?: unknown;
  error?: string;
  duration_ms?: number;
  tokensUsed?: number;
  sandbox?: SandboxConfig;
  attemptNumber?: number;
  requiresEscalation?: boolean;
}

/**
 * Log a tool execution to the tool_executions table.
 */
async function logToolExecution(log: LogParams): Promise<void> {
  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const duration = log.duration_ms ?? (Date.now() - log.startTime);

    await admin.from("tool_executions").insert({
      task_id: log.context.taskId,
      organization_id: log.context.orgId,
      tool_id: log.tool.id,
      agent_group: log.context.agentGroup,
      risk_level: log.context.riskLevel,
      tier: log.context.tier,
      trace_id: log.context.traceId,
      status: log.status,
      input_params: sanitizeParams(log.params),
      output: log.output ?? null,
      duration_ms: duration,
      tokens_used: log.tokensUsed ?? 0,
      error: log.error ?? null,
      requires_escalation: log.requiresEscalation ?? false,
      sandbox_config: log.sandbox ?? null,
      attempt_number: log.attemptNumber ?? 1,
      completed_at: log.status === "completed" || log.status === "failed" ? now : null,
    });
  } catch (err) {
    console.error("Failed to log tool execution (non-fatal):", err);
  }
}

/**
 * Get recent tool executions, optionally filtered. For the admin dashboard.
 */
export async function getToolExecutions(params: {
  orgId?: string;
  toolId?: string;
  status?: string;
  agentGroup?: string;
  limit?: number;
  offset?: number;
}): Promise<{ executions: ToolExecutionRecord[]; total: number }> {
  const admin = createAdminClient();
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  let query = admin
    .from("tool_executions")
    .select("*", { count: "exact" });

  if (params.orgId) query = query.eq("organization_id", params.orgId);
  if (params.toolId) query = query.eq("tool_id", params.toolId);
  if (params.status) query = query.eq("status", params.status);
  if (params.agentGroup) query = query.eq("agent_group", params.agentGroup);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Failed to fetch tool executions:", error);
    return { executions: [], total: 0 };
  }

  return {
    executions: (data ?? []) as unknown as ToolExecutionRecord[],
    total: count ?? 0,
  };
}

/**
 * Get aggregate execution stats for the admin dashboard.
 */
export async function getToolExecutionStats(orgId?: string): Promise<{
  total: number;
  completed: number;
  failed: number;
  denied: number;
  avgDurationMs: number;
  escalationCount: number;
}> {
  const admin = createAdminClient();

  let query = admin
    .from("tool_executions")
    .select("status, duration_ms, requires_escalation");

  if (orgId) query = query.eq("organization_id", orgId);

  const { data, error } = await query;

  if (error || !data) {
    return { total: 0, completed: 0, failed: 0, denied: 0, avgDurationMs: 0, escalationCount: 0 };
  }

  const total = data.length;
  const completed = data.filter((r) => r.status === "completed").length;
  const failed = data.filter((r) => r.status === "failed").length;
  const denied = data.filter((r) => r.status === "denied").length;
  const totalDuration = data.reduce((sum, r) => sum + (r.duration_ms || 0), 0);
  const avgDurationMs = total > 0 ? Math.round(totalDuration / total) : 0;
  const escalationCount = data.filter((r) => r.requires_escalation).length;

  return { total, completed, failed, denied, avgDurationMs, escalationCount };
}

// ─── Helpers ────────────────────────────────────────────────────────────

function createFailureResult(toolId: string, startTime: number, error: string): ToolExecutionResult {
  return {
    success: false,
    toolId,
    output: null,
    duration_ms: Date.now() - startTime,
    error,
  };
}

/** Determine if an error is transient and worth retrying. */
function isTransientError(error?: string): boolean {
  if (!error) return false;
  const transientPatterns = [
    "timeout",
    "ETIMEDOUT",
    "ECONNRESET",
    "ECONNREFUSED",
    "503",
    "502",
    "429",
    "rate limit",
    "temporarily unavailable",
    "network error",
  ];
  const lower = error.toLowerCase();
  return transientPatterns.some((p) => lower.includes(p.toLowerCase()));
}

/** Determine if a failed tool execution warrants escalation. */
function shouldEscalate(tool: AgentTool, attempts: number): boolean {
  // Always escalate critical tool failures
  if (tool.riskTier === "critical") return true;
  // Escalate elevated tools that exhausted retries
  if (tool.riskTier === "elevated" && attempts >= MAX_RETRY_ATTEMPTS) return true;
  // Escalate any tool that exhausted all retries
  if (attempts >= MAX_RETRY_ATTEMPTS) return true;
  return false;
}

/** Remove sensitive data from params before logging. */
function sanitizeParams(params: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ["password", "secret", "token", "api_key", "apiKey", "auth", "credential"];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
