import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEligibleForSuggestions, runSuggestionCycle } from "@/lib/ai/suggestion-scheduler";
import { getSuggestionMetrics, getSuggestionEffectiveness } from "@/lib/ai/suggestion-feedback";
import type { SuggestionCandidate } from "@/lib/console/types";
import { storeSuggestions } from "@/lib/ai/suggestions-engine";

// GET: Suggestion metrics + list for a specific org
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { orgId } = await params;
    const admin = createAdminClient();

    const [metrics, effectiveness, suggestionsResult, eligibility] =
      await Promise.all([
        getSuggestionMetrics(orgId),
        getSuggestionEffectiveness(orgId),
        admin
          .from("org_suggestions")
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false }),
        isEligibleForSuggestions(orgId),
      ]);

    return NextResponse.json({
      metrics,
      effectiveness,
      suggestions: suggestionsResult.data || [],
      eligibility,
    });
  } catch (error) {
    console.error("Org suggestion data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch org suggestion data" },
      { status: 500 }
    );
  }
}

// POST: Trigger suggestion cycle for a specific org or create manual suggestion
export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { orgId } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body.action || "generate";

    if (action === "manual") {
      // Create a manual suggestion from admin
      const { title, description, category, rationale, estimated_effort, priority } = body;

      if (!title || !description) {
        return NextResponse.json(
          { error: "title and description are required" },
          { status: 400 }
        );
      }

      const candidate: SuggestionCandidate = {
        title,
        description,
        category: category || null,
        rationale: rationale || "Manually created by admin",
        estimated_effort: estimated_effort || "TBD",
        priority: priority || "medium",
        confidence: 1.0,
        source: "admin",
        tags: ["admin-created"],
      };

      const stored = await storeSuggestions(orgId, [candidate]);

      return NextResponse.json({
        action: "manual",
        suggestion: stored[0],
      }, { status: 201 });
    }

    // Default: run AI suggestion cycle (skip eligibility for admin-triggered)
    const result = await runSuggestionCycle(orgId);

    return NextResponse.json({
      action: "generate",
      ...result,
    });
  } catch (error) {
    console.error("Org suggestion cycle error:", error);
    return NextResponse.json(
      { error: "Failed to run suggestion cycle" },
      { status: 500 }
    );
  }
}
