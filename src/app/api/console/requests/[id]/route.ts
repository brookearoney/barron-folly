import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: request, error } = await supabase
      .from("requests")
      .select("*")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (error || !request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Fetch related data in parallel
    const [
      { data: attachments },
      { data: clarifications },
      { data: approvals },
      { data: activity },
    ] = await Promise.all([
      supabase
        .from("request_attachments")
        .select("*")
        .eq("request_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("clarifications")
        .select("*")
        .eq("request_id", id)
        .order("asked_at", { ascending: true }),
      supabase
        .from("approvals")
        .select("*")
        .eq("request_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("activity_log")
        .select("*, profile:profiles(full_name, email)")
        .eq("request_id", id)
        .order("created_at", { ascending: true }),
    ]);

    return NextResponse.json({
      request,
      attachments: attachments || [],
      clarifications: clarifications || [],
      approvals: approvals || [],
      activity: activity || [],
    });
  } catch (error) {
    console.error("Get request error:", error);
    return NextResponse.json(
      { error: "Failed to fetch request" },
      { status: 500 }
    );
  }
}
