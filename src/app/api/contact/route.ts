import { NextResponse } from "next/server";

const LINEAR_API_URL = "https://api.linear.app/graphql";

async function linearRequest(query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.LINEAR_API_KEY!,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Linear API error: ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || "Linear GraphQL error");
  }

  return json.data;
}

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

    await linearRequest(
      `mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue { id identifier url }
        }
      }`,
      {
        input: {
          teamId: process.env.LINEAR_TEAM_ID,
          title: `New Lead: ${name}`,
          description,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
