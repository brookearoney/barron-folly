import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "./client";
import type { NotificationType } from "@/lib/console/types";

const CONSOLE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://barronandfolly.com";

// Only send emails for high-signal notification types
const EMAIL_WORTHY_TYPES: NotificationType[] = [
  "clarification",
  "approval",
  "completion",
];

// Don't send emails for minor status transitions
const EMAIL_WORTHY_STATUSES = new Set(["in_review", "done", "shipped"]);

interface NotifyParams {
  organization_id: string;
  type: NotificationType;
  title: string;
  body: string;
  request_id?: string | null;
  reference_id?: string | null;
  // For status_change, include the new status
  new_status?: string;
}

/**
 * Sends email notifications to all members of the organization
 * for high-signal events. Skips quietly if Resend isn't configured.
 */
export async function sendOrgNotificationEmails(params: NotifyParams): Promise<void> {
  // Skip if type isn't email-worthy
  if (!EMAIL_WORTHY_TYPES.includes(params.type)) {
    // For status_change, only email on meaningful transitions
    if (params.type === "status_change" && params.new_status && EMAIL_WORTHY_STATUSES.has(params.new_status)) {
      // Allow it through
    } else {
      return;
    }
  }

  try {
    const supabase = createAdminClient();

    // Get all org members' emails
    const { data: profiles } = await supabase
      .from("profiles")
      .select("email")
      .eq("organization_id", params.organization_id)
      .eq("role", "client");

    if (!profiles || profiles.length === 0) return;

    const emails = profiles.map((p) => p.email).filter(Boolean);
    if (emails.length === 0) return;

    // Build email based on type
    const { subject, ctaText, ctaUrl } = getEmailMeta(params);

    await sendNotificationEmail({
      to: emails,
      subject,
      title: params.title,
      body: params.body,
      ctaText,
      ctaUrl,
    });
  } catch (err) {
    // Email failures are non-fatal
    console.error("Notification email error (non-fatal):", err);
  }
}

function getEmailMeta(params: NotifyParams): {
  subject: string;
  ctaText: string;
  ctaUrl: string;
} {
  switch (params.type) {
    case "clarification":
      return {
        subject: `Question on your request — B&F Console`,
        ctaText: "Answer in Console",
        ctaUrl: `${CONSOLE_URL}/console/inbox`,
      };
    case "approval":
      return {
        subject: `Approval needed — B&F Console`,
        ctaText: "Review in Console",
        ctaUrl: params.reference_id
          ? `${CONSOLE_URL}/console/approvals/${params.reference_id}`
          : `${CONSOLE_URL}/console/approvals`,
      };
    case "completion":
      return {
        subject: `Your request is complete — B&F Console`,
        ctaText: "View Details",
        ctaUrl: params.request_id
          ? `${CONSOLE_URL}/console/requests/${params.request_id}`
          : `${CONSOLE_URL}/console/dashboard`,
      };
    case "status_change":
      return {
        subject: `Request update — B&F Console`,
        ctaText: "View Request",
        ctaUrl: params.request_id
          ? `${CONSOLE_URL}/console/requests/${params.request_id}`
          : `${CONSOLE_URL}/console/dashboard`,
      };
    default:
      return {
        subject: `New update — B&F Console`,
        ctaText: "Open Console",
        ctaUrl: `${CONSOLE_URL}/console/dashboard`,
      };
  }
}
