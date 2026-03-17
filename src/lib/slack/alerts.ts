import { sendErrorAlert } from "./messages";

/**
 * Sends a run failure alert to the #bf-alerts Slack channel.
 * Designed to be called from the run-logs system.
 * No-ops if Slack is not configured.
 */
export async function sendRunFailureAlert(params: {
  runId: string;
  flow: string;
  orgName: string;
  error: string;
  startedAt: string;
}): Promise<void> {
  await sendErrorAlert({
    flow: params.flow,
    orgName: params.orgName,
    message: `Run ${params.runId} failed: ${params.error}`,
    timestamp: params.startedAt,
  });
}
