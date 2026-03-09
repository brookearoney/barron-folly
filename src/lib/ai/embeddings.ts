import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";

const EMBEDDING_MODEL = "text-embedding-3-small";

function getOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000), // limit input to avoid token overflow
  });
  return response.data[0].embedding;
}

export async function storeTaskEmbedding(
  orgId: string,
  requestId: string,
  content: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const embedding = await generateEmbedding(content);
  const supabase = createAdminClient();

  const { error } = await supabase.from("task_embeddings").insert({
    organization_id: orgId,
    request_id: requestId,
    content,
    embedding: JSON.stringify(embedding),
    metadata,
  });

  if (error) {
    console.error("Failed to store task embedding:", error);
    throw error;
  }
}

export interface SimilarTask {
  id: string;
  request_id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export async function findSimilarTasks(
  orgId: string,
  queryText: string,
  limit: number = 5
): Promise<SimilarTask[]> {
  const embedding = await generateEmbedding(queryText);
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("match_task_embeddings", {
    query_embedding: JSON.stringify(embedding),
    match_org_id: orgId,
    match_threshold: 0.5,
    match_count: limit,
  });

  if (error) {
    console.error("Failed to find similar tasks:", error);
    return [];
  }

  return (data || []) as SimilarTask[];
}
