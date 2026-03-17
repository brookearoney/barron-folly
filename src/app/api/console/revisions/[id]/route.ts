import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { dispatchNotification } from "@/lib/console/notification-dispatcher";

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

    const { data: revision, error } = await supabase
      .from("revision_requests")
      .select("*")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (error || !revision) {
      return NextResponse.json({ error: "Revision not found" }, { status: 404 });
    }

    return NextResponse.json({ revision });
  } catch (error) {
    console.error("Get revision error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revision" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { status } = await req.json();
    const validStatuses = ["pending", "in_progress", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required (pending, in_progress, completed, cancelled)" },
        { status: 400 }
      );
    }

    // Get the revision
    const { data: revision, error: revisionError } = await supabase
      .from("revision_requests")
      .select("*")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (revisionError || !revision) {
      return NextResponse.json({ error: "Revision not found" }, { status: 404 });
    }

    // Update the revision
    const updateData: Record<string, unknown> = { status };
    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("revision_requests")
      .update(updateData)
      .eq("id", id);

    if (updateError) throw updateError;

    // When completed, reset the approval decision so it can be re-approved
    if (status === "completed") {
      await supabase
        .from("approvals")
        .update({
          decision: null,
          decision_notes: null,
          decided_by: null,
          decided_at: null,
        })
        .eq("id", revision.approval_id);

      // Send notification that revision is complete and approval is ready for re-review
      const { data: approval } = await supabase
        .from("approvals")
        .select("title, request_id")
        .eq("id", revision.approval_id)
        .single();

      if (approval) {
        await dispatchNotification({
          organizationId: profile.organization_id,
          type: "approval",
          title: `Revisions complete: ${approval.title}`,
          body: "The requested revisions have been completed. Please review again.",
          requestId: approval.request_id,
          referenceId: revision.approval_id,
        });
      }
    }

    // Log activity
    await supabase.from("activity_log").insert({
      request_id: revision.request_id,
      organization_id: profile.organization_id,
      actor_id: user.id,
      action: "revision_status_updated",
      details: {
        revision_id: id,
        approval_id: revision.approval_id,
        new_status: status,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update revision error:", error);
    return NextResponse.json(
      { error: "Failed to update revision" },
      { status: 500 }
    );
  }
}
