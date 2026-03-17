import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientPolicy, upsertClientPolicy, getDefaultPolicyForTier } from "@/lib/console/policies";
import type { Tier } from "@/lib/console/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;

    // Check org exists and get tier
    const admin = createAdminClient();
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .select("id, tier")
      .eq("id", id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    let policy = await getClientPolicy(id);

    // If no policy exists, create one with tier defaults
    if (!policy) {
      const defaults = getDefaultPolicyForTier(org.tier as Tier);
      policy = await upsertClientPolicy(id, defaults);
    }

    return NextResponse.json({
      policy,
      tier: org.tier,
      defaults: getDefaultPolicyForTier(org.tier as Tier),
    });
  } catch (error) {
    console.error("Get policy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch policy" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const updates = await req.json();

    // Validate org exists
    const admin = createAdminClient();
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .select("id")
      .eq("id", id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Only allow specific fields
    const allowedFields = [
      "allowed_categories",
      "blocked_categories",
      "allowed_environments",
      "risk_level",
      "regulated",
      "requires_human_approval_above",
      "auto_approve_categories",
      "max_concurrent_agent_tasks",
      "autopilot_enabled",
      "autopilot_categories",
      "code_conventions",
      "do_not_do",
      "prod_change_blackout_hours",
    ];

    const safeUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        safeUpdates[key] = updates[key];
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const policy = await upsertClientPolicy(id, safeUpdates);

    return NextResponse.json({ policy });
  } catch (error) {
    console.error("Update policy error:", error);
    return NextResponse.json(
      { error: "Failed to update policy" },
      { status: 500 }
    );
  }
}
