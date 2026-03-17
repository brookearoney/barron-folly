import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Normalize text for comparison: lowercase, strip punctuation, collapse whitespace.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract unique words from normalized text.
 */
function wordSet(text: string): Set<string> {
  const words = normalize(text).split(" ").filter((w) => w.length > 2);
  return new Set(words);
}

/**
 * Compute Jaccard similarity between two sets.
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Check if a new request is similar to existing open requests for the same org.
 * Uses word-overlap / Jaccard similarity on normalized titles and descriptions.
 * Flags as duplicate if similarity > 0.7.
 * Returns top 3 similar requests.
 */
export async function checkForDuplicates(params: {
  orgId: string;
  title: string;
  description: string;
}): Promise<{
  hasDuplicate: boolean;
  similarRequests: Array<{
    id: string;
    title: string;
    status: string;
    similarity: number;
    created_at: string;
  }>;
}> {
  const admin = createAdminClient();

  // Fetch open requests for this org (not done/cancelled/shipped)
  const { data: openRequests, error } = await admin
    .from("requests")
    .select("id, title, description, status, created_at")
    .eq("organization_id", params.orgId)
    .not("status", "in", '("done","cancelled","shipped")')
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !openRequests?.length) {
    return { hasDuplicate: false, similarRequests: [] };
  }

  const inputText = `${params.title} ${params.description}`;
  const inputWords = wordSet(inputText);

  const scored: Array<{
    id: string;
    title: string;
    status: string;
    similarity: number;
    created_at: string;
  }> = [];

  for (const req of openRequests) {
    const reqText = `${req.title ?? ""} ${req.description ?? ""}`;
    const reqWords = wordSet(reqText);
    const similarity = jaccardSimilarity(inputWords, reqWords);

    if (similarity > 0.3) {
      scored.push({
        id: req.id,
        title: req.title ?? "",
        status: req.status ?? "",
        similarity: Math.round(similarity * 100) / 100,
        created_at: req.created_at,
      });
    }
  }

  // Sort by similarity descending, take top 3
  scored.sort((a, b) => b.similarity - a.similarity);
  const top3 = scored.slice(0, 3);
  const hasDuplicate = top3.some((r) => r.similarity > 0.7);

  return { hasDuplicate, similarRequests: top3 };
}
