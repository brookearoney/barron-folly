import { createAdminClient } from "@/lib/supabase/admin";
import { generateEmbedding, storeTaskEmbedding, findSimilarTasks } from "./embeddings";
import Anthropic from "@anthropic-ai/sdk";
import type { MemoryLogEntry, Organization } from "@/lib/console/types";
import type { MemoryStats } from "@/lib/console/types";

// ---------------------------------------------------------------------------
// Append Memory
// ---------------------------------------------------------------------------

/**
 * Append a memory entry with deduplication.
 * Also stores an embedding for semantic retrieval.
 */
export async function appendMemory(
  orgId: string,
  entry: MemoryLogEntry
): Promise<void> {
  const supabase = createAdminClient();

  // Fetch current memory log
  const { data: org, error: fetchError } = await supabase
    .from("organizations")
    .select("memory_log")
    .eq("id", orgId)
    .single();

  if (fetchError) {
    console.error("Failed to fetch org for memory append:", fetchError);
    throw fetchError;
  }

  const currentLog: MemoryLogEntry[] = org?.memory_log || [];

  // Deduplicate: skip if request_id already exists
  if (currentLog.some((e) => e.request_id === entry.request_id)) {
    // Update existing entry instead of duplicating
    const updatedLog = currentLog.map((e) =>
      e.request_id === entry.request_id ? { ...e, ...entry } : e
    );
    const { error: updateError } = await supabase
      .from("organizations")
      .update({ memory_log: updatedLog })
      .eq("id", orgId);

    if (updateError) {
      console.error("Failed to update memory entry:", updateError);
      throw updateError;
    }
    return;
  }

  // Append new entry
  const updatedLog = [...currentLog, entry];

  const { error: updateError } = await supabase
    .from("organizations")
    .update({ memory_log: updatedLog })
    .eq("id", orgId);

  if (updateError) {
    console.error("Failed to append memory:", updateError);
    throw updateError;
  }

  // Store embedding for semantic retrieval
  try {
    const embeddingContent = `${entry.request_title}\n${entry.summary}\nTags: ${entry.tags.join(", ")}`;
    await storeTaskEmbedding(orgId, entry.request_id, embeddingContent, {
      type: "memory",
      tags: entry.tags,
      task_count: entry.task_ids.length,
      timestamp: entry.timestamp,
    });
  } catch (err) {
    // Non-fatal: embedding storage failure should not block memory append
    console.error("Failed to store memory embedding:", err);
  }
}

// ---------------------------------------------------------------------------
// Get Relevant Memories
// ---------------------------------------------------------------------------

/**
 * Find semantically relevant memories for a given context.
 * Uses embeddings similarity rather than just chronological ordering.
 */
export async function getRelevantMemories(
  orgId: string,
  context: string,
  limit: number = 10
): Promise<MemoryLogEntry[]> {
  const supabase = createAdminClient();

  // Fetch full memory log
  const { data: org } = await supabase
    .from("organizations")
    .select("memory_log")
    .eq("id", orgId)
    .single();

  const memoryLog: MemoryLogEntry[] = org?.memory_log || [];
  if (memoryLog.length === 0) return [];

  // Use embedding similarity to find relevant memories
  try {
    const similar = await findSimilarTasks(orgId, context, limit * 2);

    // Filter to only memory-type embeddings and map back to memory entries
    const memoryResults = similar.filter(
      (s) => (s.metadata as Record<string, unknown>)?.type === "memory"
    );

    const relevantIds = new Set(memoryResults.map((r) => r.request_id));
    const relevantMemories = memoryLog.filter((m) =>
      relevantIds.has(m.request_id)
    );

    // If we found semantically relevant ones, return those + most recent
    if (relevantMemories.length > 0) {
      const recentMemories = memoryLog.slice(-5);
      const combined = new Map<string, MemoryLogEntry>();

      for (const m of relevantMemories) {
        combined.set(m.request_id, m);
      }
      for (const m of recentMemories) {
        combined.set(m.request_id, m);
      }

      return Array.from(combined.values())
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        .slice(0, limit);
    }
  } catch {
    // Fall through to chronological if embedding search fails
  }

  // Fallback: return most recent
  return memoryLog.slice(-limit);
}

// ---------------------------------------------------------------------------
// Compress Memories
// ---------------------------------------------------------------------------

/**
 * When memory_log exceeds 50 entries, summarize clusters of related entries
 * into condensed entries, preserving key facts.
 */
