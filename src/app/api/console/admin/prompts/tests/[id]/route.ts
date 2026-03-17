import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import {
  getABTestResults,
  completeABTest,
  pauseABTest,
  startABTest,
  getABTestById,
} from "@/lib/ai/prompt-ab-testing";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const results = await getABTestResults(id);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Admin A/B test results error:", error);
    return NextResponse.json(
      { error: "Failed to fetch A/B test results" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { action, winnerId, conclusion } = body;

    let test;

    switch (action) {
      case "start":
        test = await startABTest(id);
        break;
      case "pause":
        test = await pauseABTest(id);
        break;
      case "complete":
        if (!winnerId || !conclusion) {
          return NextResponse.json(
            { error: "Missing winnerId or conclusion for completing test" },
            { status: 400 }
          );
        }
        test = await completeABTest(id, winnerId, conclusion);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ test });
  } catch (error) {
    console.error("Admin A/B test update error:", error);
    return NextResponse.json(
      { error: "Failed to update A/B test" },
      { status: 500 }
    );
  }
}
