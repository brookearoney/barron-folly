import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateClarifyingQuestions } from "@/lib/ai/claude";
import { findSimilarTasks } from "@/lib/ai/embeddings";
import {
  buildOrgContext,
  buildDesignDirective,
  buildMemoryLogContext,
  buildSimilarTasksContext,
} from "@/lib/ai/context";
import type { Organization } from "@/lib/console/types";

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { request_id } = await req.json();
    if (!request_id) {
      return NextResponse.json(
        { error: "request_id is required" },
        { status: 400 }
      );
    }

    // Get the request and verify ownership
    const { data: request, error: reqError } = await supabase
      .from("requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (reqError || !request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (request.ai_phase !== "clarifying") {
      return NextResponse.json(
        { error: `Invalid AI phase: ${request.ai_phase}. Expected 'clarifying'.` },
        { status: 400 }
      );
    }

    // Get the org with AI context
    const admin = createAdminClient();
    const { data: org } = await admin
      .from("organizations")
      .select("*")
      .eq("id", request.organization_id)
      .single();

    if (!org || !org.business_dossier) {
      return NextResponse.json(
        { error: "Organization not configured for AI" },
        { status: 400 }
      );
    }

    const typedOrg = org as unknown as Organization;

    // Get the user's profile for the client name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // Build context
    const orgContext = buildOrgContext(typedOrg);
    const designDirective = buildDesignDirective(typedOrg);
    const memoryLogContext = buildMemoryLogContext(typedOrg.memory_log || []);

    // RAG: find similar past tasks
    let similarTasksContext = "(No similar past tasks found)";
    try {
      const similar = await findSimilarTasks(
        request.organization_id,
        `${request.title}\n${request.description}`,
        5
      );
      similarTasksContext = buildSimilarTasksContext(similar);
    } catch {
      // RAG is non-critical, continue without it
    }

    // Generate clarifying questions (streaming)
    const { stream, getResult } = await generateClarifyingQuestions(
      request.title,
      request.description,
      profile?.full_name || "Client",
      orgContext,
      memoryLogContext,
      similarTasksContext,
      designDirective
    );

    // Save the result asynchronously after stream completes
    getResult().then(async (clarificationData) => {
      try {
        await admin
          .from("requests")
          .update({
            ai_clarification_data: clarificationData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", request_id);
      } catch (err) {
        console.error("Failed to save clarification data:", err);
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("AI clarify error:", error);
    return NextResponse.json(
      { error: "Failed to generate clarification questions" },
      { status: 500 }
    );
  }
}
