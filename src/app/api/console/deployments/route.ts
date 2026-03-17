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
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const requestId = url.searchParams.get("request_id");
    const environment = url.searchParams.get("environment");
    const status = url.searchParams.get("status");
    const limit = url.searchParams.get("limit");

    let query = supabase
      .from("deployments")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (requestId) query = query.eq("request_id", requestId);
    if (environment) query = query.eq("environment", environment);
    if (status) query = query.eq("status", status);
    if (limit) query = query.limit(parseInt(limit, 10));

    const { data: deployments, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch deployments" }, { status: 500 });
    }

    return NextResponse.json({ deployments: deployments || [] });
  } catch (error) {
    console.error("List deployments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deployments" },
      { status: 500 }
    );
  }
}
