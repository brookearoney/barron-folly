import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrgNotificationEmails } from "@/lib/email/notify";
import { sendApprovalPacket, sendStatusUpdate, sendErrorAlert } from "@/lib/slack/messages";
import type { NotificationType, NotificationPreferences } from "./types";

interface DispatchParams {
  organizationId: string;
  type: NotificationType;
  title: string;
  body: string;
  requestId?: string;
  referenceId?: string;
  recipientIds?: string[];
  slackData?: { channel?: string; blocks?: unknown[] };
  // Extra data for specific channels
  newStatus?: string;
  approvalData?: {
    id: string;
    summary: string;
    impact: string | null;
    risk_level: "low" | "medium" | "high";
    rollback_plan: string | null;
    artifacts_url: string | null;
    org_name: string;
  };
}

interface ChannelConfig {
  email: boolean;
  slack: boolean;
  in_app: boolean;
}

function isInQuietHours(prefs: NotificationPreferences): boolean {
  if (prefs.quiet_hours_start === null || prefs.quiet_hours_end === null) {
    return false;
  }
  const now = new Date();
  const currentHour = now.getUTCHours();
  const start = prefs.quiet_hours_start;
  const end = prefs.quiet_hours_end;

  if (start <= end) {
    return currentHour >= start && currentHour < end;
  }
  // Wraps midnight (e.g., 22-06)
  return currentHour >= start || currentHour < end;
}

function getChannelConfig(
  prefs: NotificationPreferences,
  type: NotificationType
): ChannelConfig {
  const defaults: ChannelConfig = {
    email: prefs.email_enabled,
    slack: prefs.slack_enabled,
    in_app: prefs.in_app_enabled,
  };

  const override = prefs.type_overrides?.[type];
  if (!override) return defaults;

  return {
    email: override.email ?? defaults.email,
    slack: override.slack ?? defaults.slack,
    in_app: override.in_app ?? defaults.in_app,
  };
}

/**
 * Unified notification dispatcher.
 * Routes notifications to the correct channels (in-app, email, Slack)
 * based on each recipient's preferences.
 */
export async function dispatchNotification(params: DispatchParams): Promise<void> {
  const supabase = createAdminClient();

  try {
    // Get recipients: either specified profiles or all org members
    let recipientIds = params.recipientIds;
    if (!recipientIds || recipientIds.length === 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("organization_id", params.organizationId);

      recipientIds = profiles?.map((p) => p.id) || [];
    }

    if (recipientIds.length === 0) return;

    // Fetch notification preferences for all recipients
    const { data: allPrefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .in("profile_id", recipientIds);

    const prefsMap = new Map<string, NotificationPreferences>();
    for (const pref of allPrefs || []) {
      prefsMap.set(pref.profile_id, pref as NotificationPreferences);
    }

    // Default preferences for users without saved preferences
    const defaultPrefs: NotificationPreferences = {
      id: "",
      profile_id: "",
      email_enabled: true,
      slack_enabled: true,
      in_app_enabled: true,
      type_overrides: {} as NotificationPreferences["type_overrides"],
      digest_enabled: false,
      digest_frequency: "daily",
      digest_last_sent: null,
      quiet_hours_start: null,
      quiet_hours_end: null,
      created_at: "",
      updated_at: "",
    };

    let shouldSendEmail = false;
    let shouldSendSlack = false;
    const inAppRecipients: string[] = [];

    for (const recipientId of recipientIds) {
      const prefs = prefsMap.get(recipientId) || defaultPrefs;
      const channels = getChannelConfig(prefs, params.type);
      const quiet = isInQuietHours(prefs);

      // In-app notifications are always delivered (not affected by quiet hours)
      if (channels.in_app) {
        inAppRecipients.push(recipientId);
      }

      // Email and Slack respect quiet hours
      if (!quiet) {
        if (channels.email) shouldSendEmail = true;
        if (channels.slack) shouldSendSlack = true;
      }
    }

    // 1. In-app notifications (Supabase insert)
    if (inAppRecipients.length > 0) {
      await supabase.from("notifications").insert({
        organization_id: params.organizationId,
        type: params.type,
        title: params.title,
        body: params.body || null,
        request_id: params.requestId || null,
        reference_id: params.referenceId || null,
      });
    }

    // 2. Email via Resend (fire-and-forget)
    if (shouldSendEmail) {
      sendOrgNotificationEmails({
        organization_id: params.organizationId,
        type: params.type,
        title: params.title,
        body: params.body,
        request_id: params.requestId || null,
        reference_id: params.referenceId || null,
        new_status: params.newStatus,
      }).catch(() => {});
    }

    // 3. Slack (fire-and-forget)
    if (shouldSendSlack) {
      // Approval-specific Slack message
      if (params.type === "approval" && params.approvalData) {
        sendApprovalPacket({
          ...params.approvalData,
          title: params.title,
          request_id: params.requestId || "",
        }).catch(() => {});
      }
      // Status change Slack message
      else if (params.type === "status_change" || params.type === "completion") {
        const { data: org } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", params.organizationId)
          .single();

        sendStatusUpdate({
          requestId: params.requestId || "",
          orgName: org?.name || "Unknown",
          status: params.newStatus || params.type,
          title: params.title,
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error("Notification dispatch error (non-fatal):", err);
  }
}
