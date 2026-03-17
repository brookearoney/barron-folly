import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { convertSuggestionToRequest } from "@/lib/ai/suggestions-engine";

// POST: Convert a suggestion into a formal request
export async function POST(
  _req: Request,
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

    // Verify user belongs to the org that owns this suggestion
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify suggestion belongs to user's org
    const { data: suggestion } = await supabase
      .from("org_suggestions")
      .select("organization_id")
      .eq("id", id)
      .single();

    if (!suggestion || suggestion.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    const result = await convertSuggestionToRequest(id, user.id);

    return NextResponse.json({
      suggestion: result.suggestion,
      requestId: result.requestId,
    }, { status: 201 });
  } catch (error) {
    console.error("Convert suggestion error:", error);
    const message = error instanceof Error ? error.message : "Failed to convert suggestion";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const { status, request_id, dismissed_reason } = await req.json();

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

    if (dismissed_reason && status === "dismissed") {
      updateData.dismissed_reason = dismissed_reason;
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
