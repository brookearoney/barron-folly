import { startRunLog, completeRunLog, failRunLog } from "@/lib/console/run-logs";
import type { AgentFlowType } from "@/lib/console/types";

/**
 * Higher-order function that wraps an AI call with automatic run logging.
 * Starts a log before calling fn, completes on success, fails on error (re-throws).
 */
export async function withRunLogging<T>(
  params: {
    orgId?: string;
    requestId?: string;
    flow: AgentFlowType;
    inputSummary: string;
  },
  fn: () => Promise<T>
): Promise<T> {
  const runLogId = await startRunLog({
    orgId: params.orgId,
    requestId: params.requestId,
    flow: params.flow,
    inputSummary: params.inputSummary,
  });

  try {
    const result = await fn();

    await completeRunLog(runLogId, {
      outputSummary: `${params.flow} completed successfully`,
    });

    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await failRunLog(runLogId, errorMessage);
    throw err;
  }
}

/**
 * Start a run log and return the ID for manual completion/failure.
 * Use this for streaming routes where completion happens asynchronously.
 */
export async function startStreamRunLog(params: {
  orgId?: string;
  requestId?: string;
  flow: AgentFlowType;
  inputSummary: string;
}): Promise<string> {
  return startRunLog({
    orgId: params.orgId,
    requestId: params.requestId,
    flow: params.flow,
    inputSummary: params.inputSummary,
  });
}

export { completeRunLog, failRunLog };
