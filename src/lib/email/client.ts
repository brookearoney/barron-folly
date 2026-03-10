import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const CONSOLE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://barronandfolly.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "B&F Console <console@barronandfolly.com>";

interface EmailParams {
  to: string[];
  subject: string;
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
}

export async function sendNotificationEmail(params: EmailParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("Resend not configured (RESEND_API_KEY missing), skipping email");
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: buildEmailHtml(params),
    });
    return true;
  } catch (err) {
    console.error("Resend email error:", err);
    return false;
  }
}

function buildEmailHtml(params: EmailParams): string {
  const { title, body, ctaText, ctaUrl } = params;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#141413;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#141413;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1C1C19;border:1px solid #2A2A26;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:24px 32px;border-bottom:1px solid #2A2A26;">
          <span style="color:#E8E4D9;font-size:14px;font-weight:600;">B&F Console</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 12px;color:#E8E4D9;font-size:18px;font-weight:600;">${escapeHtml(title)}</h2>
          <p style="margin:0 0 24px;color:#9E9E98;font-size:14px;line-height:1.6;">${escapeHtml(body)}</p>
          ${ctaText && ctaUrl ? `
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background-color:#FF8400;color:#141413;font-size:14px;font-weight:600;text-decoration:none;padding:10px 24px;border-radius:8px;">
            ${escapeHtml(ctaText)}
          </a>` : ""}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #2A2A26;">
          <p style="margin:0;color:#6E6E6A;font-size:12px;">
            Sent from <a href="${CONSOLE_URL}/console" style="color:#FF8400;text-decoration:none;">B&F Console</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
