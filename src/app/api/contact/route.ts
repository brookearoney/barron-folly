import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service is not configured." },
        { status: 503 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { name, email, phone, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: "Barron & Folly <leads@barronfolly.com>",
      to: ["start@barronfolly.com"],
      replyTo: email,
      subject: `New Lead: ${name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 0;">
          <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px; color: #111;">New Lead from barronfolly.com</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; width: 100px; vertical-align: top;">Name</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #111;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; vertical-align: top;">Email</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #111;"><a href="mailto:${email}" style="color: #FF8400;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; vertical-align: top;">Phone</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #111;">${phone || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #666; vertical-align: top;">Message</td>
              <td style="padding: 12px 0; color: #111; white-space: pre-wrap;">${message}</td>
            </tr>
          </table>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
