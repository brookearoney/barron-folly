import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { multiQuerySearch, hybridSearch, rerankResults } from "@/lib/ai/rag";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { orgId, query, mode, limit, rerank } = await req.json();

    if (!orgId || !query) {
      return NextResponse.json(
        { error: "orgId and query are required" },
        { status: 400 }
      );
    }

    const searchLimit = limit || 5;
    let results;

    switch (mode) {
      case "hybrid":
        results = await hybridSearch(orgId, query, { limit: searchLimit });
        break;
      case "multi":
        results = await multiQuerySearch(orgId, query, { limit: searchLimit });
        break;
      default:
        results = await hybridSearch(orgId, query, { limit: searchLimit });
        break;
    }

    if (rerank && results.length > 1) {
      results = await rerankResults(query, results, searchLimit);
    }

    return NextResponse.json({ results, count: results.length });
  } catch (error) {
    console.error("RAG search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
