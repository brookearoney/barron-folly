import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dequeueNext, updateTaskStatus } from "@/lib/console/orchestrator";
import type { OrchestratorTask } from "@/lib/console/types";

/**
 * Cron endpoint to process the orchestrator queue.
 * - Dequeues next available tasks (up to 5 per invocation)
 * - Checks for blocked tasks > 2 hours and flags for escalation
 * - Checks for stale "running" tasks > 30 min and marks as stuck
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
    const summary = {
      tasksDequeued: 0,
      blockedEscalated: 0,
      staleMarked: 0,
    };

    // Dequeue up to 5 tasks
    const dequeuedTasks: OrchestratorTask[] = [];
    for (let i = 0; i < 5; i++) {
      const task = await dequeueNext();
      if (!task) break;
      dequeuedTasks.push(task);
      summary.tasksDequeued++;

      // For now, mark as running — actual agent execution wired in Phase 4
      await updateTaskStatus(task.id, "running");
    }

    // Check for blocked tasks > 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: blockedTasks } = await admin
      .from("orchestrator_queue")
      .select("id, organization_id, title, blocked_at, blocked_reason")
      .eq("status", "blocked")
      .lt("blocked_at", twoHoursAgo);

    if (blockedTasks?.length) {
      for (const blocked of blockedTasks) {
        // Create notification for admin
        await admin.from("activity_log").insert({
          organization_id: blocked.organization_id,
          actor_id: null,
          action: "queue_escalation",
          details: {
            task_id: blocked.id,
            task_title: blocked.title,
            reason: `Task blocked for >2 hours: ${blocked.blocked_reason || "No reason given"}`,
          },
        });
        summary.blockedEscalated++;
      }
    }

    // Check for stale running tasks > 30 min
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: staleTasks } = await admin
      .from("orchestrator_queue")
      .select("id, organization_id, title")
      .eq("status", "running")
      .lt("started_at", thirtyMinAgo);

    if (staleTasks?.length) {
      for (const stale of staleTasks) {
        await admin.from("activity_log").insert({
          organization_id: stale.organization_id,
          actor_id: null,
          action: "queue_stale_warning",
          details: {
            task_id: stale.id,
            task_title: stale.title,
            reason: "Task running for >30 minutes — potentially stuck",
          },
        });
        summary.staleMarked++;
      }
    }

    return NextResponse.json({
      success: true,
      ...summary,
      dequeuedTaskIds: dequeuedTasks.map((t) => t.id),
    });
  } catch (error) {
    console.error("Queue processing error:", error);
    return NextResponse.json(
      { error: "Failed to process queue" },
      { status: 500 }
    );
  }
}
