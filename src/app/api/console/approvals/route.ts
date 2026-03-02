import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
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

    const { data: approvals, error } = await supabase
      .from("approvals")
      .select("*, request:requests(id, title, linear_issue_key)")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ approvals });
  } catch (error) {
    console.error("List approvals error:", error);
    return NextResponse.json(
      { error: "Failed to fetch approvals" },
      { status: 500 }
    );
  }
}
