import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { linearRequest } from "@/lib/linear/client";
import { CREATE_ISSUE } from "@/lib/linear/queries";
import { checkRequestEntitlement, checkCategoryEntitlement } from "@/lib/console/entitlements";
import { trackRequestUsage } from "@/lib/console/usage";
import { checkForDuplicates } from "@/lib/console/dedup";

// GET /api/console/requests — list requests for user's org
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
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("requests")
      .select("*", { count: "exact" })
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);

    const { data: requests, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({ requests, total: count, page, limit });
  } catch (error) {
    console.error("List requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

// POST /api/console/requests — create a new request
export async function POST(req: Request) {
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
      .select("organization_id, role, full_name")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("linear_team_id, linear_project_id, linear_api_key, name, business_dossier")
      .eq("id", profile.organization_id)
      .single();

    const isAiEnabled = !!org?.business_dossier;

    const { title, description, category, priority } = await req.json();

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    // Check entitlements before creating request
    const entitlement = await checkRequestEntitlement(profile.organization_id);
    if (!entitlement.allowed) {
      return NextResponse.json(
        { error: entitlement.reason, currentUsage: entitlement.currentUsage, limits: entitlement.limits },
        { status: 403 }
      );
    }

    // Check category entitlement if category is provided
    if (category) {
      const categoryEntitlement = await checkCategoryEntitlement(profile.organization_id, category);
      if (!categoryEntitlement.allowed) {
        return NextResponse.json(
          { error: categoryEntitlement.reason },
          { status: 403 }
        );
      }
    }

    // Check for duplicate/similar requests before creating
    let duplicateWarning: {
      hasDuplicate: boolean;
      similarRequests: Array<{
        id: string;
        title: string;
        status: string;
        similarity: number;
        created_at: string;
      }>;
    } | null = null;

    try {
      const dedupResult = await checkForDuplicates({
        orgId: profile.organization_id,
        title: title || description.slice(0, 80),
        description,
      });

      if (dedupResult.similarRequests.length > 0) {
        duplicateWarning = dedupResult;
      }
    } catch (dedupErr) {
      // Dedup is non-critical — proceed with request creation
      console.error("Dedup check error (non-fatal):", dedupErr);
    }

    // Auto-generate a title from the description if not provided
    const requestTitle = title || description.slice(0, 80).trim() + (description.length > 80 ? "..." : "");

    // Create the request in Supabase first
    const { data: request, error: insertError } = await supabase
      .from("requests")
      .insert({
        organization_id: profile.organization_id,
        created_by: user.id,
        title: requestTitle,
        description,
        category: category || "other",
        priority: priority || "medium",
        status: "submitted",
        ...(isAiEnabled ? { ai_phase: "clarifying" } : {}),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Skip Linear issue creation for AI-enabled orgs — tasks will be created after AI clarification
    // Create Linear issue only if org has Linear configured and is NOT AI-enabled
    const teamId = org?.linear_team_id || process.env.LINEAR_TEAM_ID;
    const linearApiKey = org?.linear_api_key || null;
    if (!isAiEnabled && teamId && (linearApiKey || process.env.LINEAR_API_KEY)) {
      try {
        const linearDesc = [
          `**Client:** ${org?.name || "Unknown"}`,
          `**Submitted by:** ${profile.full_name}`,
          `**Category:** ${category}`,
          `**Priority:** ${priority || "medium"}`,
          "",
          "---",
          "",
          description,
        ].join("\n");

        const input: Record<string, unknown> = {
          teamId,
          title: `[${org?.name || "Client"}] ${title}`,
          description: linearDesc,
        };

        const projectId = org?.linear_project_id || process.env.LINEAR_PROJECT_ID;
        if (projectId) input.projectId = projectId;

        const result = await linearRequest<{
          issueCreate: {
            success: boolean;
            issue: { id: string; identifier: string; url: string };
          };
        }>(CREATE_ISSUE, { input }, linearApiKey);

        if (result.issueCreate?.success) {
          const issue = result.issueCreate.issue;
          await supabase
            .from("requests")
            .update({
              linear_issue_id: issue.id,
              linear_issue_key: issue.identifier,
              linear_issue_url: issue.url,
            })
            .eq("id", request.id);

          request.linear_issue_id = issue.id;
          request.linear_issue_key = issue.identifier;
          request.linear_issue_url = issue.url;
        }
      } catch (linearErr) {
        console.error("Linear sync error (non-fatal):", linearErr);
      }
    }

    // Track usage
    await trackRequestUsage(profile.organization_id);

    // Log activity
    await supabase.from("activity_log").insert({
      request_id: request.id,
      organization_id: profile.organization_id,
      actor_id: user.id,
      action: "request_created",
      details: { title, category, priority: priority || "medium" },
    });

    return NextResponse.json({
      request,
      ai_enabled: isAiEnabled,
      ...(duplicateWarning ? { warning: "Similar open requests found", duplicates: duplicateWarning } : {}),
    }, { status: 201 });
  } catch (error) {
    console.error("Create request error:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}
