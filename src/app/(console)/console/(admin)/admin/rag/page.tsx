"use client";

import { useEffect, useState, useCallback } from "react";
import EmptyState from "@/components/console/EmptyState";
import type { EmbeddingStats, MemoryStats, RAGResult } from "@/lib/console/types";

interface OrgRAGData {
  orgId: string;
  orgName: string;
  orgSlug: string;
  tier: string;
  embeddingStats: EmbeddingStats;
  memoryStats: MemoryStats;
}

type TabId = "overview" | "search";

export default function AdminRAGPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [organizations, setOrganizations] = useState<OrgRAGData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<string | null>(null);

  // Search state
  const [searchOrgId, setSearchOrgId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"hybrid" | "multi">("hybrid");
  const [searchRerank, setSearchRerank] = useState(false);
  const [searchResults, setSearchResults] = useState<RAGResult[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/console/admin/rag");
      const data = await res.json();
      setOrganizations(data.organizations || []);
      if (data.organizations?.length > 0 && !searchOrgId) {
        setSearchOrgId(data.organizations[0].orgId);
      }
    } catch (err) {
      console.error("Failed to fetch RAG data:", err);
    }
    setLoading(false);
  }, [searchOrgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleReindex(orgId: string) {
    setActionLoading(orgId);
    setActionResult(null);
    try {
      const res = await fetch("/api/console/admin/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reindex", orgId }),
      });
      const data = await res.json();
      if (data.success) {
        setActionResult(
          `Reindexed: ${data.indexed} indexed, ${data.failed} failed, ${data.skipped} skipped`
        );
        fetchData();
      } else {
        setActionResult(`Error: ${data.error}`);
      }
    } catch {
      setActionResult("Reindex failed");
    }
    setActionLoading(null);
  }

  async function handleCompress(orgId: string) {
    setActionLoading(`compress-${orgId}`);
    setActionResult(null);
    try {
      const res = await fetch("/api/console/admin/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "compress", orgId }),
      });
      const data = await res.json();
      if (data.success) {
        setActionResult(
          `Compressed: ${data.compressed} entries merged, ${data.remaining} remaining`
        );
        fetchData();
      } else {
        setActionResult(`Error: ${data.error}`);
      }
    } catch {
      setActionResult("Compression failed");
    }
    setActionLoading(null);
  }

  async function handleSearch() {
    if (!searchOrgId || !searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch("/api/console/admin/rag/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: searchOrgId,
          query: searchQuery,
          mode: searchMode,
          rerank: searchRerank,
          limit: 10,
        }),
      });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      console.error("Search failed");
    }
    setSearching(false);
  }

  function formatDate(iso: string | null): string {
    if (!iso) return "--";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const TABS: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "search", label: "RAG Search Testing" },
  ];

  // Aggregate stats
  const totalEmbeddings = organizations.reduce(
    (sum, o) => sum + o.embeddingStats.embeddedRequests,
    0
  );
  const totalMemories = organizations.reduce(
    (sum, o) => sum + o.memoryStats.totalEntries,
    0
  );
  const avgCoverage =
    organizations.length > 0
      ? Math.round(
          (organizations.reduce(
            (sum, o) => sum + o.embeddingStats.coveragePercent,
            0
          ) /
            organizations.length) *
            10
        ) / 10
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            RAG & Memory Dashboard
          </h1>
          <p className="text-muted text-sm mt-1">
            Manage embeddings, memory compression, and test semantic search
          </p>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-dark rounded-lg border border-dark-border p-4">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">
            Organizations
          </p>
          <p className="text-foreground text-xl font-semibold">
            {organizations.length}
          </p>
        </div>
        <div className="bg-dark rounded-lg border border-dark-border p-4">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">
            Total Embeddings
          </p>
          <p className="text-foreground text-xl font-semibold">
            {totalEmbeddings}
          </p>
        </div>
        <div className="bg-dark rounded-lg border border-dark-border p-4">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">
            Total Memories
          </p>
          <p className="text-foreground text-xl font-semibold">
            {totalMemories}
          </p>
        </div>
        <div className="bg-dark rounded-lg border border-dark-border p-4">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">
            Avg Coverage
          </p>
          <p className="text-orange text-xl font-semibold">{avgCoverage}%</p>
        </div>
      </div>

      {/* Action Result Banner */}
      {actionResult && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-orange/30 bg-orange/10 text-foreground text-sm flex items-center justify-between">
          <span>{actionResult}</span>
          <button
            onClick={() => setActionResult(null)}
            className="text-muted hover:text-foreground transition-colors ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-dark-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "text-foreground border-orange"
                : "text-muted border-transparent hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Overview Tab ──────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {organizations.length === 0 ? (
                <EmptyState
                  icon={
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                      />
                    </svg>
                  }
                  title="No organizations found"
                  description="No organizations have been set up yet."
                />
              ) : (
                organizations.map((org) => (
                  <div
                    key={org.orgId}
                    className="bg-dark rounded-lg border border-dark-border p-5"
                  >
                    {/* Org Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-foreground font-semibold text-lg">
                          {org.orgName}
                        </h3>
                        <p className="text-muted text-xs mt-0.5">
                          {org.orgSlug} &middot;{" "}
                          <span className="capitalize">{org.tier}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCompress(org.orgId)}
                          disabled={
                            actionLoading === `compress-${org.orgId}` ||
                            org.memoryStats.totalEntries <= 50
                          }
                          className="px-3 py-1.5 text-xs bg-dark border border-dark-border rounded-lg text-foreground hover:bg-dark-border/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === `compress-${org.orgId}`
                            ? "Compressing..."
                            : "Compress Memories"}
                        </button>
                        <button
                          onClick={() => handleReindex(org.orgId)}
                          disabled={actionLoading === org.orgId}
                          className="px-3 py-1.5 text-xs bg-orange/15 border border-orange/30 rounded-lg text-orange hover:bg-orange/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === org.orgId
                            ? "Reindexing..."
                            : "Reindex Embeddings"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Embedding Stats */}
                      <div className="bg-dark-border/20 rounded-lg p-4">
                        <p className="text-muted text-xs uppercase tracking-wider mb-3 font-medium">
                          Embedding Coverage
                        </p>
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-foreground text-sm">
                              {org.embeddingStats.embeddedRequests} /{" "}
                              {org.embeddingStats.totalRequests} requests
                            </span>
                            <span className="text-orange text-sm font-semibold">
                              {org.embeddingStats.coveragePercent}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-dark-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, org.embeddingStats.coveragePercent)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-muted">Avg Age</p>
                            <p className="text-foreground">
                              {org.embeddingStats.avgEmbeddingAge > 0
                                ? `${org.embeddingStats.avgEmbeddingAge} days`
                                : "--"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted">Oldest</p>
                            <p className="text-foreground">
                              {formatDate(org.embeddingStats.oldestEmbedding)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Memory Stats */}
                      <div className="bg-dark-border/20 rounded-lg p-4">
                        <p className="text-muted text-xs uppercase tracking-wider mb-3 font-medium">
                          Memory Log
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                          <div>
                            <p className="text-muted">Total Entries</p>
                            <p className="text-foreground text-lg font-semibold">
                              {org.memoryStats.totalEntries}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted">Avg/Month</p>
                            <p className="text-foreground text-lg font-semibold">
                              {org.memoryStats.avgEntriesPerMonth}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted">Oldest</p>
                            <p className="text-foreground">
                              {formatDate(org.memoryStats.oldestEntry)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted">Newest</p>
                            <p className="text-foreground">
                              {formatDate(org.memoryStats.newestEntry)}
                            </p>
                          </div>
                        </div>
                        {org.memoryStats.topTags.length > 0 && (
                          <div>
                            <p className="text-muted text-xs mb-1.5">
                              Top Tags
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {org.memoryStats.topTags
                                .slice(0, 6)
                                .map((t) => (
                                  <span
                                    key={t.tag}
                                    className="text-xs bg-dark-border/40 text-muted px-1.5 py-0.5 rounded"
                                  >
                                    {t.tag}{" "}
                                    <span className="opacity-60">
                                      ({t.count})
                                    </span>
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Search Tab ────────────────────────────────────────── */}
          {activeTab === "search" && (
            <div>
              <div className="bg-dark rounded-lg border border-dark-border p-5 mb-6">
                <p className="text-foreground font-medium mb-4">
                  RAG Search Testing
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                  <select
                    value={searchOrgId}
                    onChange={(e) => setSearchOrgId(e.target.value)}
                    className="px-3 py-2 bg-dark border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
                  >
                    {organizations.map((org) => (
                      <option key={org.orgId} value={org.orgId}>
                        {org.orgName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={searchMode}
                    onChange={(e) =>
                      setSearchMode(e.target.value as "hybrid" | "multi")
                    }
                    className="px-3 py-2 bg-dark border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
                  >
                    <option value="hybrid">Hybrid Search</option>
                    <option value="multi">Multi-Query Search</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm text-muted px-3">
                    <input
                      type="checkbox"
                      checked={searchRerank}
                      onChange={(e) => setSearchRerank(e.target.checked)}
                      className="rounded border-dark-border bg-dark text-orange focus:ring-orange"
                    />
                    Rerank with Claude
                  </label>
                  <button
                    onClick={handleSearch}
                    disabled={
                      searching || !searchQuery.trim() || !searchOrgId
                    }
                    className="px-4 py-2 bg-orange text-dark rounded-lg text-sm font-medium hover:bg-orange/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {searching ? "Searching..." : "Search"}
                  </button>
                </div>
                <textarea
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter a search query to find similar past work..."
                  rows={3}
                  className="w-full px-3 py-2 bg-dark border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors resize-none placeholder:text-muted/50"
                />
              </div>

              {/* Search Results */}
              {searching ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-muted text-sm">
                    {searchResults.length} result
                    {searchResults.length !== 1 ? "s" : ""} found
                  </p>
                  {searchResults.map((result, i) => (
                    <div
                      key={`${result.requestId}-${i}`}
                      className="bg-dark rounded-lg border border-dark-border p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-muted text-xs font-mono">
                            #{i + 1}
                          </span>
                          {typeof result.metadata?.title === "string" && (
                            <span className="text-foreground text-sm font-medium">
                              {result.metadata.title}
                            </span>
                          )}
                          {typeof result.metadata?.category === "string" && (
                            <span className="text-xs bg-dark-border/40 text-muted px-1.5 py-0.5 rounded capitalize">
                              {result.metadata.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {result.reranked && (
                            <span className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                              Reranked
                            </span>
                          )}
                          <span
                            className={`text-sm font-semibold ${
                              result.similarity >= 0.8
                                ? "text-emerald-400"
                                : result.similarity >= 0.6
                                ? "text-yellow-400"
                                : "text-muted"
                            }`}
                          >
                            {(result.similarity * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-muted text-xs font-mono mb-2">
                        Request: {result.requestId}
                      </p>
                      <pre className="text-foreground text-xs bg-dark-border/20 rounded-lg p-3 whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                        {result.content.slice(0, 800)}
                        {result.content.length > 800 ? "..." : ""}
                      </pre>
                      {result.metadata?.semantic_score != null && (
                        <div className="flex gap-4 mt-2 text-xs text-muted">
                          <span>
                            Semantic:{" "}
                            {(
                              Number(result.metadata.semantic_score) * 100
                            ).toFixed(1)}
                            %
                          </span>
                          <span>
                            Keyword:{" "}
                            {(
                              Number(result.metadata.keyword_score) * 100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      )}
                      {Array.isArray(result.metadata?.tags) &&
                        (result.metadata.tags as string[]).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(result.metadata.tags as string[]).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-dark-border/40 text-muted px-1.5 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              ) : searchQuery && !searching ? (
                <EmptyState
                  icon={
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                      />
                    </svg>
                  }
                  title="No results found"
                  description="Try a different query or check that the organization has embeddings indexed."
                />
              ) : (
                <div className="text-center py-12 text-muted text-sm">
                  Enter a query above to test RAG search
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
