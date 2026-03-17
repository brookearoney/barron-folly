import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { promoteToProductionDeployment } from "@/lib/console/deployments";

export async function POST(
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
      .select("organization_id, role")
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

    const result = await promoteToProductionDeployment(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Log activity
    await supabase.from("activity_log").insert({
      request_id: result.deployment?.request_id || null,
      organization_id: profile.organization_id,
      actor_id: user.id,
      action: "deployment_promoted",
      details: {
        deployment_id: id,
        production_deployment_id: result.deployment?.id,
      },
    });

    return NextResponse.json({
      success: true,
      deployment: result.deployment,
    });
  } catch (error) {
    console.error("Promote deployment error:", error);
    return NextResponse.json(
      { error: "Failed to promote deployment" },
      { status: 500 }
    );
  }
}
