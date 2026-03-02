import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { linearRequest } from "@/lib/linear/client";
import { CREATE_ISSUE } from "@/lib/linear/queries";

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
      .select("linear_team_id, linear_project_id, name")
      .eq("id", profile.organization_id)
      .single();

    const { title, description, category, priority } = await req.json();

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Title, description, and category are required" },
        { status: 400 }
      );
    }

    // Create the request in Supabase first
    const { data: request, error: insertError } = await supabase
      .from("requests")
      .insert({
        organization_id: profile.organization_id,
        created_by: user.id,
        title,
        description,
        category,
        priority: priority || "medium",
        status: "submitted",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Create Linear issue if org has Linear configured
    const teamId = org?.linear_team_id || process.env.LINEAR_TEAM_ID;
    if (teamId && process.env.LINEAR_API_KEY) {
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
        }>(CREATE_ISSUE, { input });

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

    // Log activity
    await supabase.from("activity_log").insert({
      request_id: request.id,
      organization_id: profile.organization_id,
      actor_id: user.id,
      action: "request_created",
      details: { title, category, priority: priority || "medium" },
    });

    return NextResponse.json({ request }, { status: 201 });
  } catch (error) {
    console.error("Create request error:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}
