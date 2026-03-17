import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { getRunLogs, getRunLogStats } from "@/lib/console/run-logs";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get("orgId") || undefined;
    const flow = url.searchParams.get("flow") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    const [logsResult, stats] = await Promise.all([
      getRunLogs({ orgId, flow, status, limit, offset }),
      getRunLogStats(orgId),
    ]);

    return NextResponse.json({
      logs: logsResult.logs,
      total: logsResult.total,
      stats,
    });
  } catch (error) {
    console.error("Admin logs API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch run logs" },
      { status: 500 }
    );
  }
}
