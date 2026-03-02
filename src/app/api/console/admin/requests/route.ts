import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const admin = createAdminClient();
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const orgId = searchParams.get("org_id");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const offset = (page - 1) * limit;

    let query = admin
      .from("requests")
      .select("*, organization:organizations(id, name, slug, tier)", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (orgId) query = query.eq("organization_id", orgId);
    if (priority) query = query.eq("priority", priority);
    if (search) query = query.ilike("title", `%${search}%`);

    const { data: requests, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      requests: requests || [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Admin list requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
