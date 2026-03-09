import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const admin = createAdminClient();

    const [{ data: org, error }, { data: members }, { data: requests }] =
      await Promise.all([
        admin.from("organizations").select("*").eq("id", id).single(),
        admin
          .from("profiles")
          .select("*")
          .eq("organization_id", id)
          .order("created_at", { ascending: false }),
        admin
          .from("requests")
          .select("id, title, status, priority, category, created_at, linear_issue_key")
          .eq("organization_id", id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

    if (error || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organization: org,
      members: members || [],
      requests: requests || [],
    });
  } catch (error) {
    console.error("Get org error:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const admin = createAdminClient();
    const updates = await req.json();

    // Only allow specific fields to be updated
    const allowedFields = [
      "name", "slug", "tier", "tier_price",
      "linear_team_id", "linear_project_id",
      "max_concurrent_requests", "stripe_customer_id",
      "website_url", "business_dossier", "style_guide",
      "memory_log", "ai_onboarding_status",
    ];

    const safeUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        safeUpdates[key] = updates[key];
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    safeUpdates.updated_at = new Date().toISOString();

    const { data: org, error } = await admin
      .from("organizations")
      .update(safeUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ organization: org });
  } catch (error) {
    console.error("Update org error:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}
