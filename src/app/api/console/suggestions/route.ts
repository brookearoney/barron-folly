import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET: List suggestions for the user's org (optionally filter by status)
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

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check for status filter in query params
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");

    let query = supabase
      .from("org_suggestions")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data: suggestions, error } = await query;

    if (error) throw error;

    return NextResponse.json({ suggestions: suggestions || [] });
  } catch (error) {
    console.error("List suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
