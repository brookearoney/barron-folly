import type { RiskLevel } from "@/lib/console/types";
import type { KnownBlock } from "@slack/web-api";

const RISK_EMOJI: Record<RiskLevel, string> = {
  low: ":large_green_circle:",
  medium: ":large_yellow_circle:",
  high: ":red_circle:",
};

const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
};

export interface SlackMessage {
  text: string;
  blocks: KnownBlock[];
}

export function buildApprovalPacket(approval: {
  id: string;
  title: string;
  summary: string;
  impact: string | null;
  risk_level: RiskLevel;
  rollback_plan: string | null;
  artifacts_url: string | null;
  request_id: string;
  org_name: string;
}): SlackMessage {
  const emoji = RISK_EMOJI[approval.risk_level];
  const riskLabel = RISK_LABEL[approval.risk_level];

  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${approval.title}`,
        emoji: true,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${emoji} *${riskLabel}* | ${approval.org_name}`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Summary:*\n${approval.summary}`,
      },
    },
  ];

  if (approval.impact) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Impact:*\n${approval.impact}`,
      },
    });
  }

  if (approval.artifacts_url) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Artifacts:*\n<${approval.artifacts_url}|View PR / Staging>`,
      },
    });
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*Risk Level:*\n${emoji} ${riskLabel}`,
    },
  });

  if (approval.rollback_plan) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Rollback Plan:*\n${approval.rollback_plan}`,
      },
    });
  }

  blocks.push(
    {
      type: "divider",
    },
    {
      type: "actions",
      block_id: `approval_actions_${approval.id}`,
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Approve", emoji: true },
          style: "primary",
          action_id: "approve",
          value: approval.id,
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Pause", emoji: true },
          action_id: "pause",
          value: approval.id,
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Request Changes", emoji: true },
          style: "danger",
          action_id: "change_request",
          value: approval.id,
        },
      ],
    }
  );

  return {
    text: `Approval needed: ${approval.title} (${riskLabel})`,
    blocks,
  };
}
