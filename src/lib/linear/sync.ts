import { linearRequest } from "./client";
import { ADD_COMMENT } from "./queries";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Post a comment to a Linear issue with automatic retry queueing.
 * If the Linear API call fails, the operation is queued for later retry.
 */
export async function syncCommentToLinear(
  issueId: string,
  body: string,
  apiKey?: string | null
): Promise<{ synced: boolean }> {
  try {
    await linearRequest(ADD_COMMENT, { issueId, body }, apiKey);
    return { synced: true };
  } catch (err) {
    console.error("Linear sync failed, queueing for retry:", err);
    await queueSyncOperation("add_comment", { issueId, body, apiKey });
    return { synced: false };
  }
}

async function queueSyncOperation(
  operation: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("sync_queue").insert({
      operation,
      payload,
      status: "pending",
      next_retry_at: new Date().toISOString(),
    });
  } catch (queueErr) {
    console.error("Failed to queue sync operation:", queueErr);
  }
}

/**
 * Process pending items in the sync queue with exponential backoff.
 * Called by the cron retry endpoint.
 */
export async function processSyncQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  exhausted: number;
}> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: items, error } = await supabase
    .from("sync_queue")
    .select("*")
    .eq("status", "pending")
    .lte("next_retry_at", now)
    .order("created_at", { ascending: true })
    .limit(20);

  if (error || !items || items.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0, exhausted: 0 };
  }

  let succeeded = 0;
  let failed = 0;
  let exhausted = 0;

  for (const item of items) {
    const attempts = item.attempts + 1;

    try {
      if (item.operation === "add_comment") {
        const { issueId, body, apiKey } = item.payload as { issueId: string; body: string; apiKey?: string | null };
        await linearRequest(ADD_COMMENT, { issueId, body }, apiKey);
      } else {
        throw new Error(`Unknown sync operation: ${item.operation}`);
      }

      // Success — mark completed
      await supabase
        .from("sync_queue")
        .update({
          status: "completed",
          attempts,
          completed_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      succeeded++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (attempts >= item.max_attempts) {
        // Exhausted retries
        await supabase
          .from("sync_queue")
          .update({
            status: "failed",
            attempts,
            last_error: errorMessage,
          })
          .eq("id", item.id);
        exhausted++;
      } else {
        // Exponential backoff: 30s, 2min, 8min, 32min
        const backoffMs = Math.pow(4, attempts) * 7500;
        const nextRetry = new Date(Date.now() + backoffMs).toISOString();

        await supabase
          .from("sync_queue")
          .update({
            attempts,
            last_error: errorMessage,
            next_retry_at: nextRetry,
          })
          .eq("id", item.id);
        failed++;
      }
    }
  }

  return { processed: items.length, succeeded, failed, exhausted };
}
