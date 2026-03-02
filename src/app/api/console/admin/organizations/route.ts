import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createLinearTeamAndProject } from "@/lib/linear/client";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const admin = createAdminClient();
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search");

    let query = admin
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data: organizations, error } = await query;
    if (error) throw error;

    // Get member and request counts per org
    const orgIds = (organizations || []).map((o) => o.id);

    const [{ data: memberCounts }, { data: requestCounts }] = await Promise.all([
      admin.from("profiles").select("organization_id").in("organization_id", orgIds),
      admin.from("requests").select("organization_id, status").in("organization_id", orgIds),
    ]);

    const countsByOrg = orgIds.reduce(
      (acc, id) => {
        acc[id] = {
          members: (memberCounts || []).filter((p) => p.organization_id === id).length,
          requests: (requestCounts || []).filter((r) => r.organization_id === id).length,
          activeRequests: (requestCounts || []).filter(
            (r) =>
              r.organization_id === id &&
              ["submitted", "backlog", "todo", "in_progress", "in_review"].includes(r.status)
          ).length,
        };
        return acc;
      },
      {} as Record<string, { members: number; requests: number; activeRequests: number }>
    );

    const enriched = (organizations || []).map((org) => ({
      ...org,
      _counts: countsByOrg[org.id] || { members: 0, requests: 0, activeRequests: 0 },
    }));

    return NextResponse.json({ organizations: enriched });
  } catch (error) {
    console.error("List orgs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const admin = createAdminClient();
    const {
      name,
      slug,
      tier,
      tier_price,
      max_concurrent_requests,
    } = await req.json();

    if (!name || !slug || !tier) {
      return NextResponse.json(
        { error: "Name, slug, and tier are required" },
        { status: 400 }
      );
    }

    // Auto-create Linear team + project for this organization
    let linearTeamId: string | null = null;
    let linearProjectId: string | null = null;

    if (process.env.LINEAR_API_KEY) {
      try {
        const linear = await createLinearTeamAndProject(name);
        linearTeamId = linear.teamId;
        linearProjectId = linear.projectId;
      } catch (linearError) {
        console.error("Linear team/project creation failed:", linearError);
        // Continue creating the org without Linear — admin can link later
      }
    }

    const { data: org, error } = await admin
      .from("organizations")
      .insert({
        name,
        slug,
        tier,
        tier_price: tier_price || 0,
        linear_team_id: linearTeamId,
        linear_project_id: linearProjectId,
        max_concurrent_requests: max_concurrent_requests || 2,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        organization: org,
        linear_created: !!(linearTeamId && linearProjectId),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create org error:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
