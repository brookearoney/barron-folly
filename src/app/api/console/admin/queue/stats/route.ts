import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { getQueueStats } from "@/lib/console/orchestrator";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = request.nextUrl;
    const orgId = searchParams.get("org_id") ?? undefined;

    // Overall stats
    const stats = await getQueueStats(orgId);

    // Per-org breakdown (only when not filtering by org)
    let orgBreakdown: Record<string, { name: string; queued: number; running: number; blocked: number; completed: number }> | undefined;

    if (!orgId) {
      const admin = createAdminClient();
      const { data: tasks } = await admin
        .from("orchestrator_queue")
        .select("organization_id, status, organization:organizations(name)");

      if (tasks?.length) {
        orgBreakdown = {};
        for (const t of tasks) {
          const oid = t.organization_id;
          if (!orgBreakdown[oid]) {
            const orgName = (t.organization as unknown as { name: string })?.name ?? "Unknown";
            orgBreakdown[oid] = { name: orgName, queued: 0, running: 0, blocked: 0, completed: 0 };
          }
          const entry = orgBreakdown[oid];
          switch (t.status) {
            case "queued":
              entry.queued++;
              break;
            case "assigned":
            case "running":
              entry.running++;
              break;
            case "blocked":
              entry.blocked++;
              break;
            case "completed":
              entry.completed++;
              break;
          }
        }
      }
    }

    return NextResponse.json({ stats, orgBreakdown });
  } catch (error) {
    console.error("Admin queue stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue stats" },
      { status: 500 }
    );
  }
}