export async function compressMemories(
  orgId: string
): Promise<{ compressed: number; remaining: number }> {
  const supabase = createAdminClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("memory_log")
    .eq("id", orgId)
    .single();

  const memoryLog: MemoryLogEntry[] = org?.memory_log || [];

  if (memoryLog.length <= 50) {
    return { compressed: 0, remaining: memoryLog.length };
  }

  // Keep the 20 most recent entries untouched
  const recentEntries = memoryLog.slice(-20);
  const oldEntries = memoryLog.slice(0, -20);

  // Cluster old entries by shared tags
  const clusters = clusterByTags(oldEntries);

  // Summarize each cluster
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const compressedEntries: MemoryLogEntry[] = [];

  for (const cluster of clusters) {
    if (cluster.length === 1) {
      compressedEntries.push(cluster[0]);
      continue;
    }

    try {
      const clusterText = cluster
        .map(
          (e) =>
            `[${e.timestamp}] "${e.request_title}" - ${e.summary} (tags: ${e.tags.join(", ")})`
        )
        .join("\n");

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Compress these ${cluster.length} related work session memories into a single concise summary that preserves key facts, decisions, and patterns. Return ONLY a JSON object with "summary" (string) and "tags" (string array).

Entries:
${clusterText}`,
          },
        ],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";
      const parsed = JSON.parse(text.trim());

      // Merge all task_ids
      const allTaskIds = cluster.flatMap((e) => e.task_ids);
      const allRequestIds = cluster.map((e) => e.request_id);

      compressedEntries.push({
        timestamp: cluster[0].timestamp,
        request_id: allRequestIds[0],
        request_title: `[Compressed: ${cluster.length} sessions]`,
        summary: parsed.summary,
        tags: parsed.tags || [...new Set(cluster.flatMap((e) => e.tags))],
        task_ids: allTaskIds,
      });
    } catch {
      // If compression fails, keep originals
      compressedEntries.push(...cluster);
    }
  }

  const updatedLog = [...compressedEntries, ...recentEntries];
  const compressed = memoryLog.length - updatedLog.length;

  const { error } = await supabase
    .from("organizations")
    .update({ memory_log: updatedLog })
    .eq("id", orgId);

  if (error) {
    console.error("Failed to save compressed memories:", error);
    throw error;
  }

  return { compressed, remaining: updatedLog.length };
}

// ---------------------------------------------------------------------------
// Archive Memories
// ---------------------------------------------------------------------------

/**
 * Remove memory entries older than a threshold (default 180 days).
 * Returns the number of archived entries.
 */
export async function archiveMemories(
  orgId: string,
  olderThanDays: number = 180
): Promise<number> {
  const supabase = createAdminClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("memory_log")
    .eq("id", orgId)
    .single();

  const memoryLog: MemoryLogEntry[] = org?.memory_log || [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const kept = memoryLog.filter(
    (e) => new Date(e.timestamp) >= cutoff
  );

  const archived = memoryLog.length - kept.length;

  if (archived > 0) {
    const { error } = await supabase
      .from("organizations")
      .update({ memory_log: kept })
      .eq("id", orgId);

    if (error) {
      console.error("Failed to archive memories:", error);
      throw error;
    }
  }

  return archived;
}

// ---------------------------------------------------------------------------
// Search by Tags
// ---------------------------------------------------------------------------

/**
 * Find memory entries matching any of the given tags.
 */
export async function searchMemoriesByTags(
  orgId: string,
  tags: string[]
): Promise<MemoryLogEntry[]> {
  const supabase = createAdminClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("memory_log")
    .eq("id", orgId)
    .single();

  const memoryLog: MemoryLogEntry[] = org?.memory_log || [];
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));

  return memoryLog.filter((entry) =>
    entry.tags.some((t) => tagSet.has(t.toLowerCase()))
  );
}

// ---------------------------------------------------------------------------
// Memory Stats
// ---------------------------------------------------------------------------

/**
 * Get statistics about an org's memory log.
 */
export async function getMemoryStats(
  orgId: string
): Promise<MemoryStats> {
  const supabase = createAdminClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("memory_log")
    .eq("id", orgId)
    .single();

  const memoryLog: MemoryLogEntry[] = org?.memory_log || [];

  if (memoryLog.length === 0) {
    return {
      totalEntries: 0,
      oldestEntry: null,
      newestEntry: null,
      topTags: [],
      avgEntriesPerMonth: 0,
    };
  }

  // Tag frequency
  const tagCounts = new Map<string, number>();
  for (const entry of memoryLog) {
    for (const tag of entry.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Date range
  const timestamps = memoryLog.map((e) => new Date(e.timestamp).getTime());
  const oldest = new Date(Math.min(...timestamps));
  const newest = new Date(Math.max(...timestamps));

  // Avg per month
  const monthSpan = Math.max(
    1,
    (newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const avgEntriesPerMonth = Math.round((memoryLog.length / monthSpan) * 10) / 10;

  return {
    totalEntries: memoryLog.length,
    oldestEntry: oldest.toISOString(),
    newestEntry: newest.toISOString(),
    topTags,
    avgEntriesPerMonth,
  };
}

// ---------------------------------------------------------------------------
// Memory Summary
// ---------------------------------------------------------------------------

/**
 * Generate a human-readable summary of an org's accumulated memory.
 */
export async function getMemorySummary(orgId: string): Promise<string> {
  const stats = await getMemoryStats(orgId);

  if (stats.totalEntries === 0) {
    return "No work sessions recorded yet.";
  }

  const tagList = stats.topTags
    .slice(0, 5)
    .map((t) => `${t.tag} (${t.count})`)
    .join(", ");

  const parts = [
    `${stats.totalEntries} work sessions recorded.`,
    stats.oldestEntry
      ? `Spanning from ${new Date(stats.oldestEntry).toLocaleDateString()} to ${new Date(stats.newestEntry!).toLocaleDateString()}.`
      : "",
    `Average ${stats.avgEntriesPerMonth} sessions per month.`,
    tagList ? `Top areas: ${tagList}.` : "",
  ];

  return parts.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Cluster memory entries by shared tags using simple overlap scoring.
 */
function clusterByTags(entries: MemoryLogEntry[]): MemoryLogEntry[][] {
  if (entries.length === 0) return [];

  const used = new Set<number>();
  const clusters: MemoryLogEntry[][] = [];

  for (let i = 0; i < entries.length; i++) {
    if (used.has(i)) continue;

    const cluster = [entries[i]];
    used.add(i);
    const clusterTags = new Set(entries[i].tags);

    for (let j = i + 1; j < entries.length; j++) {
      if (used.has(j)) continue;

      const overlap = entries[j].tags.filter((t) => clusterTags.has(t)).length;
      const jaccard =
        overlap /
        (clusterTags.size + entries[j].tags.length - overlap || 1);

      if (jaccard >= 0.3) {
        cluster.push(entries[j]);
        used.add(j);
        for (const t of entries[j].tags) {
          clusterTags.add(t);
        }
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}
