import { NextResponse } from "next/server";
import { Resend } from "resend";
import { linearRequest } from "@/lib/linear/client";
import { CREATE_ISSUE } from "@/lib/linear/queries";

export async function POST(req: Request) {
  try {
    const { name, email, phone, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    // Send email notification via Resend
    const emailSent = await sendLeadEmail({ name, email, phone, message });

    // Create Linear issue (non-blocking — email is the primary delivery)
    let linearCreated = false;
    if (process.env.LINEAR_API_KEY && process.env.LINEAR_TEAM_ID) {
      try {
        const description = [
          `**Name:** ${name}`,
          `**Email:** ${email}`,
          `**Phone:** ${phone || "Not provided"}`,
          "",
          "---",
          "",
          message,
        ].join("\n");

        const input: Record<string, unknown> = {
          teamId: process.env.LINEAR_TEAM_ID,
          title: `New Lead: ${name}`,
          description,
        };

        if (process.env.LINEAR_PROJECT_ID) {
          input.projectId = process.env.LINEAR_PROJECT_ID;
        }

        await linearRequest(CREATE_ISSUE, { input });
        linearCreated = true;
      } catch (err) {
        console.error("Linear issue creation failed:", err);
      }
    }

    if (!emailSent && !linearCreated) {
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}

async function sendLeadEmail(lead: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): Promise<boolean> {
  if (!process.env.RESEND_LEAD_API_KEY) {
    console.warn("RESEND_LEAD_API_KEY not configured, skipping lead email");
    return false;
  }

  const to = process.env.LEAD_NOTIFICATION_EMAIL || "start@barronfolly.com";
  const resend = new Resend(process.env.RESEND_LEAD_API_KEY);

  try {
    await resend.emails.send({
      from: "B&F Website <leads@barronfolly.com>",
      to: [to],
      replyTo: lead.email,
      subject: `New Lead: ${lead.name}`,
      html: buildLeadEmailHtml(lead),
    });
    return true;
  } catch (err) {
    console.error("Lead email send failed:", err);
    return false;
  }
}

function buildLeadEmailHtml(lead: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#141413;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#141413;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1C1C19;border:1px solid #2A2A26;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:24px 32px;border-bottom:1px solid #2A2A26;">
          <span style="color:#FF8400;font-size:16px;font-weight:700;">New Lead</span>
          <span style="color:#6E6E6A;font-size:14px;margin-left:12px;">from barronfolly.com</span>
        </td></tr>
        <!-- Lead Details -->
        <tr><td style="padding:32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:0 0 16px;">
                <span style="color:#6E6E6A;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Name</span><br>
                <span style="color:#E8E4D9;font-size:16px;font-weight:600;">${esc(lead.name)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 16px;">
                <span style="color:#6E6E6A;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Email</span><br>
                <a href="mailto:${esc(lead.email)}" style="color:#FF8400;font-size:16px;text-decoration:none;">${esc(lead.email)}</a>
              </td>
            </tr>
            ${lead.phone ? `<tr>
              <td style="padding:0 0 16px;">
                <span style="color:#6E6E6A;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Phone</span><br>
                <a href="tel:${esc(lead.phone)}" style="color:#E8E4D9;font-size:16px;text-decoration:none;">${esc(lead.phone)}</a>
              </td>
            </tr>` : ""}
            <tr>
              <td style="padding:20px 0 0;border-top:1px solid #2A2A26;">
                <span style="color:#6E6E6A;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Message</span><br><br>
                <p style="margin:0;color:#E8E4D9;font-size:14px;line-height:1.6;white-space:pre-wrap;">${esc(lead.message)}</p>
              </td>
            </tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #2A2A26;text-align:center;">
          <a href="mailto:${esc(lead.email)}" style="display:inline-block;background-color:#FF8400;color:#141413;font-size:14px;font-weight:600;text-decoration:none;padding:10px 24px;border-radius:8px;">
            Reply to ${esc(lead.name)}
          </a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
