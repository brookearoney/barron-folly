import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import {
  getDashboardSummary,
  getTimeToFirstResponse,
  getCycleTime,
  getThroughput,
  getValueDelivered,
  getAIMetrics,
  getApprovalMetrics,
  getQueueHealth,
} from "@/lib/console/metrics";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId") || undefined;
    const periodDays = parseInt(searchParams.get("periodDays") || "30", 10);

    const admin = createAdminClient();

    // Gather all metrics
    const [summary, ttfr, cycleTime, throughput, aiMetrics, approvals, queueHealth] =
      await Promise.all([
        getDashboardSummary({ orgId, periodDays }),
        getTimeToFirstResponse({ orgId, periodDays }),
        getCycleTime({ orgId, periodDays }),
        getThroughput({ orgId, periodDays, groupBy: "day" }),
        getAIMetrics({ orgId, periodDays }),
        getApprovalMetrics({ orgId, periodDays }),
        getQueueHealth({ orgId }),
      ]);

    // If orgId provided, include value metrics
    let value = null;
    if (orgId) {
      value = await getValueDelivered({ orgId, periodDays });
    }

    // Get org info if filtered
    let orgName: string | null = null;
    if (orgId) {
      const { data: org } = await admin
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .single();
      orgName = org?.name ?? null;
    }

    const report = {
      generatedAt: new Date().toISOString(),
      period: {
        days: periodDays,
        start: new Date(Date.now() - periodDays * 86_400_000).toISOString(),
        end: new Date().toISOString(),
      },
      organization: orgId ? { id: orgId, name: orgName } : null,
      summary,
      timeToFirstResponse: ttfr,
      cycleTime,
      throughput,
      aiMetrics,
      approvals,
      queueHealth,
      value,
    };

    return NextResponse.json(report, {
      headers: {
        "Content-Disposition": `attachment; filename="bf-report-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error("Report export error:", error);
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 },
    );
  }
}
