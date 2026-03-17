import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createArtifact, getArtifactsByRequest, getArtifactsByTask, getArtifactsByOrg } from "@/lib/artifacts/manager";
import type { ArtifactType, ArtifactFormat, ArtifactStatus } from "@/lib/artifacts/types";

export async function GET(request: NextRequest) {
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

    const { searchParams } = request.nextUrl;
    const requestId = searchParams.get("request_id");
    const taskId = searchParams.get("task_id");
    const type = searchParams.get("type") as ArtifactType | null;
    const status = searchParams.get("status") as ArtifactStatus | null;
    const limit = searchParams.get("limit");

    let artifacts;

    if (requestId) {
      artifacts = await getArtifactsByRequest(requestId);
    } else if (taskId) {
      artifacts = await getArtifactsByTask(taskId);
    } else {
      artifacts = await getArtifactsByOrg(profile.organization_id, {
        type: type || undefined,
        status: status || undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      });
    }

    return NextResponse.json({ artifacts });
  } catch (error) {
    console.error("List artifacts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch artifacts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      requestId,
      taskId,
      type,
      format,
      name,
      description,
      content,
      metadata,
    } = body;

    if (!type || !format || !name) {
      return NextResponse.json(
        { error: "type, format, and name are required" },
        { status: 400 }
      );
    }

    const artifact = await createArtifact({
      orgId: profile.organization_id,
      requestId,
      taskId,
      type: type as ArtifactType,
      format: format as ArtifactFormat,
      name,
      description,
      content,
      metadata,
      createdBy: user.id,
    });

    return NextResponse.json({ artifact }, { status: 201 });
  } catch (error) {
    console.error("Create artifact error:", error);
    return NextResponse.json(
      { error: "Failed to create artifact" },
      { status: 500 }
    );
  }
}
