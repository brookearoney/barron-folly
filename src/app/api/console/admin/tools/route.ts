import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { getAllTools, getToolCountsByRiskTier } from "@/lib/agent/tool-registry";
import { getAllGroupCapabilities } from "@/lib/agent/group-capabilities";
import { getToolExecutions, getToolExecutionStats } from "@/lib/agent/tool-runner";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get("orgId") || undefined;
    const toolId = url.searchParams.get("toolId") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const agentGroup = url.searchParams.get("agentGroup") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    const [executionsResult, stats, tools, riskTierCounts, capabilities] = await Promise.all([
      getToolExecutions({ orgId, toolId, status, agentGroup, limit, offset }),
      getToolExecutionStats(orgId),
      Promise.resolve(getAllTools()),
      Promise.resolve(getToolCountsByRiskTier()),
      Promise.resolve(getAllGroupCapabilities()),
    ]);

    return NextResponse.json({
      executions: executionsResult.executions,
      total: executionsResult.total,
      stats,
      tools,
      riskTierCounts,
      capabilities,
    });
  } catch (error) {
    console.error("Admin tools API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tool data" },
      { status: 500 }
    );
  }
}
