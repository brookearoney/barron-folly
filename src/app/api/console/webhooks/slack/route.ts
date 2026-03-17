import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSlackClient } from "@/lib/slack/client";
import crypto from "crypto";

function verifySlackSignature(
  body: string,
  timestamp: string | null,
  signature: string | null
): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret || !timestamp || !signature) return false;

  // Reject requests older than 5 minutes to prevent replay attacks
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) return false;

  const sigBasestring = `v0:${timestamp}:${body}`;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(sigBasestring);
  const computed = `v0=${hmac.digest("hex")}`;

  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(signature)
  );
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const timestamp = req.headers.get("x-slack-request-timestamp");
    const signature = req.headers.get("x-slack-signature");

    // Handle URL verification challenge (no signature check needed for this)
    try {
      const parsed = JSON.parse(rawBody);
      if (parsed.type === "url_verification") {
        return NextResponse.json({ challenge: parsed.challenge });
      }
    } catch {
      // Body is URL-encoded (interactive payload), not JSON — continue
    }

    // Verify signature
    if (!verifySlackSignature(rawBody, timestamp, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse interactive payload (Slack sends as form-encoded)
    const params = new URLSearchParams(rawBody);
    const payloadStr = params.get("payload");
    if (!payloadStr) {
      return NextResponse.json({ error: "No payload" }, { status: 400 });
    }

    const payload = JSON.parse(payloadStr);

    if (payload.type === "block_actions") {
      const action = payload.actions?.[0];
      if (!action) {
        return NextResponse.json({ ok: true });
      }

      const approvalId = action.value;
      const actionId = action.action_id;
      const slackUser = payload.user?.real_name || payload.user?.name || "Unknown";
      const supabase = createAdminClient();

      if (actionId === "approve") {
        // Update approval in database
        await supabase
          .from("approvals")
          .update({
            decision: "approved",
            decision_notes: `Approved via Slack by ${slackUser}`,
            decided_at: new Date().toISOString(),
          })
          .eq("id", approvalId);

        // Update the Slack message to show approved
        const client = getSlackClient();
        if (client && payload.channel?.id && payload.message?.ts) {
          await client.chat.update({
            channel: payload.channel.id,
            ts: payload.message.ts,
            text: `Approved by ${slackUser}`,
            blocks: [
              ...(payload.message.blocks || []).filter(
                (b: { type: string }) => b.type !== "actions"
              ),
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `:white_check_mark: *Approved by ${slackUser}*`,
                },
              },
            ],
          });
        }
      } else if (actionId === "pause") {
        // Keep as pending, add a note
        await supabase
          .from("approvals")
          .update({
            decision_notes: `Paused via Slack by ${slackUser} at ${new Date().toISOString()}`,
          })
          .eq("id", approvalId);

        const client = getSlackClient();
        if (client && payload.channel?.id && payload.message?.ts) {
          await client.chat.update({
            channel: payload.channel.id,
            ts: payload.message.ts,
            text: `Paused by ${slackUser}`,
            blocks: [
              ...(payload.message.blocks || []).filter(
                (b: { type: string }) => b.type !== "actions"
              ),
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `:double_vertical_bar: *Paused by ${slackUser}*`,
                },
              },
            ],
          });
        }
      } else if (actionId === "change_request") {
        // Update approval to revision_requested
        await supabase
          .from("approvals")
          .update({
            decision: "revision_requested",
            decision_notes: `Changes requested via Slack by ${slackUser}`,
            decided_at: new Date().toISOString(),
          })
          .eq("id", approvalId);

        const client = getSlackClient();
        if (client && payload.channel?.id && payload.message?.ts) {
          await client.chat.update({
            channel: payload.channel.id,
            ts: payload.message.ts,
            text: `Changes requested by ${slackUser}`,
            blocks: [
              ...(payload.message.blocks || []).filter(
                (b: { type: string }) => b.type !== "actions"
              ),
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `:arrows_counterclockwise: *Changes requested by ${slackUser}*`,
                },
              },
            ],
          });
        }
      }

      // Log activity for all approval actions from Slack
      const { data: approval } = await supabase
        .from("approvals")
        .select("request_id, organization_id")
        .eq("id", approvalId)
        .single();

      if (approval) {
        await supabase.from("activity_log").insert({
          request_id: approval.request_id,
          organization_id: approval.organization_id,
          action: "approval_decided",
          details: {
            approval_id: approvalId,
            decision: actionId === "approve" ? "approved" : actionId === "change_request" ? "revision_requested" : "paused",
            source: "slack",
            slack_user: slackUser,
          },
        });
      }
    }

    // Slack requires a 200 within 3 seconds
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Slack webhook error:", error);
    return NextResponse.json({ ok: true }); // Still return 200 to avoid Slack retries
  }
}
