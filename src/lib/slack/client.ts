import { WebClient } from "@slack/web-api";

let slackClient: WebClient | null = null;

export function getSlackClient(): WebClient | null {
  if (!process.env.SLACK_BOT_TOKEN) return null;
  if (!slackClient) {
    slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
  }
  return slackClient;
}

export const SLACK_CHANNELS = {
  approvals: process.env.SLACK_APPROVALS_CHANNEL || "bf-approvals",
  alerts: process.env.SLACK_ALERTS_CHANNEL || "bf-alerts",
  activity: process.env.SLACK_ACTIVITY_CHANNEL || "bf-activity",
};
