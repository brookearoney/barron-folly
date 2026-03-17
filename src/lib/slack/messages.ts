import { getSlackClient, SLACK_CHANNELS } from "./client";
import { buildApprovalPacket } from "./approval-packets";
import type { RiskLevel } from "@/lib/console/types";
import type { KnownBlock } from "@slack/web-api";

/**
 * Posts an approval packet to the #bf-approvals channel.
 * No-ops if Slack is not configured.
 */
export async function sendApprovalPacket(approval: {
  id: string;
  title: string;
  summary: string;
  impact: string | null;
  risk_level: RiskLevel;
  rollback_plan: string | null;
  artifacts_url: string | null;
  request_id: string;
  org_name: string;
}): Promise<void> {
  const client = getSlackClient();
  if (!client) return;

  try {
    const message = buildApprovalPacket(approval);
    await client.chat.postMessage({
      channel: SLACK_CHANNELS.approvals,
      text: message.text,
      blocks: message.blocks,
    });
  } catch (err) {
    console.error("Slack approval packet error (non-fatal):", err);
  }
}

/**
 * Posts an error alert to the #bf-alerts channel.
 * No-ops if Slack is not configured.
 */
export async function sendErrorAlert(error: {
  flow: string;
  orgName: string;
  message: string;
  timestamp: string;
}): Promise<void> {
  const client = getSlackClient();
  if (!client) return;

  try {
    const blocks: KnownBlock[] = [
      {
        type: "header",
        text: { type: "plain_text", text: "Error Alert", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Flow:*\n${error.flow}` },
          { type: "mrkdwn", text: `*Organization:*\n${error.orgName}` },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Error:*\n\`\`\`${error.message}\`\`\``,
        },
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `Timestamp: ${error.timestamp}` },
        ],
      },
    ];

    await client.chat.postMessage({
      channel: SLACK_CHANNELS.alerts,
      text: `Error in ${error.flow} for ${error.orgName}: ${error.message}`,
      blocks,
    });
  } catch (err) {
    console.error("Slack error alert failed (non-fatal):", err);
  }
}

/**
 * Posts an escalation message to the #bf-alerts channel.
 * No-ops if Slack is not configured.
 */
export async function sendEscalation(params: {
  message: string;
  requestId: string;
  orgName: string;
  blockedSince: string;
}): Promise<void> {
  const client = getSlackClient();
  if (!client) return;

  try {
    const blocks: KnownBlock[] = [
      {
        type: "header",
        text: { type: "plain_text", text: "Escalation: Blocked > 2 hours", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Organization:*\n${params.orgName}` },
          { type: "mrkdwn", text: `*Request:*\n${params.requestId}` },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Details:*\n${params.message}`,
        },
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `Blocked since: ${params.blockedSince}` },
        ],
      },
    ];

    await client.chat.postMessage({
      channel: SLACK_CHANNELS.alerts,
      text: `Escalation for ${params.orgName}: ${params.message}`,
      blocks,
    });
  } catch (err) {
    console.error("Slack escalation failed (non-fatal):", err);
  }
}

/**
 * Posts a status update to the #bf-activity channel.
 * No-ops if Slack is not configured.
 */
export async function sendStatusUpdate(params: {
  requestId: string;
  orgName: string;
  status: string;
  title: string;
}): Promise<void> {
  const client = getSlackClient();
  if (!client) return;

  try {
    const blocks: KnownBlock[] = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${params.orgName}* — "${params.title}" moved to *${params.status}*`,
        },
      },
    ];

    await client.chat.postMessage({
      channel: SLACK_CHANNELS.activity,
      text: `${params.orgName}: "${params.title}" is now ${params.status}`,
      blocks,
    });
  } catch (err) {
    console.error("Slack status update failed (non-fatal):", err);
  }
}
