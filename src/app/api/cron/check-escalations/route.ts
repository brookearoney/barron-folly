import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cron endpoint to check for tasks needing escalation.
 * - Finds all blocked tasks where blocked_at > 2 hours ago
 * - Creates notification records for admin review
 * - Future: will send Slack alert (Phase 2.1)
 *
 * Protected by CRON_SECRET in the Authorization header.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    // Find blocked tasks older than 2 hours
    const { data: blockedTasks, error } = await admin
      .from("orchestrator_queue")
      .select("id, organization_id, title, blocked_at, blocked_reason, request_id")
      .eq("status", "blocked")
      .lt("blocked_at", twoHoursAgo);

    if (error) throw error;

    const escalations: string[] = [];

    if (blockedTasks?.length) {
      for (const task of blockedTasks) {
        // Check if we already created a notification for this task recently (within 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count } = await admin
          .from("activity_log")
          .select("*", { count: "exact", head: true })
          .eq("action", "queue_escalation")
          .gt("created_at", oneHourAgo)
          .contains("details", { task_id: task.id });

        if ((count ?? 0) > 0) continue; // Already notified recently

        await admin.from("activity_log").insert({
          organization_id: task.organization_id,
          request_id: task.request_id,
          actor_id: null,
          action: "queue_escalation",
          details: {
            task_id: task.id,
            task_title: task.title,
            blocked_at: task.blocked_at,
            reason: task.blocked_reason || "Unknown",
            escalation_type: "blocked_timeout",
          },
        });

        escalations.push(task.id);
      }
    }

    // Also find failed tasks that have remaining attempts
    const { data: failedRetryable } = await admin
      .from("orchestrator_queue")
      .select("id, organization_id, title, attempt_count, max_attempts, request_id")
      .eq("status", "failed");

    let retryableCount = 0;
    if (failedRetryable?.length) {
      for (const task of failedRetryable) {
        if (task.attempt_count < task.max_attempts) {
          retryableCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      escalationsCreated: escalations.length,
      escalatedTaskIds: escalations,
      retryableFailedTasks: retryableCount,
    });
  } catch (error) {
    console.error("Escalation check error:", error);
    return NextResponse.json(
      { error: "Failed to check escalations" },
      { status: 500 }
    );
  }
}
