import { createAdminClient } from "@/lib/supabase/admin";
import { storeRequestEmbeddings } from "./rag";
import type { EmbeddingStats } from "@/lib/console/types";

// ---------------------------------------------------------------------------
// Find Missing Embeddings
// ---------------------------------------------------------------------------

/**
 * Find request IDs that have no embeddings stored.
 */
export async function findMissingEmbeddings(
  orgId: string
): Promise<string[]> {
  const supabase = createAdminClient();

  // Get all request IDs for the org
  const { data: requests, error: reqError } = await supabase
    .from("requests")
    .select("id")
    .eq("organization_id", orgId)
    .in("status", [
      "submitted",
      "backlog",
      "todo",
      "in_progress",
      "in_review",
      "approved",
      "shipped",
      "done",
    ]);

  if (reqError || !requests) {
    console.error("Failed to fetch requests:", reqError);
    return [];
  }

  // Get request IDs that already have embeddings
  const { data: embedded, error: embError } = await supabase
    .from("task_embeddings")
    .select("request_id")
    .eq("organization_id", orgId);

  if (embError) {
    console.error("Failed to fetch embeddings:", embError);
    return requests.map((r) => r.id);
  }

  const embeddedIds = new Set((embedded || []).map((e) => e.request_id));
  return requests
    .map((r) => r.id)
    .filter((id) => !embeddedIds.has(id));
}

// ---------------------------------------------------------------------------
// Reindex All Embeddings
// ---------------------------------------------------------------------------

/**
 * Re-generate embeddings for all requests in an org.
 */
export async function reindexOrgEmbeddings(
  orgId: string
): Promise<{ indexed: number; failed: number; skipped: number }> {
  const supabase = createAdminClient();

  const { data: requests, error } = await supabase
    .from("requests")
    .select("id, title, description, category, ai_clarification_data, ai_phase")
    .eq("organization_id", orgId)
    .not("status", "eq", "cancelled");

  if (error || !requests) {
    console.error("Failed to fetch requests for reindex:", error);
    return { indexed: 0, failed: 0, skipped: 0 };
  }

  let indexed = 0;
  let failed = 0;
  let skipped = 0;

  for (const request of requests) {
    // Skip requests without enough content
    if (!request.title || !request.description) {
      skipped++;
      continue;
    }

    try {
      await storeRequestEmbeddings(orgId, request.id, {
        title: request.title,
        description: request.description,
        category: request.category || "other",
        clarificationData: request.ai_clarification_data || undefined,
      });
      indexed++;
    } catch (err) {
      console.error(`Failed to index request ${request.id}:`, err);
      failed++;
    }
  }

  return { indexed, failed, skipped };
}

// ---------------------------------------------------------------------------
// Refresh Single Embedding
// ---------------------------------------------------------------------------

/**
 * Re-generate the embedding for a single request.
 */
export async function refreshEmbedding(
  orgId: string,
  requestId: string
): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: request, error } = await supabase
    .from("requests")
    .select("id, title, description, category, ai_clarification_data")
    .eq("id", requestId)
    .eq("organization_id", orgId)
    .single();

  if (error || !request) {
    console.error("Failed to fetch request for refresh:", error);
    return false;
  }

  if (!request.title || !request.description) {
    return false;
  }

  try {
    await storeRequestEmbeddings(orgId, requestId, {
      title: request.title,
      description: request.description,
      category: request.category || "other",
      clarificationData: request.ai_clarification_data || undefined,
    });
    return true;
  } catch (err) {
    console.error(`Failed to refresh embedding for ${requestId}:`, err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Embedding Stats
// ---------------------------------------------------------------------------

/**
 * Get embedding coverage statistics for an org.
 */
export async function getEmbeddingStats(
  orgId: string
): Promise<EmbeddingStats> {
  const supabase = createAdminClient();

  // Total requests (non-cancelled)
  const { count: totalRequests } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .not("status", "eq", "cancelled");

  // Distinct request IDs with embeddings
  const { data: embeddingRows } = await supabase
    .from("task_embeddings")
    .select("request_id, created_at")
    .eq("organization_id", orgId);

  const uniqueRequestIds = new Set(
    (embeddingRows || []).map((e) => e.request_id)
  );
  const embeddedRequests = uniqueRequestIds.size;

  const total = totalRequests ?? 0;
  const coveragePercent =
    total > 0 ? Math.round((embeddedRequests / total) * 1000) / 10 : 0;

  // Avg embedding age
  let avgEmbeddingAge = 0;
  let oldestEmbedding: string | null = null;

  if (embeddingRows && embeddingRows.length > 0) {
    const now = Date.now();
    const ages = embeddingRows.map(
      (e) => (now - new Date(e.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    avgEmbeddingAge = Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10;

    const timestamps = embeddingRows.map((e) =>
      new Date(e.created_at).getTime()
    );
    oldestEmbedding = new Date(Math.min(...timestamps)).toISOString();
  }

  return {
    totalRequests: total,
    embeddedRequests,
    coveragePercent,
    avgEmbeddingAge,
    oldestEmbedding,
  };
}
