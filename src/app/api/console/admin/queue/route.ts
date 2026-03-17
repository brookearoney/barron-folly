import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { getQueueTasks, enqueueTask } from "@/lib/console/orchestrator";
import type { AgentGroup, QueueStatus, RiskLevel } from "@/lib/console/types";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = request.nextUrl;
    const orgId = searchParams.get("org_id") ?? undefined;
    const status = (searchParams.get("status") as QueueStatus) ?? undefined;
    const agentGroup = (searchParams.get("agent_group") as AgentGroup) ?? undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const offset = (page - 1) * limit;

    const { tasks, total } = await getQueueTasks({
      orgId,
      status,
      agentGroup,
      limit,
      offset,
    });

    return NextResponse.json({ tasks, total, page, limit });
  } catch (error) {
    console.error("Admin list queue error:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const {
      organizationId,
      requestId,
      linearIssueId,
      linearIssueKey,
      title,
      description,
      category,
      agentGroup,
      riskLevel,
      requiresApproval,
      metadata,
    } = body;

    if (!organizationId || !title) {
      return NextResponse.json(
        { error: "organizationId and title are required" },
        { status: 400 }
      );
    }

    const task = await enqueueTask({
      organizationId,
      requestId,
      linearIssueId,
      linearIssueKey,
      title,
      description,
      category,
      agentGroup: agentGroup as AgentGroup | undefined,
      riskLevel: riskLevel as RiskLevel | undefined,
      requiresApproval,
      metadata,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Admin enqueue error:", error);
    return NextResponse.json(
      { error: "Failed to enqueue task" },
      { status: 500 }
    );
  }
}
