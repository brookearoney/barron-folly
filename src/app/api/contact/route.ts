import { NextResponse } from "next/server";
import { linearRequest } from "@/lib/linear/client";
import { CREATE_ISSUE } from "@/lib/linear/queries";

export async function POST(req: Request) {
  try {
    if (!process.env.LINEAR_API_KEY || !process.env.LINEAR_TEAM_ID) {
      return NextResponse.json(
        { error: "Lead tracking service is not configured." },
        { status: 503 }
      );
    }

    const { name, email, phone, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
