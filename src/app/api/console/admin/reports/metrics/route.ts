import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import {
  getTimeToFirstResponse,
  getCycleTime,
  getThroughput,
  getValueDelivered,
  getAIMetrics,
  getApprovalMetrics,
  getQueueHealth,
} from "@/lib/console/metrics";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const orgId = searchParams.get("orgId") || undefined;
    const periodDays = parseInt(searchParams.get("periodDays") || "30", 10);

    if (!type) {
      return NextResponse.json(
        { error: "Missing required query param: type" },
        { status: 400 },
      );
    }

    let data: unknown;

    switch (type) {
      case "ttfr":
        data = await getTimeToFirstResponse({ orgId, periodDays });
        break;
      case "cycle_time":
        data = await getCycleTime({ orgId, periodDays });
        break;
      case "throughput":
        data = await getThroughput({
          orgId,
          periodDays,
          groupBy: (searchParams.get("groupBy") as "day" | "week" | "month") || "day",
        });
        break;
      case "value":
        if (!orgId) {
          return NextResponse.json(
            { error: "orgId is required for value metrics" },
            { status: 400 },
          );
        }
        data = await getValueDelivered({ orgId, periodDays });
        break;
      case "ai":
        data = await getAIMetrics({ orgId, periodDays });
        break;
      case "approvals":
        data = await getApprovalMetrics({ orgId, periodDays });
        break;
      case "queue":
        data = await getQueueHealth({ orgId });
        break;
      default:
        return NextResponse.json(
          { error: `Unknown metric type: ${type}` },
          { status: 400 },
        );
    }

    return NextResponse.json({ type, data });
  } catch (error) {
    console.error("Admin metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 },
    );
  }
}
