import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getValueDelivered, getThroughput } from "@/lib/console/metrics";

export async function GET(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization" }, { status: 404 });
    }

    const orgId = profile.organization_id;
    const { searchParams } = new URL(req.url);
    const periodDays = parseInt(searchParams.get("periodDays") || "30", 10);

    // Fetch value + throughput + recent requests in parallel
    const [value, throughput, { data: recentRequests }] = await Promise.all([
      getValueDelivered({ orgId, periodDays }),
      getThroughput({ orgId, periodDays, groupBy: "day" }),
      supabase
        .from("requests")
        .select("id, title, category, status, created_at, updated_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    // Active requests count
    const activeStatuses = ["submitted", "backlog", "todo", "in_progress", "in_review"];
    const { count: activeRequests } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("status", activeStatuses);

    // Compute avg turnaround from completed requests in period
    const { data: completedReqs } = await supabase
      .from("requests")
      .select("created_at, updated_at")
      .eq("organization_id", orgId)
      .in("status", ["shipped", "done"])
      .gte("updated_at", new Date(Date.now() - periodDays * 86_400_000).toISOString());

    let avgTurnaroundHours = 0;
    if (completedReqs?.length) {
      const totalHours = completedReqs.reduce((sum, r) => {
        return sum + Math.abs(new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / 3_600_000;
      }, 0);
      avgTurnaroundHours = Math.round((totalHours / completedReqs.length) * 100) / 100;
    }

    return NextResponse.json({
      value,
      throughput,
      recentRequests: recentRequests || [],
      activeRequests: activeRequests ?? 0,
      avgTurnaroundHours,
    });
  } catch (error) {
    console.error("Client reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 },
    );
  }
}
