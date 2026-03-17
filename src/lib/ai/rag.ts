import { generateEmbedding, storeTaskEmbedding } from "./embeddings";
import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";
import type { AiTaskPlan, AiClarificationData } from "@/lib/console/types";
import type { RAGResult } from "@/lib/console/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_CHUNK_MAX_CHARS = 6000; // ~1500 tokens
const DEFAULT_OVERLAP_CHARS = 400;

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

/**
 * Split long content into overlapping chunks for embedding.
 * Tries to break on paragraph boundaries when possible.
 */
export function chunkContent(
  content: string,
  maxChars: number = DEFAULT_CHUNK_MAX_CHARS
): string[] {
  if (content.length <= maxChars) return [content];

  const chunks: string[] = [];
  let start = 0;

  while (start < content.length) {
    let end = Math.min(start + maxChars, content.length);

    // Try to break on a paragraph boundary
    if (end < content.length) {
      const paragraphBreak = content.lastIndexOf("\n\n", end);
      if (paragraphBreak > start + maxChars * 0.5) {
        end = paragraphBreak;
      } else {
        // Fall back to sentence boundary
        const sentenceBreak = content.lastIndexOf(". ", end);
        if (sentenceBreak > start + maxChars * 0.5) {
          end = sentenceBreak + 1;
        }
      }
    }

    chunks.push(content.slice(start, end).trim());
    start = Math.max(start + 1, end - DEFAULT_OVERLAP_CHARS);
  }

  return chunks.filter((c) => c.length > 0);
}

// ---------------------------------------------------------------------------
// Store Embeddings
// ---------------------------------------------------------------------------

/**
 * Store embeddings for a request, with smart chunking for long content.
 * Builds a composite document from request fields and chunks it.
 */
export async function storeRequestEmbeddings(
  orgId: string,
  requestId: string,
  request: {
    title: string;
    description: string;
    category: string;
    taskPlan?: AiTaskPlan;
    clarificationData?: AiClarificationData;
  }
): Promise<void> {
  // Build composite content
  const parts: string[] = [
    `Title: ${request.title}`,
    `Category: ${request.category}`,
    `Description: ${request.description}`,
  ];

  if (request.clarificationData) {
    const qaText = request.clarificationData.questions
      .filter((q) => q.answer)
      .map((q) => `Q: ${q.question}\nA: ${q.answer}`)
      .join("\n\n");
    if (qaText) parts.push(`Clarifications:\n${qaText}`);
  }

  if (request.taskPlan) {
    parts.push(`Summary: ${request.taskPlan.session_summary}`);
    const taskList = request.taskPlan.tasks
      .map((t) => `- ${t.title}: ${t.description}`)
      .join("\n");
    parts.push(`Tasks:\n${taskList}`);
  }

  const fullContent = parts.join("\n\n");
  const chunks = chunkContent(fullContent);

  // Delete existing embeddings for this request (re-index safe)
  const supabase = createAdminClient();
  await supabase
    .from("task_embeddings")
    .delete()
    .eq("organization_id", orgId)
    .eq("request_id", requestId);

  // Store each chunk
  const metadata = {
    title: request.title,
    category: request.category,
    chunk_count: chunks.length,
    has_task_plan: !!request.taskPlan,
    tags: request.taskPlan?.session_tags || [],
  };

  await Promise.all(
    chunks.map((chunk, i) =>
      storeTaskEmbedding(orgId, requestId, chunk, {
        ...metadata,
        chunk_index: i,
      })
    )
  );
}

// ---------------------------------------------------------------------------
// Multi-Query Search
// ---------------------------------------------------------------------------

/**
 * Generate alternative search queries for better recall, then merge results.
 */
