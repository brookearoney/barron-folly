import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import {
  getPromptVersionById,
  activatePromptVersion,
  deactivatePromptVersion,
} from "@/lib/ai/prompt-registry";
import { getPromptPerformanceStats } from "@/lib/ai/prompt-performance";

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
    const version = await getPromptVersionById(id);
    if (!version) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const stats = await getPromptPerformanceStats(id);

    return NextResponse.json({ version, stats });
  } catch (error) {
    console.error("Admin prompt detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompt version" },
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
    const { action } = body;

    if (action === "activate") {
      const version = await activatePromptVersion(id);
      return NextResponse.json({ version });
    }

    if (action === "deactivate") {
      const version = await deactivatePromptVersion(id);
      return NextResponse.json({ version });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin prompt update error:", error);
    return NextResponse.json(
      { error: "Failed to update prompt version" },
      { status: 500 }
    );
  }
}
