import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkSLAStatusWithCreatedAt } from "@/lib/console/sla";
import type { OrchestratorTask } from "@/lib/console/types";

/**
 * Cron endpoint to check all active tasks for SLA compliance.
 * - Tasks "at_risk" (>75% of SLA elapsed): creates a notification
 * - Tasks "breached" (past deadline): creates urgent notification + activity log entry
 *
 * Protected by CRON_SECRET in the Authorization header.
 * Schedule: every 15 minutes via Vercel Cron or external scheduler.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    // Fetch all active tasks (queued, assigned, running, blocked) with SLA deadlines
    const { data: activeTasks, error } = await admin
      .from("orchestrator_queue")
      .select("*")
      .in("status", ["queued", "assigned", "running", "blocked"])
      .not("sla_deadline", "is", null);

    if (error) {
      throw new Error(`Failed to fetch active tasks: ${error.message}`);
    }

    const tasks = (activeTasks ?? []) as unknown as OrchestratorTask[];

    let atRiskCount = 0;
    let breachedCount = 0;
    let onTrackCount = 0;
    const notifications: Array<{ task_id: string; title: string; status: string }> = [];

    for (const task of tasks) {
      if (!task.sla_deadline) continue;

      const slaResult = checkSLAStatusWithCreatedAt({
        slaDeadline: task.sla_deadline,
        createdAt: task.created_at,
        currentStatus: task.status,
      });

      switch (slaResult.status) {
        case "on_track":
          onTrackCount++;
          break;

        case "at_risk":
          atRiskCount++;
          // Create at-risk notification for the org
          try {
            await admin.from("notifications").insert({
              organization_id: task.organization_id,
              type: "status_change",
              title: `SLA at risk: ${task.title}`,
              body: `Task "${task.title}" has ${Math.round(slaResult.hoursRemaining)}h remaining before SLA deadline (${Math.round(slaResult.percentElapsed)}% elapsed).`,
              request_id: task.request_id,
              reference_id: task.id,
            });
            notifications.push({ task_id: task.id, title: task.title, status: "at_risk" });
          } catch (err) {
            console.error("Failed to create at-risk notification:", err);
          }
          break;

        case "breached":
          breachedCount++;
          // Create urgent breach notification
          try {
            await admin.from("notifications").insert({
              organization_id: task.organization_id,
              type: "status_change",
              title: `SLA BREACHED: ${task.title}`,
              body: `Task "${task.title}" has exceeded its SLA deadline. Immediate attention required.`,
              request_id: task.request_id,
              reference_id: task.id,
            });

            // Also log in activity log
            await admin.from("activity_log").insert({
              organization_id: task.organization_id,
              request_id: task.request_id,
              actor_id: null,
              action: "sla_breached",
              details: {
                task_id: task.id,
                task_title: task.title,
                sla_deadline: task.sla_deadline,
                current_status: task.status,
                agent_group: task.agent_group,
                tier: task.tier,
              },
            });

            notifications.push({ task_id: task.id, title: task.title, status: "breached" });
          } catch (err) {
            console.error("Failed to create breach notification:", err);
          }
          break;
      }
    }

    return NextResponse.json({
      checked: tasks.length,
      on_track: onTrackCount,
      at_risk: atRiskCount,
      breached: breachedCount,
      notifications_created: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("SLA check error:", error);
    return NextResponse.json(
      { error: "Failed to check SLA status" },
      { status: 500 }
    );
  }
}
