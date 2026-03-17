import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getArtifact, getArtifactVersions, createArtifactVersion } from "@/lib/artifacts/manager";

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

    // Verify org membership
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile || profile.organization_id !== artifact.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const versions = await getArtifactVersions(id);
    return NextResponse.json({ versions });
  } catch (error) {
    console.error("List artifact versions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch artifact versions" },
      { status: 500 }
    );
  }
}

export async function POST(
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
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile || profile.organization_id !== artifact.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { content, changes_summary, metadata } = body;

    if (!changes_summary) {
      return NextResponse.json(
        { error: "changes_summary is required" },
        { status: 400 }
      );
    }

    const newVersion = await createArtifactVersion(id, {
      content,
      changes_summary,
      metadata,
    });

    return NextResponse.json({ artifact: newVersion }, { status: 201 });
  } catch (error) {
    console.error("Create artifact version error:", error);
    return NextResponse.json(
      { error: "Failed to create artifact version" },
      { status: 500 }
    );
  }
}
