import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Artifact, ArtifactType, ArtifactStatus } from "@/lib/artifacts/types";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = request.nextUrl;
    const orgId = searchParams.get("org_id");
    const type = searchParams.get("type") as ArtifactType | null;
    const status = searchParams.get("status") as ArtifactStatus | null;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const offset = (page - 1) * limit;

    const supabase = createAdminClient();

    // Fetch artifacts with org join
    let query = supabase
      .from("artifacts")
      .select("*, organization:organizations(id, name, slug, tier)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (orgId) query = query.eq("organization_id", orgId);
    if (type) query = query.eq("type", type);
    if (status) query = query.eq("status", status);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch artifacts" }, { status: 500 });
    }

    // Compute analytics
    const statsQuery = supabase.from("artifacts").select("type, status, quality_score, reviewed_at, created_at");
    const { data: allForStats } = orgId
      ? await statsQuery.eq("organization_id", orgId)
      : await statsQuery;

    const statsData = (allForStats || []) as Array<{
      type: string;
      status: string;
      quality_score: number | null;
      reviewed_at: string | null;
      created_at: string;
    }>;

    const countByType: Record<string, number> = {};
    const countByStatus: Record<string, number> = {};
    let totalQuality = 0;
    let qualityCount = 0;
    let totalReviewTimeMs = 0;
    let reviewCount = 0;

    for (const row of statsData) {
      countByType[row.type] = (countByType[row.type] || 0) + 1;
      countByStatus[row.status] = (countByStatus[row.status] || 0) + 1;

      if (row.quality_score !== null) {
        totalQuality += row.quality_score;
        qualityCount++;
      }

      if (row.reviewed_at) {
        const reviewMs = new Date(row.reviewed_at).getTime() - new Date(row.created_at).getTime();
        totalReviewTimeMs += reviewMs;
        reviewCount++;
      }
    }

    const analytics = {
      countByType,
      countByStatus,
      avgQualityScore: qualityCount > 0 ? Math.round(totalQuality / qualityCount) : null,
      avgReviewTimeMs: reviewCount > 0 ? Math.round(totalReviewTimeMs / reviewCount) : null,
      total: statsData.length,
    };

    return NextResponse.json({
      artifacts: (data || []) as Artifact[],
      total: count || 0,
      page,
      limit,
      analytics,
    });
  } catch (error) {
    console.error("Admin list artifacts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch artifacts" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { artifactIds, action, notes } = body;

    if (!artifactIds || !Array.isArray(artifactIds) || artifactIds.length === 0) {
      return NextResponse.json({ error: "artifactIds array is required" }, { status: 400 });
    }

    if (!action || !["approve", "reject", "archive"].includes(action)) {
      return NextResponse.json(
        { error: "action must be approve, reject, or archive" },
        { status: 400 }
      );
    }

    if (action === "reject" && !notes) {
      return NextResponse.json({ error: "notes required for rejection" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    let updateData: Record<string, unknown>;

    switch (action) {
      case "approve":
        updateData = {
          status: "approved",
          reviewed_by: auth.user!.id,
          reviewed_at: now,
          review_notes: notes || null,
          updated_at: now,
        };
        break;
      case "reject":
        updateData = {
          status: "rejected",
          reviewed_by: auth.user!.id,
          reviewed_at: now,
          review_notes: notes,
          updated_at: now,
        };
        break;
      case "archive":
        updateData = {
          status: "archived",
          updated_at: now,
        };
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const { error } = await supabase
      .from("artifacts")
      .update(updateData)
      .in("id", artifactIds);

    if (error) {
      throw new Error(`Bulk update failed: ${error.message}`);
    }

    return NextResponse.json({ success: true, updated: artifactIds.length });
  } catch (error) {
    console.error("Admin bulk artifact update error:", error);
    return NextResponse.json(
      { error: "Failed to update artifacts" },
      { status: 500 }
    );
  }
}
