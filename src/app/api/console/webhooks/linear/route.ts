import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LINEAR_STATE_TO_STATUS } from "@/lib/console/constants";
import crypto from "crypto";

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.LINEAR_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const digest = hmac.digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("linear-signature");

    // Verify webhook signature if secret is configured
    if (process.env.LINEAR_WEBHOOK_SECRET) {
      if (!verifySignature(rawBody, signature)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const { action, type, data } = payload;

    const supabase = createAdminClient();

    // Handle Issue updates
    if (type === "Issue") {
      const linearIssueId = data.id;

      // Find the request linked to this Linear issue
      const { data: request } = await supabase
        .from("requests")
        .select("id, organization_id, status")
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
        .select("id, organization_id")
        .eq("linear_issue_id", issueId)
        .single();

      if (!request) {
        return NextResponse.json({ ok: true, skipped: "no matching request" });
      }

      const body = data.body || "";

      // Check for [CLARIFICATION] tag
      if (body.startsWith("[CLARIFICATION]")) {
        const question = body.replace("[CLARIFICATION]", "").trim();
        await supabase.from("clarifications").insert({
          request_id: request.id,
          organization_id: request.organization_id,
          question,
          linear_comment_id: data.id,
          status: "pending",
        });

        await supabase.from("activity_log").insert({
          request_id: request.id,
          organization_id: request.organization_id,
          action: "clarification_asked",
          details: { question },
        });
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

        await supabase.from("approvals").insert({
          request_id: request.id,
          organization_id: request.organization_id,
          title: parsed.title || "Approval Required",
          summary: parsed.summary || body,
          impact: parsed.impact || null,
          artifacts_url: parsed.artifacts_url || parsed.artifacts || null,
          risk_level: (parsed.risk_level || "medium") as "low" | "medium" | "high",
          rollback_plan: parsed.rollback_plan || null,
        });

        await supabase.from("activity_log").insert({
          request_id: request.id,
          organization_id: request.organization_id,
          action: "approval_created",
          details: { title: parsed.title || "Approval Required" },
        });
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
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
