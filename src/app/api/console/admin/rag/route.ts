import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmbeddingStats, reindexOrgEmbeddings } from "@/lib/ai/embedding-refresh";
import { getMemoryStats, compressMemories } from "@/lib/ai/memory-manager";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const supabase = createAdminClient();

    const { data: orgs, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, slug, tier, memory_log")
      .order("name");

    if (orgError) {
      return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 });
    }

    const orgStats = await Promise.all(
      (orgs || []).map(async (org) => {
        const [embeddingStats, memoryStats] = await Promise.all([
          getEmbeddingStats(org.id).catch(() => ({
            totalRequests: 0,
            embeddedRequests: 0,
            coveragePercent: 0,
            avgEmbeddingAge: 0,
            oldestEmbedding: null,
          })),
          getMemoryStats(org.id).catch(() => ({
            totalEntries: 0,
            oldestEntry: null,
            newestEntry: null,
            topTags: [],
            avgEntriesPerMonth: 0,
          })),
        ]);

        return {
          orgId: org.id,
          orgName: org.name,
          orgSlug: org.slug,
          tier: org.tier,
          embeddingStats,
          memoryStats,
        };
      })
    );

    return NextResponse.json({ organizations: orgStats });
  } catch (error) {
    console.error("Admin RAG API error:", error);
    return NextResponse.json({ error: "Failed to fetch RAG stats" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { action, orgId } = await req.json();

    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    switch (action) {
      case "reindex": {
        const result = await reindexOrgEmbeddings(orgId);
        return NextResponse.json({ success: true, ...result });
      }

      case "compress": {
        const result = await compressMemories(orgId);
        return NextResponse.json({ success: true, ...result });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin RAG POST error:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
