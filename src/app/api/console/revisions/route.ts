import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { dispatchNotification } from "@/lib/console/notification-dispatcher";

export async function POST(req: Request) {
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
      .select("organization_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { approval_id, revision_notes } = await req.json();

    if (!approval_id || !revision_notes) {
      return NextResponse.json(
        { error: "approval_id and revision_notes are required" },
        { status: 400 }
      );
    }

    // Get the approval
    const { data: approval, error: approvalError } = await supabase
      .from("approvals")
      .select("*, request:requests(id, title, organization_id)")
      .eq("id", approval_id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (approvalError || !approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    // Set the approval decision to revision_requested
    await supabase
      .from("approvals")
      .update({
        decision: "revision_requested",
        decision_notes: revision_notes,
        decided_by: user.id,
        decided_at: new Date().toISOString(),
      })
      .eq("id", approval_id);

    // Create a revision_requests record
    const { data: revision, error: revisionError } = await supabase
      .from("revision_requests")
      .insert({
        approval_id,
        request_id: approval.request_id,
        organization_id: profile.organization_id,
        requested_by: user.id,
        revision_notes,
      })
      .select()
      .single();

    if (revisionError) throw revisionError;

    // Log activity
    await supabase.from("activity_log").insert({
      request_id: approval.request_id,
      organization_id: profile.organization_id,
      actor_id: user.id,
      action: "revision_requested",
      details: {
        approval_id,
        revision_id: revision.id,
        notes: revision_notes,
      },
    });

    // Send notification
    await dispatchNotification({
      organizationId: profile.organization_id,
      type: "approval",
      title: `Revisions requested: ${approval.title}`,
      body: revision_notes,
      requestId: approval.request_id,
      referenceId: revision.id,
    });

    return NextResponse.json({ revision });
  } catch (error) {
    console.error("Create revision error:", error);
    return NextResponse.json(
      { error: "Failed to create revision request" },
      { status: 500 }
    );
  }
}

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

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("request_id");
    const approvalId = searchParams.get("approval_id");

    let query = supabase
      .from("revision_requests")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (requestId) {
      query = query.eq("request_id", requestId);
    }
    if (approvalId) {
      query = query.eq("approval_id", approvalId);
    }

    const { data: revisions, error } = await query;

    if (error) throw error;

    return NextResponse.json({ revisions });
  } catch (error) {
    console.error("List revisions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revisions" },
      { status: 500 }
    );
  }
}
