import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { linearRequest } from "@/lib/linear/client";
import { ADD_COMMENT } from "@/lib/linear/queries";

export async function PATCH(
  req: Request,
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
      .select("organization_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { answer } = await req.json();
    if (!answer) {
      return NextResponse.json({ error: "Answer is required" }, { status: 400 });
    }

    // Get the clarification
    const { data: clarification } = await supabase
      .from("clarifications")
      .select("*, request:requests(linear_issue_id, id, organization_id)")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!clarification) {
      return NextResponse.json({ error: "Clarification not found" }, { status: 404 });
    }

    // Update in Supabase
    await supabase
      .from("clarifications")
      .update({
        answer,
        answered_by: user.id,
        answered_at: new Date().toISOString(),
        status: "answered",
      })
      .eq("id", id);

    // Post answer as comment on Linear issue
    const request = clarification.request as { linear_issue_id: string | null; id: string; organization_id: string } | null;
    if (request?.linear_issue_id && process.env.LINEAR_API_KEY) {
      try {
        const commentBody = `**[CLIENT RESPONSE]** from ${profile.full_name}:\n\n> ${clarification.question}\n\n${answer}`;
        await linearRequest(ADD_COMMENT, {
          issueId: request.linear_issue_id,
          body: commentBody,
        });
      } catch (linearErr) {
        console.error("Linear comment sync error (non-fatal):", linearErr);
      }
    }

    // Log activity
    if (request) {
      await supabase.from("activity_log").insert({
        request_id: request.id,
        organization_id: request.organization_id,
        actor_id: user.id,
        action: "clarification_answered",
        details: { clarification_id: id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Answer clarification error:", error);
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}
