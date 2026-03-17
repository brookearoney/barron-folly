import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSuggestions } from "@/lib/ai/claude";
import {
  buildOrgContext,
  buildMemoryLogContext,
  buildTechStackContext,
} from "@/lib/ai/context";
import { withRunLogging } from "@/lib/ai/with-logging";
import type { Organization } from "@/lib/console/types";

// GET: List suggestions for an org
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
    const admin = createAdminClient();

    const { data: suggestions, error } = await admin
      .from("org_suggestions")
      .select("*")
      .eq("organization_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ suggestions: suggestions || [] });
  } catch (error) {
    console.error("List suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}

// POST: Generate new suggestions via AI
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const admin = createAdminClient();

    // Get org with full context
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .select("*")
      .eq("id", id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    if (!org.business_dossier) {
      return NextResponse.json(
        { error: "Organization needs AI onboarding before generating suggestions" },
        { status: 400 }
      );
    }

    const typedOrg = org as unknown as Organization;

    // Build context
    const orgDossier = buildOrgContext(typedOrg);
    const memoryLog = buildMemoryLogContext(typedOrg.memory_log || []);
    const techStack = buildTechStackContext(typedOrg);

    // Generate suggestions via Claude (with run logging)
    const result = await withRunLogging(
      { orgId: id, flow: "suggestions", inputSummary: `Generating suggestions for ${typedOrg.name}` },
      () => generateSuggestions(orgDossier, memoryLog, techStack)
    );

    // Insert suggestions into database
    const insertData = result.recommendations.map((rec) => ({
      organization_id: id,
      title: rec.title,
      description: rec.business_case,
      category: rec.category,
      rationale: rec.technical_rationale,
      estimated_effort: rec.estimated_scope,
      status: "active" as const,
    }));

    const { data: suggestions, error: insertError } = await admin
      .from("org_suggestions")
      .insert(insertData)
      .select();

    if (insertError) throw insertError;

    return NextResponse.json({ suggestions: suggestions || [] }, { status: 201 });
  } catch (error) {
    console.error("Generate suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
