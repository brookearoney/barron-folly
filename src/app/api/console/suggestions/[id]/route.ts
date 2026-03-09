import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// PATCH: Dismiss or mark a suggestion as requested
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status, request_id } = await req.json();

    if (!status || !["dismissed", "requested"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'dismissed' or 'requested'" },
        { status: 400 }
      );
    }

    // Verify the user owns this suggestion via their org
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (request_id) {
      updateData.request_id = request_id;
    }

    const { data: suggestion, error } = await supabase
      .from("org_suggestions")
      .update(updateData)
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Update suggestion error:", error);
    return NextResponse.json(
      { error: "Failed to update suggestion" },
      { status: 500 }
    );
  }
}
