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
    const orgId = searchParams.get("org_id");
    const search = searchParams.get("search");

    let query = admin
      .from("profiles")
      .select("*, organization:organizations(id, name, slug, tier)")
      .order("created_at", { ascending: false });

    if (orgId) {
      query = query.eq("organization_id", orgId);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query;
    if (error) throw error;

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error("List users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