export async function multiQuerySearch(
  orgId: string,
  query: string,
  options?: {
    limit?: number;
    threshold?: number;
    includeMetadata?: boolean;
    excludeRequestId?: string;
  }
): Promise<RAGResult[]> {
  const limit = options?.limit ?? 5;
  const threshold = options?.threshold ?? 0.5;

  // Generate alternative queries using Claude
  const alternativeQueries = await generateAlternativeQueries(query);
  const allQueries = [query, ...alternativeQueries];

  // Run all queries in parallel
  const embedding = await generateEmbedding(query);
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("match_task_embeddings", {
    query_embedding: JSON.stringify(embedding),
    match_org_id: orgId,
    match_threshold: threshold,
    match_count: limit * 3, // over-fetch for dedup
  });

  if (error) {
    console.error("Multi-query search error:", error);
    return [];
  }

  // Also run alternative query embeddings
  const altResults = await Promise.all(
    alternativeQueries.slice(0, 2).map(async (altQuery) => {
      try {
        const altEmbedding = await generateEmbedding(altQuery);
        const { data: altData } = await supabase.rpc("match_task_embeddings", {
          query_embedding: JSON.stringify(altEmbedding),
          match_org_id: orgId,
          match_threshold: threshold,
          match_count: limit,
        });
        return altData || [];
      } catch {
        return [];
      }
    })
  );

  // Merge and deduplicate by request_id, keeping highest similarity
  const resultMap = new Map<string, RAGResult>();

  const allData = [
    ...(data || []),
    ...altResults.flat(),
  ];

  for (const row of allData) {
    if (options?.excludeRequestId && row.request_id === options.excludeRequestId) {
      continue;
    }

    const existing = resultMap.get(row.request_id);
    if (!existing || row.similarity > existing.similarity) {
      resultMap.set(row.request_id, {
        requestId: row.request_id,
        content: row.content,
        similarity: row.similarity,
        metadata: row.metadata || {},
      });
    }
  }

  return Array.from(resultMap.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Hybrid Search
// ---------------------------------------------------------------------------

/**
 * Combine embedding similarity with keyword matching for better precision.
 */
export async function hybridSearch(
  orgId: string,
  query: string,
  options?: {
    limit?: number;
    semanticWeight?: number;
    keywordWeight?: number;
    excludeRequestId?: string;
  }
): Promise<RAGResult[]> {
  const limit = options?.limit ?? 5;
  const semanticWeight = options?.semanticWeight ?? 0.7;

  const embedding = await generateEmbedding(query);
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("hybrid_search_embeddings", {
    query_embedding: JSON.stringify(embedding),
    query_text: query,
    match_org_id: orgId,
    semantic_weight: semanticWeight,
    match_count: limit * 2,
  });

  if (error) {
    console.error("Hybrid search error:", error);
    return [];
  }

  // Deduplicate by request_id, keeping highest combined score
  const resultMap = new Map<string, RAGResult>();

  for (const row of data || []) {
    if (options?.excludeRequestId && row.request_id === options.excludeRequestId) {
      continue;
    }

    const existing = resultMap.get(row.request_id);
    if (!existing || row.combined_score > existing.similarity) {
      resultMap.set(row.request_id, {
        requestId: row.request_id,
        content: row.content,
        similarity: row.combined_score,
        metadata: {
          ...row.metadata,
          semantic_score: row.semantic_score,
          keyword_score: row.keyword_score,
        },
      });
    }
  }

  return Array.from(resultMap.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Reranking
// ---------------------------------------------------------------------------

/**
 * Rerank results using Claude for better relevance ordering.
 */
export async function rerankResults(
  query: string,
  results: RAGResult[],
  topK: number = 5
): Promise<RAGResult[]> {
  if (results.length <= 1) return results;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const candidateList = results
    .map(
      (r, i) =>
        `[${i}] (similarity: ${(r.similarity * 100).toFixed(0)}%)\n${r.content.slice(0, 500)}`
    )
    .join("\n\n---\n\n");

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are a relevance judge. Given a query and candidate results, rank the candidates by relevance to the query. Return ONLY a JSON array of indices in order of relevance (most relevant first), e.g. [2, 0, 3, 1].

Query: ${query}

Candidates:
${candidateList}

Return ONLY the JSON array of indices, nothing else.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const indices = JSON.parse(text.trim()) as number[];

    const reranked: RAGResult[] = [];
    for (const idx of indices) {
      if (idx >= 0 && idx < results.length) {
        reranked.push({
          ...results[idx],
          reranked: true,
          rerankScore: 1 - reranked.length / indices.length,
        });
      }
    }

    return reranked.slice(0, topK);
  } catch (err) {
    console.error("Reranking failed, returning original order:", err);
    return results.slice(0, topK);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function generateAlternativeQueries(query: string): Promise<string[]> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `Generate 2 alternative search queries for finding similar past work to this request. Return ONLY a JSON array of strings.

Original query: "${query}"

Return ONLY the JSON array, e.g. ["alt query 1", "alt query 2"]`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return JSON.parse(text.trim()) as string[];
  } catch {
    return [];
  }
}
