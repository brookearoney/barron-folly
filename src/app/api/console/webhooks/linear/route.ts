import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LINEAR_STATE_TO_STATUS, STATUS_LABELS } from "@/lib/console/constants";
import { sendOrgNotificationEmails } from "@/lib/email/notify";
import { sendApprovalPacket, sendErrorAlert, sendStatusUpdate } from "@/lib/slack/messages";
import type { NotificationType } from "@/lib/console/types";
import crypto from "crypto";

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.LINEAR_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const digest = hmac.digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

async function createNotification(
  supabase: ReturnType<typeof createAdminClient>,
  params: {
    organization_id: string;
    type: NotificationType;
    title: string;
    body?: string | null;
    request_id?: string | null;
    reference_id?: string | null;
  }
) {
  const { error } = await supabase.from("notifications").insert({
    organization_id: params.organization_id,
    type: params.type,
    title: params.title,
    body: params.body || null,
    request_id: params.request_id || null,
    reference_id: params.reference_id || null,
  });
  if (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("linear-signature");

    // Enforce webhook signature verification
    if (!process.env.LINEAR_WEBHOOK_SECRET) {
      console.error("LINEAR_WEBHOOK_SECRET is not configured — rejecting webhook");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { action, type, data } = payload;

    const supabase = createAdminClient();

    // Idempotency: deduplicate using a composite event key
    const eventKey = `${type}:${action}:${data.id}:${data.updatedAt || data.createdAt || ""}`;
    const { error: dedupError } = await supabase
      .from("webhook_events")
      .insert({ id: eventKey });

    if (dedupError) {
      // Unique constraint violation = already processed
      if (dedupError.code === "23505") {
        return NextResponse.json({ ok: true, skipped: "duplicate event" });
      }
      console.error("Dedup check error:", dedupError);
    }

    // Handle Issue updates
    if (type === "Issue") {
      const linearIssueId = data.id;

      // Find the request linked to this Linear issue
      const { data: request } = await supabase
        .from("requests")
        .select("id, organization_id, status, title")
        .eq("linear_issue_id", linearIssueId)
        .single();

      if (!request) {
        return NextResponse.json({ ok: true, skipped: "no matching request" });
      }

      if (action === "update" && data.state?.name) {
        const newStatus = LINEAR_STATE_TO_STATUS[data.state.name];
        if (newStatus && newStatus !== request.status) {
          await supabase
            .from("requests")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", request.id);

          await supabase.from("activity_log").insert({
            request_id: request.id,
            organization_id: request.organization_id,
            action: "status_changed",
            details: { from: request.status, to: newStatus, source: "linear" },
          });

          // Create notification for status changes
          const isCompletion = newStatus === "done" || newStatus === "shipped";
          const fromLabel = STATUS_LABELS[request.status as keyof typeof STATUS_LABELS] || request.status;
          const toLabel = STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS] || newStatus;

          const statusNotifType: NotificationType = isCompletion ? "completion" : "status_change";
          const statusNotifTitle = isCompletion
            ? `"${request.title}" is complete`
            : `"${request.title}" moved to ${toLabel}`;
          const statusNotifBody = isCompletion
            ? `Your request has been marked as ${toLabel}.`
            : `Status changed from ${fromLabel} to ${toLabel}.`;

          await createNotification(supabase, {
            organization_id: request.organization_id,
            type: statusNotifType,
            title: statusNotifTitle,
            body: statusNotifBody,
            request_id: request.id,
          });

          // Send email (fire-and-forget)
          sendOrgNotificationEmails({
            organization_id: request.organization_id,
            type: statusNotifType,
            title: statusNotifTitle,
            body: statusNotifBody,
            request_id: request.id,
            new_status: newStatus,
          }).catch(() => {});

          // Send Slack status update (fire-and-forget)
          const { data: statusOrg } = await supabase
            .from("organizations")
            .select("name")
            .eq("id", request.organization_id)
            .single();

          sendStatusUpdate({
            requestId: request.id,
            orgName: statusOrg?.name || "Unknown",
            status: toLabel,
            title: request.title,
          }).catch(() => {});
        }
      }
    }

    // Handle Comment events
    if (type === "Comment" && action === "create") {
      const issueId = data.issueId || data.issue?.id;
      if (!issueId) {
        return NextResponse.json({ ok: true, skipped: "no issue id" });
      }

      const { data: request } = await supabase
        .from("requests")
        .select("id, organization_id, title")
        .eq("linear_issue_id", issueId)
        .single();

      if (!request) {
        return NextResponse.json({ ok: true, skipped: "no matching request" });
      }

      const body = data.body || "";

      // Check for [CLARIFICATION] tag (supports threading: [CLARIFICATION:follow-up:<parent_id>])
      if (body.startsWith("[CLARIFICATION]")) {
        let question: string;
        let parentId: string | null = null;

        const followUpMatch = body.match(/^\[CLARIFICATION:follow-up:([a-f0-9-]+)\]/);
        if (followUpMatch) {
          parentId = followUpMatch[1];
          question = body.replace(followUpMatch[0], "").trim();
        } else {
          question = body.replace("[CLARIFICATION]", "").trim();
        }

        const { data: clarification } = await supabase
          .from("clarifications")
          .insert({
            request_id: request.id,
            organization_id: request.organization_id,
            question,
            linear_comment_id: data.id,
            parent_id: parentId,
            status: "pending",
          })
          .select("id")
          .single();

        await supabase.from("activity_log").insert({
          request_id: request.id,
          organization_id: request.organization_id,
          action: "clarification_asked",
          details: { question },
        });

        // Create notification
        const clarifNotifBody = question.length > 200 ? question.substring(0, 200) + "..." : question;
        await createNotification(supabase, {
          organization_id: request.organization_id,
          type: "clarification",
          title: `Question on "${request.title}"`,
          body: clarifNotifBody,
          request_id: request.id,
          reference_id: clarification?.id || null,
        });

        // Send email (fire-and-forget)
        sendOrgNotificationEmails({
          organization_id: request.organization_id,
          type: "clarification",
          title: `Question on "${request.title}"`,
          body: clarifNotifBody,
        }).catch(() => {});
      }
      // Check for [APPROVAL] tag
      else if (body.startsWith("[APPROVAL]")) {
        const lines = body.replace("[APPROVAL]", "").trim().split("\n");
        const parsed: Record<string, string> = {};
        let currentKey = "";
        for (const line of lines) {
          const match = line.match(/^\*\*(.+?):\*\*\s*(.*)/);
          if (match) {
            currentKey = match[1].toLowerCase().replace(/\s/g, "_");
            parsed[currentKey] = match[2];
          } else if (currentKey) {
            parsed[currentKey] += "\n" + line;
          }
        }

        const approvalTitle = parsed.title || "Approval Required";
        const riskLevel = (parsed.risk_level || "medium") as "low" | "medium" | "high";

        // Require rollback_plan for high-risk approvals
        if (riskLevel === "high" && !parsed.rollback_plan?.trim()) {
          await supabase.from("activity_log").insert({
            request_id: request.id,
            organization_id: request.organization_id,
            action: "approval_rejected",
            details: {
              reason: "High-risk approvals require a rollback_plan field",
              title: approvalTitle,
            },
          });
          return NextResponse.json({
            ok: false,
            error: "High-risk approvals require a rollback_plan",
          }, { status: 400 });
        }

        const { data: approval } = await supabase
          .from("approvals")
          .insert({
            request_id: request.id,
            organization_id: request.organization_id,
            title: approvalTitle,
            summary: parsed.summary || body,
            impact: parsed.impact || null,
            artifacts_url: parsed.artifacts_url || parsed.artifacts || null,
            risk_level: riskLevel,
            rollback_plan: parsed.rollback_plan || null,
          })
          .select("id")
          .single();

        await supabase.from("activity_log").insert({
          request_id: request.id,
          organization_id: request.organization_id,
          action: "approval_created",
          details: { title: approvalTitle },
        });

        // Create notification
        const approvalNotifBody = `${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} risk — ${parsed.summary || "Review required"}`.substring(0, 300);
        await createNotification(supabase, {
          organization_id: request.organization_id,
          type: "approval",
          title: `Approval needed: ${approvalTitle}`,
          body: approvalNotifBody,
          request_id: request.id,
          reference_id: approval?.id || null,
        });

        // Send email (fire-and-forget)
        sendOrgNotificationEmails({
          organization_id: request.organization_id,
          type: "approval",
          title: `Approval needed: ${approvalTitle}`,
          body: approvalNotifBody,
          reference_id: approval?.id || null,
        }).catch(() => {});

        // Send Slack approval packet (fire-and-forget)
        if (approval?.id) {
          const { data: approvalOrg } = await supabase
            .from("organizations")
            .select("name")
            .eq("id", request.organization_id)
            .single();

          sendApprovalPacket({
            id: approval.id,
            title: approvalTitle,
            summary: parsed.summary || body,
            impact: parsed.impact || null,
            risk_level: riskLevel,
            rollback_plan: parsed.rollback_plan || null,
            artifacts_url: parsed.artifacts_url || parsed.artifacts || null,
            request_id: request.id,
            org_name: approvalOrg?.name || "Unknown",
          }).catch(() => {});
        }
      }
      // Regular comment
      else {
        await supabase.from("activity_log").insert({
          request_id: request.id,
          organization_id: request.organization_id,
          action: "comment_added",
          details: {
            body: body.substring(0, 500),
            source: "linear",
            author: data.user?.name || "Unknown",
          },
        });

        // Create notification for comments
        await createNotification(supabase, {
          organization_id: request.organization_id,
          type: "comment",
          title: `New update on "${request.title}"`,
          body: body.substring(0, 200),
          request_id: request.id,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);

    // Send error alert to Slack (fire-and-forget)
    sendErrorAlert({
      flow: "linear-webhook",
      orgName: "Unknown",
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
