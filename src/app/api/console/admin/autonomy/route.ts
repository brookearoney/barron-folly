import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { resolveAutonomy } from "@/lib/agent/autonomy-engine";
import { getHistoricalConfidence, calculateConfidence } from "@/lib/agent/confidence";
import { getEscalationHistory } from "@/lib/agent/escalation";
import {
  listOverrides,
  createOverride,
  deactivateOverride,
} from "@/lib/agent/autonomy-overrides";
import { getClientPolicy } from "@/lib/console/policies";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Tier,
  RequestCategory,
  AutonomyLevel,
} from "@/lib/console/types";

// ─── GET: Autonomy config, overrides, escalation history for an org ──────

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = request.nextUrl;
    const orgId = searchParams.get("org_id");
    const category = searchParams.get("category") as RequestCategory | null;
    const includeEscalations = searchParams.get("include_escalations") === "true";
    const includeOverrides = searchParams.get("include_overrides") !== "false";

    if (!orgId) {
      return NextResponse.json(
        { error: "org_id is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch org info
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .select("id, name, slug, tier")
      .eq("id", orgId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const tier = org.tier as Tier;

    // Build response in parallel
    const promises: Promise<unknown>[] = [];

    // 1. Policy
    promises.push(getClientPolicy(orgId));

    // 2. Overrides
    if (includeOverrides) {
      promises.push(listOverrides(orgId, true));
    } else {
      promises.push(Promise.resolve([]));
    }

    // 3. Escalation history
    if (includeEscalations) {
      promises.push(getEscalationHistory({ orgId, limit: 50 }));
    } else {
      promises.push(Promise.resolve({ events: [], total: 0 }));
    }

    // 4. Historical confidence for category (if specified)
    if (category) {
      promises.push(getHistoricalConfidence(orgId, category));
    } else {
      promises.push(Promise.resolve(null));
    }

    const [policy, overrides, escalations, confidenceFactors] = await Promise.all(promises);

    // 5. Compute autonomy decisions per category if no specific category
    let autonomyLevels: Record<string, { level: AutonomyLevel; confidence: number }> | null = null;

    if (!category && policy) {
      const categories: RequestCategory[] = [
        "web_platform", "automation", "design_system", "integration",
        "internal_tool", "seo", "content", "brand", "ai_agent", "other",
      ];

      autonomyLevels = {};
      for (const cat of categories) {
        try {
          const decision = await resolveAutonomy({
            orgId,
            tier,
            category: cat,
            riskLevel: "low",
            riskScore: 20,
            complexity: "moderate",
            agentGroup: "ops",
            hasHistoricalSuccess: false,
            policy: policy as import("@/lib/console/types").ClientPolicy,
          });
          autonomyLevels[cat] = {
            level: decision.level,
            confidence: decision.confidence,
          };
        } catch {
          autonomyLevels[cat] = { level: "suggest", confidence: 0 };
        }
      }
    }

    return NextResponse.json({
      org: { id: org.id, name: org.name, slug: org.slug, tier },
      policy,
      overrides,
      escalations,
      confidenceFactors,
      autonomyLevels,
    });
  } catch (error) {
    console.error("Admin autonomy GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch autonomy config" },
      { status: 500 }
    );
  }
}

// ─── POST: Create autonomy override ─────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const {
      organization_id,
      scope,
      scope_value,
      max_autonomy_level,
      reason,
      expires_at,
    } = body;

    if (!organization_id || !scope || !max_autonomy_level || !reason) {
      return NextResponse.json(
        {
          error:
            "organization_id, scope, max_autonomy_level, and reason are required",
        },
        { status: 400 }
      );
    }

    const validScopes = ["org", "category", "task"];
    if (!validScopes.includes(scope)) {
      return NextResponse.json(
        { error: `Invalid scope. Must be one of: ${validScopes.join(", ")}` },
        { status: 400 }
      );
    }

    const validLevels: AutonomyLevel[] = [
      "suggest",
      "auto_draft",
      "auto_execute",
      "full_auto",
    ];
    if (!validLevels.includes(max_autonomy_level)) {
      return NextResponse.json(
        {
          error: `Invalid max_autonomy_level. Must be one of: ${validLevels.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if ((scope === "category" || scope === "task") && !scope_value) {
      return NextResponse.json(
        { error: "scope_value is required for category and task scopes" },
        { status: 400 }
      );
    }

    const override = await createOverride({
      organization_id,
      scope,
      scope_value: scope_value || null,
      max_autonomy_level,
      reason,
      created_by: auth.user!.id,
      expires_at: expires_at || null,
      active: true,
    });

    return NextResponse.json({ override }, { status: 201 });
  } catch (error) {
    console.error("Admin autonomy POST error:", error);
    return NextResponse.json(
      { error: "Failed to create autonomy override" },
      { status: 500 }
    );
  }
}

// ─── PATCH: Update/deactivate override ───────────────────────────────────

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { override_id, action } = body;

    if (!override_id) {
      return NextResponse.json(
        { error: "override_id is required" },
        { status: 400 }
      );
    }

    if (action === "deactivate") {
      await deactivateOverride(override_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid action. Supported: deactivate" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin autonomy PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update autonomy override" },
      { status: 500 }
    );
  }
}
