import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { getAllTests, createABTest, startABTest } from "@/lib/ai/prompt-ab-testing";
import type { PromptFlowType } from "@/lib/console/types";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const url = new URL(req.url);
    const flow = url.searchParams.get("flow") as PromptFlowType | null;

    const tests = await getAllTests(flow ?? undefined);

    return NextResponse.json({ tests });
  } catch (error) {
    console.error("Admin A/B tests API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch A/B tests" },
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
    const { flow, name, description, variantAId, variantBId, splitPercentage, minSampleSize, autoStart } = body;

    if (!flow || !name || !variantAId || !variantBId) {
      return NextResponse.json(
        { error: "Missing required fields: flow, name, variantAId, variantBId" },
        { status: 400 }
      );
    }

    let test = await createABTest({
      flow,
      name,
      description: description ?? "",
      variantAId,
      variantBId,
      splitPercentage,
      minSampleSize,
    });

    if (autoStart) {
      test = await startABTest(test.id);
    }

    return NextResponse.json({ test }, { status: 201 });
  } catch (error) {
    console.error("Admin A/B test create error:", error);
    return NextResponse.json(
      { error: "Failed to create A/B test" },
      { status: 500 }
    );
  }
}
