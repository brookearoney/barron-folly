import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  updateTaskStatus,
  cancelTask,
  retryTask,
} from "@/lib/console/orchestrator";
import type { AgentGroup, QueueStatus } from "@/lib/console/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const admin = createAdminClient();

    const { data: task, error } = await admin
      .from("orchestrator_queue")
      .select("*, organization:organizations(id, name, slug, tier)")
      .eq("id", id)
      .single();

    if (error || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Admin get queue task error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { action, status, priority, agentGroup, reason } = body;

    const admin = createAdminClient();

    // Handle specific actions
    if (action === "cancel") {
      await cancelTask(id, reason);
      return NextResponse.json({ success: true, action: "cancelled" });
    }

    if (action === "retry") {
      const task = await retryTask(id);
      return NextResponse.json({ success: true, action: "retried", task });
    }

    // General updates
    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      await updateTaskStatus(id, status as QueueStatus, {
        blockedReason: reason,
      });
    }

    if (priority !== undefined) update.priority = priority;
    if (agentGroup) update.agent_group = agentGroup as AgentGroup;

    if (Object.keys(update).length > 1) {
      const { error } = await admin
        .from("orchestrator_queue")
        .update(update)
        .eq("id", id);

      if (error) throw error;
    }

    // Return updated task
    const { data: task } = await admin
      .from("orchestrator_queue")
      .select("*, organization:organizations(id, name, slug, tier)")
      .eq("id", id)
      .single();

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Admin update queue task error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    await cancelTask(id, "Cancelled via admin API");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin cancel queue task error:", error);
    return NextResponse.json(
      { error: "Failed to cancel task" },
      { status: 500 }
    );
  }
}
