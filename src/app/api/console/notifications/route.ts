import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

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
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const url = new URL(req.url);
    const filter = url.searchParams.get("filter"); // 'unread', 'action_required', or null (all)
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

    let query = supabase
      .from("notifications")
      .select("*, request:requests(id, title, linear_issue_key, status)")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filter === "unread") {
      query = query.eq("read", false);
    } else if (filter === "action_required") {
      query = query.eq("read", false).in("type", ["clarification", "approval"]);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Fetch notifications error:", error);
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }

    // Also get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("read", false);

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: unreadCount ?? 0,
    });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// Mark all as read
export async function PATCH(req: Request) {
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
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const body = await req.json();

    if (body.mark_all_read) {
      await supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("organization_id", profile.organization_id)
        .eq("read", false);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Mark all read error:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
