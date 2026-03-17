import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getDeployPipeline } from "@/lib/console/deployments";
import type { QAStatus } from "@/lib/console/types";

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

    const { data: deployment, error } = await supabase
      .from("deployments")
      .select("*")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (error || !deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    // Include pipeline status if deployment has a request
    let pipeline = null;
    if (deployment.request_id) {
      pipeline = await getDeployPipeline(deployment.request_id);
    }

    return NextResponse.json({ deployment, pipeline });
  } catch (error) {
    console.error("Get deployment error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deployment" },
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

    // Verify deployment belongs to user's org
    const { data: deployment } = await supabase
      .from("deployments")
      .select("id, organization_id")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    const body = await req.json();
    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Handle QA status update
    if (body.qa_status) {
      const validQA: QAStatus[] = ["pending", "passed", "failed", "skipped"];
      if (!validQA.includes(body.qa_status)) {
        return NextResponse.json({ error: "Invalid QA status" }, { status: 400 });
      }
      update.qa_status = body.qa_status;
      if (body.qa_notes !== undefined) update.qa_notes = body.qa_notes;
    }

    // Handle client approval
    if (body.client_approved !== undefined) {
      update.client_approved = body.client_approved;
      update.client_approved_at = new Date().toISOString();
      update.client_approved_by = user.id;
    }

    const { error: updateError } = await supabase
      .from("deployments")
      .update(update)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update deployment" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update deployment error:", error);
    return NextResponse.json(
      { error: "Failed to update deployment" },
      { status: 500 }
    );
  }
}
