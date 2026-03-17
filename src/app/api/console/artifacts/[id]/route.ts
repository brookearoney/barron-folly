import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  getArtifact,
  submitForReview,
  approveArtifact,
  rejectArtifact,
  publishArtifact,
  archiveArtifact,
} from "@/lib/artifacts/manager";
import { runQualityGates } from "@/lib/artifacts/quality-gates";

export async function GET(
  _request: NextRequest,
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
    const artifact = await getArtifact(id);

    if (!artifact) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }

    // Verify the user belongs to the same org
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile || profile.organization_id !== artifact.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ artifact });
  } catch (error) {
    console.error("Get artifact error:", error);
    return NextResponse.json(
      { error: "Failed to fetch artifact" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
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
    const artifact = await getArtifact(id);

    if (!artifact) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }

    // Verify org membership
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.organization_id !== artifact.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action, notes, published_url } = body;

    let updated;

    switch (action) {
      case "submit_review":
        updated = await submitForReview(id);
        break;

      case "approve":
        updated = await approveArtifact(id, user.id, notes);
        break;

      case "reject":
        if (!notes) {
          return NextResponse.json(
            { error: "Rejection notes are required" },
            { status: 400 }
          );
        }
        updated = await rejectArtifact(id, user.id, notes);
        break;

      case "publish":
        if (!published_url) {
          return NextResponse.json(
            { error: "published_url is required" },
            { status: 400 }
          );
        }
        updated = await publishArtifact(id, published_url);
        break;

      case "archive":
        updated = await archiveArtifact(id);
        break;

      case "run_quality_gates":
        const result = await runQualityGates(artifact, artifact.organization_id);
        return NextResponse.json({ quality: result });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ artifact: updated });
  } catch (error) {
    console.error("Update artifact error:", error);
    return NextResponse.json(
      { error: "Failed to update artifact" },
      { status: 500 }
    );
  }
}
