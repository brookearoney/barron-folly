import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { getGlobalSuggestionMetrics, getSuggestionEffectiveness } from "@/lib/ai/suggestion-feedback";
import { runAllSuggestionCycles, expireOldSuggestions } from "@/lib/ai/suggestion-scheduler";

// GET: Global suggestion metrics + effectiveness
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [metrics, effectiveness] = await Promise.all([
      getGlobalSuggestionMetrics(),
      getSuggestionEffectiveness(),
    ]);

    return NextResponse.json({ metrics, effectiveness });
  } catch (error) {
    console.error("Global suggestion metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestion metrics" },
      { status: 500 }
    );
  }
}

// POST: Trigger suggestion cycle for all eligible orgs
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "generate";

    if (action === "expire") {
      const daysOld = body.daysOld || 90;
      const expired = await expireOldSuggestions(daysOld);
      return NextResponse.json({
        action: "expire",
        expired,
      });
    }

    // Default: run suggestion cycles for all orgs
    const results = await runAllSuggestionCycles();

    const totalGenerated = results.reduce((s, r) => s + r.generated, 0);
    const skippedOrgs = results.filter((r) => r.skipped);

    return NextResponse.json({
      action: "generate",
      totalGenerated,
      orgCount: results.length,
      skippedCount: skippedOrgs.length,
      results,
    });
  } catch (error) {
    console.error("Suggestion cycle error:", error);
    return NextResponse.json(
      { error: "Failed to run suggestion cycles" },
      { status: 500 }
    );
  }
}
