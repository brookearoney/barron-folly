import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { constructTaskPlan } from "@/lib/ai/claude";
import { findSimilarTasks, storeTaskEmbedding } from "@/lib/ai/embeddings";
import {
  buildOrgContext,
  buildDesignDirective,
  buildMemoryLogContext,
  buildSimilarTasksContext,
  buildQAThread,
} from "@/lib/ai/context";
import { linearRequest } from "@/lib/linear/client";
import { CREATE_ISSUE, CREATE_ISSUE_RELATION } from "@/lib/linear/queries";
import { enqueueTask } from "@/lib/console/orchestrator";
import { routeToAgentGroup } from "@/lib/console/agent-router";
import type { Organization, AiClarificationData, MemoryLogEntry } from "@/lib/console/types";

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

    if (request.ai_phase !== "clarified") {
      return NextResponse.json(
        { error: `Invalid AI phase: ${request.ai_phase}. Expected 'clarified'.` },
        { status: 400 }
      );
    }

    // Mark as constructing
    await supabase
      .from("requests")
      .update({ ai_phase: "constructing", updated_at: new Date().toISOString() })
      .eq("id", request_id);

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

    // Build context
    const orgContext = buildOrgContext(typedOrg);
    const designDirective = buildDesignDirective(typedOrg);
    const memoryLogContext = buildMemoryLogContext(typedOrg.memory_log || []);

    // Build Q&A thread from clarification data
    const clarData = request.ai_clarification_data as AiClarificationData;
    const qaThread = buildQAThread(clarData.questions);

    // RAG: find similar past tasks
    let similarTasksContext = "(No similar past tasks found)";
    try {
      const similar = await findSimilarTasks(
        request.organization_id,
        request.description,
        5
      );
      similarTasksContext = buildSimilarTasksContext(similar);
    } catch {
      // RAG is non-critical
    }

    const originalRequest = request.description;

    // Generate task plan (streaming)
    const { stream, getResult } = await constructTaskPlan(
      originalRequest,
      qaThread,
      orgContext,
      memoryLogContext,
      similarTasksContext,
      designDirective
    );

    // Process results after stream completes
    getResult().then(async (taskPlan) => {
      try {
        const teamId = org.linear_team_id || process.env.LINEAR_TEAM_ID;
        const projectId = org.linear_project_id || process.env.LINEAR_PROJECT_ID;
        const linearIssueIds: string[] = [];
        let firstIssueId: string | null = null;
        let firstIssueKey: string | null = null;
        let firstIssueUrl: string | null = null;

        // Create Linear issues from task plan
        // Track title → issue ID for dependency resolution
        const titleToIssueId: Record<string, string> = {};

        const aiTitle = taskPlan.request_title || request.title;

        if (teamId && process.env.LINEAR_API_KEY && taskPlan.tasks.length > 0) {
          for (const task of taskPlan.tasks) {
            try {
              const input: Record<string, unknown> = {
                teamId,
                title: `[${org.name}] ${task.title}`,
                description: [
                  `**Original Request:** ${aiTitle}`,
                  `**Priority:** ${task.priority}`,
                  `**Estimate:** ${task.estimate} point(s)`,
                  `**Labels:** ${task.labels.join(", ")}`,
                  "",
                  "---",
                  "",
                  task.description,
                  "",
                  "---",
                  `*AI-generated from request #${request.request_number}*`,
                ].join("\n"),
              };

              if (projectId) input.projectId = projectId;

              const result = await linearRequest<{
                issueCreate: {
                  success: boolean;
                  issue: { id: string; identifier: string; url: string };
                };
              }>(CREATE_ISSUE, { input });

              if (result.issueCreate?.success) {
                const issue = result.issueCreate.issue;
                linearIssueIds.push(issue.id);
                titleToIssueId[task.title] = issue.id;
                if (!firstIssueId) {
                  firstIssueId = issue.id;
                  firstIssueKey = issue.identifier;
                  firstIssueUrl = issue.url;
                }
              }
            } catch (err) {
              console.error("Failed to create Linear issue for task:", task.title, err);
            }
          }

          // Create dependency relations (type: "blocks")
          for (const task of taskPlan.tasks) {
            if (!task.dependencies?.length) continue;
            const dependentIssueId = titleToIssueId[task.title];
            if (!dependentIssueId) continue;

            for (const depTitle of task.dependencies) {
              const blockingIssueId = titleToIssueId[depTitle];
              if (!blockingIssueId) continue;

              try {
                await linearRequest<{
                  issueRelationCreate: {
                    success: boolean;
                    issueRelation: { id: string; type: string };
                  };
                }>(CREATE_ISSUE_RELATION, {
                  issueId: dependentIssueId,
                  relatedIssueId: blockingIssueId,
                  type: "blocks",
                });
              } catch (err) {
                console.error(
                  `Failed to create dependency: "${depTitle}" blocks "${task.title}"`,
                  err
                );
              }
            }
          }
        }

        // Update request with AI-generated fields, Linear info, and mark as constructed
        const updateData: Record<string, unknown> = {
          ai_phase: "constructed",
          updated_at: new Date().toISOString(),
        };

        // Apply AI-generated request metadata
        if (taskPlan.request_title) {
          updateData.title = taskPlan.request_title;
        }
        if (taskPlan.request_category) {
          updateData.category = taskPlan.request_category;
        }
        if (taskPlan.request_priority) {
          updateData.priority = taskPlan.request_priority;
        }

        if (firstIssueId) {
          updateData.linear_issue_id = firstIssueId;
          updateData.linear_issue_key = firstIssueKey;
          updateData.linear_issue_url = firstIssueUrl;
        }

        await admin
          .from("requests")
          .update(updateData)
          .eq("id", request_id);

        // Append memory log entry to org (use AI-generated title)
        const resolvedTitle = taskPlan.request_title || request.title;
        const memoryEntry: MemoryLogEntry = {
          timestamp: new Date().toISOString(),
          request_id: request_id,
          request_title: resolvedTitle,
          summary: taskPlan.session_summary,
          tags: taskPlan.session_tags,
          task_ids: linearIssueIds,
        };

        const currentLog = (typedOrg.memory_log || []) as MemoryLogEntry[];
        const updatedLog = [...currentLog, memoryEntry];

        await admin
          .from("organizations")
          .update({
            memory_log: updatedLog,
            updated_at: new Date().toISOString(),
          })
          .eq("id", request.organization_id);

        // Store task embeddings for RAG
        try {
          const embeddingContent = [
            `Request: ${resolvedTitle}`,
            `Description: ${request.description}`,
            `Summary: ${taskPlan.session_summary}`,
            `Tasks: ${taskPlan.tasks.map((t) => t.title).join(", ")}`,
            `Tags: ${taskPlan.session_tags.join(", ")}`,
          ].join("\n");

          await storeTaskEmbedding(
            request.organization_id,
            request_id,
            embeddingContent,
            {
              category: taskPlan.request_category || request.category,
              priority: taskPlan.request_priority || request.priority,
              task_count: taskPlan.tasks.length,
            }
          );
        } catch (err) {
          console.error("Failed to store task embedding (non-fatal):", err);
        }

        // Log activity
        await admin.from("activity_log").insert({
          request_id: request_id,
          organization_id: request.organization_id,
          actor_id: null,
          action: "ai_tasks_constructed",
          details: {
            task_count: taskPlan.tasks.length,
            linear_issue_ids: linearIssueIds,
            session_summary: taskPlan.session_summary,
          },
        });

        // Enqueue tasks into the orchestrator queue
        const resolvedCategory = taskPlan.request_category || request.category;
        for (const task of taskPlan.tasks) {
          const issueId = titleToIssueId[task.title] || null;
          try {
            await enqueueTask({
              organizationId: request.organization_id,
              requestId: request_id,
              linearIssueId: issueId ?? undefined,
              title: task.title,
              description: task.description,
              category: resolvedCategory,
              agentGroup: routeToAgentGroup(resolvedCategory, task.description),
              riskLevel: task.priority === "urgent" || task.priority === "high" ? "high" : task.priority === "medium" ? "medium" : "low",
              metadata: {
                labels: task.labels,
                estimate: task.estimate,
                dependencies: task.dependencies,
              },
            });
          } catch (enqueueErr) {
            console.error("Failed to enqueue task (non-fatal):", task.title, enqueueErr);
          }
        }
      } catch (err) {
        console.error("Post-construction processing error:", err);

        // Mark as failed on error
        await admin
          .from("requests")
          .update({
            ai_phase: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", request_id);
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
    console.error("AI construct error:", error);
    return NextResponse.json(
      { error: "Failed to construct task plan" },
      { status: 500 }
    );
  }
}
