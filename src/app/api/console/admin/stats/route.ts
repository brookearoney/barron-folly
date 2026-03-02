import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RequestStatus } from "@/lib/console/types";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const admin = createAdminClient();
    const activeStatuses: RequestStatus[] = [
      "submitted", "backlog", "todo", "in_progress", "in_review",
    ];

    const [
      { count: orgCount },
      { count: userCount },
      { count: totalRequests },
      { count: activeRequests },
      { count: pendingClarifications },
      { count: pendingApprovals },
      { data: recentActivity },
    ] = await Promise.all([
      admin.from("organizations").select("*", { count: "exact", head: true }),
      admin.from("profiles").select("*", { count: "exact", head: true }),
      admin.from("requests").select("*", { count: "exact", head: true }),
      admin
        .from("requests")
        .select("*", { count: "exact", head: true })
        .in("status", activeStatuses),
      admin
        .from("clarifications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      admin
        .from("approvals")
        .select("*", { count: "exact", head: true })
        .is("decision", null),
      admin
        .from("activity_log")
        .select("*, profile:profiles(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    return NextResponse.json({
      stats: {
        organizations: orgCount ?? 0,
        users: userCount ?? 0,
        totalRequests: totalRequests ?? 0,
        activeRequests: activeRequests ?? 0,
        pendingClarifications: pendingClarifications ?? 0,
        pendingApprovals: pendingApprovals ?? 0,
      },
      recentActivity: recentActivity || [],
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
