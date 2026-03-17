import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { syncCommentToLinear } from "@/lib/linear/sync";
import type { ApprovalDecision } from "@/lib/console/types";

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
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: approval, error } = await supabase
      .from("approvals")
      .select("*, request:requests(id, title, linear_issue_key, linear_issue_id)")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (error || !approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    return NextResponse.json({ approval });
  } catch (error) {
    console.error("Get approval error:", error);
    return NextResponse.json(
      { error: "Failed to fetch approval" },
      { status: 500 }
    );
  }
}

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

    const { decision, decision_notes } = await req.json();
    const validDecisions: ApprovalDecision[] = ["approved", "denied", "revision_requested"];
    if (!decision || !validDecisions.includes(decision)) {
      return NextResponse.json({ error: "Valid decision is required" }, { status: 400 });
    }

    const { data: approval } = await supabase
      .from("approvals")
      .select("*, request:requests(id, organization_id, linear_issue_id)")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    // Update approval
    await supabase
      .from("approvals")
      .update({
        decision,
        decision_notes: decision_notes || null,
        decided_by: user.id,
        decided_at: new Date().toISOString(),
      })
      .eq("id", id);

    // Sync to Linear (with automatic retry on failure)
    const request = approval.request as { id: string; organization_id: string; linear_issue_id: string | null } | null;
    if (request?.linear_issue_id && process.env.LINEAR_API_KEY) {
      const emoji =
        decision === "approved" ? "✅" :
        decision === "denied" ? "❌" : "🔄";

      const commentBody = [
        `**${emoji} Client ${decision === "revision_requested" ? "requested revisions" : decision}**`,
        `Decided by: ${profile.full_name}`,
        decision_notes ? `\nNotes: ${decision_notes}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      await syncCommentToLinear(request.linear_issue_id, commentBody);
    }

    // When approved, update any associated deployments
    if (decision === "approved") {
      const { data: linkedDeployments } = await supabase
        .from("deployments")
        .select("id")
        .eq("approval_id", id);

      if (linkedDeployments && linkedDeployments.length > 0) {
        for (const dep of linkedDeployments) {
          await supabase
            .from("deployments")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", dep.id);
        }
      }
    }

    // Log activity
    if (request) {
      await supabase.from("activity_log").insert({
        request_id: request.id,
        organization_id: request.organization_id,
        actor_id: user.id,
        action: "approval_decided",
        details: { approval_id: id, decision },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Approval decision error:", error);
    return NextResponse.json(
      { error: "Failed to submit decision" },
      { status: 500 }
    );
  }
}
