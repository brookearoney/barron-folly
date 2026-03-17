import { sendNotificationEmail } from "@/lib/email/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AgentRunLog } from "./types";

const CONSOLE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://barronandfolly.com";
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || "admin@barronandfolly.com";

/**
 * Sends an alert email to admin when an agent run fails.
 * Includes flow type, org name, error message, timestamp, and link to log viewer.
 */
export async function sendErrorAlert(runLog: AgentRunLog): Promise<void> {
  // Look up org name if we have an org ID
  let orgName = "Unknown";
  if (runLog.organization_id) {
    try {
      const supabase = createAdminClient();
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", runLog.organization_id)
        .single();
      if (org) orgName = org.name;
    } catch {
      // Non-critical, continue with "Unknown"
    }
  }

  const timestamp = new Date(runLog.created_at).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const flowLabel = runLog.flow.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  await sendNotificationEmail({
    to: [ADMIN_ALERT_EMAIL],
    subject: `Agent Run Failed: ${flowLabel} — B&F Console`,
    title: `Agent Run Failed: ${flowLabel}`,
    body: [
      `Flow: ${flowLabel}`,
      `Organization: ${orgName}`,
      `Error: ${runLog.error_message || "Unknown error"}`,
      `Time: ${timestamp}`,
      `Duration: ${runLog.duration_ms}ms`,
    ].join("\n"),
    ctaText: "View Logs",
    ctaUrl: `${CONSOLE_URL}/console/admin/logs`,
  });
}
