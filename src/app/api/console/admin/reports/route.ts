import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { getDashboardSummary } from "@/lib/console/metrics";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId") || undefined;
    const periodDays = parseInt(searchParams.get("periodDays") || "30", 10);

    const summary = await getDashboardSummary({ orgId, periodDays });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Admin reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch report summary" },
      { status: 500 },
    );
  }
}
