import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { getAllPromptVersions, getPromptVersions, createPromptVersion, seedPromptRegistry } from "@/lib/ai/prompt-registry";
import type { PromptFlowType } from "@/lib/console/types";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const url = new URL(req.url);
    const flow = url.searchParams.get("flow") as PromptFlowType | null;
    const seed = url.searchParams.get("seed");

    // Allow seeding via query param
    if (seed === "true") {
      await seedPromptRegistry();
    }

    const versions = flow
      ? await getPromptVersions(flow)
      : await getAllPromptVersions();

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("Admin prompts API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompt versions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { flow, name, system_prompt, user_prompt_template, model, temperature, max_tokens, metadata } = body;

    if (!flow || !name || !system_prompt || !user_prompt_template) {
      return NextResponse.json(
        { error: "Missing required fields: flow, name, system_prompt, user_prompt_template" },
        { status: 400 }
      );
    }

    const version = await createPromptVersion({
      flow,
      name,
      system_prompt,
      user_prompt_template,
      model,
      temperature,
      max_tokens,
      metadata,
    });

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    console.error("Admin prompts create error:", error);
    return NextResponse.json(
      { error: "Failed to create prompt version" },
      { status: 500 }
    );
  }
}
