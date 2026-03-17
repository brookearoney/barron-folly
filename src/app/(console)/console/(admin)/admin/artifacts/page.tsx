"use client";

import { useState, useEffect, useCallback } from "react";
import type { Artifact, ArtifactType, ArtifactStatus } from "@/lib/artifacts/types";

const TYPE_LABELS: Record<ArtifactType, string> = {
  code: "Code",
  design: "Design",
  document: "Document",
  image: "Image",
  config: "Config",
  data: "Data",
  component: "Component",
};

const STATUS_COLORS: Record<ArtifactStatus, string> = {
  draft: "bg-gray-500/20 text-gray-400",
  in_review: "bg-purple-500/20 text-purple-400",
  approved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
  published: "bg-blue-500/20 text-blue-400",
  archived: "bg-gray-500/10 text-gray-500",
};

const STATUS_LABELS: Record<ArtifactStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
  published: "Published",
  archived: "Archived",
};

const ARTIFACT_TYPES: ArtifactType[] = [
  "code", "design", "document", "image", "config", "data", "component",
];

const ARTIFACT_STATUSES: ArtifactStatus[] = [
  "draft", "in_review", "approved", "rejected", "published", "archived",
];

interface ArtifactWithOrg extends Artifact {
  organization?: { id: string; name: string; slug: string; tier: string };
}

interface Analytics {
  countByType: Record<string, number>;
  countByStatus: Record<string, number>;
  avgQualityScore: number | null;
  avgReviewTimeMs: number | null;
  total: number;
}

export default function AdminArtifactsPage() {
  const [artifacts, setArtifacts] = useState<ArtifactWithOrg[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Filters
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterOrg, setFilterOrg] = useState<string>("");

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkNotes, setBulkNotes] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (filterType) params.set("type", filterType);
      if (filterStatus) params.set("status", filterStatus);
      if (filterOrg) params.set("org_id", filterOrg);

      const res = await fetch(`/api/console/admin/artifacts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      setArtifacts(data.artifacts || []);
      setTotal(data.total || 0);
      setAnalytics(data.analytics || null);
    } catch (err) {
      console.error("Fetch artifacts error:", err);
    }
  }, [page, filterType, filterStatus, filterOrg]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchData();
    setLastRefresh(new Date());
    setLoading(false);
  }, [fetchData]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === artifacts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(artifacts.map((a) => a.id)));
    }
  }

  async function executeBulkAction() {
    if (!bulkAction || selected.size === 0) return;
    if (bulkAction === "reject" && !bulkNotes) {
      alert("Notes required for rejection");
      return;
    }

    try {
      const res = await fetch("/api/console/admin/artifacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artifactIds: Array.from(selected),
          action: bulkAction,
          notes: bulkNotes || undefined,
        }),
      });

      if (!res.ok) throw new Error("Bulk action failed");

      setSelected(new Set());
      setBulkAction("");
      setBulkNotes("");
      await refresh();
    } catch (err) {
      console.error("Bulk action error:", err);
    }
  }

  async function runQualityGates(artifactId: string) {
    try {
      const res = await fetch(`/api/console/artifacts/${artifactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_quality_gates" }),
      });
      if (!res.ok) throw new Error("Quality gates failed");
      await refresh();
    } catch (err) {
      console.error("Quality gates error:", err);
    }
  }

  const totalPages = Math.ceil(total / 30);
  const pendingReview = artifacts.filter((a) => a.status === "in_review");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Artifact Dashboard
          </h1>
          <p className="text-muted text-sm mt-1">
            Manage artifacts across all organizations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted text-xs">
            Updated {timeAgo(lastRefresh.toISOString())}
          </span>
          <button
            onClick={refresh}
            disabled={loading}
            className="bg-dark border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg hover:bg-dark-border/50 transition-colors disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Analytics bar */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-dark rounded-lg border border-dark-border p-3">
            <p className="text-muted text-xs mb-1">Total</p>
            <p className="text-lg font-semibold text-foreground">{analytics.total}</p>
          </div>
          <div className="bg-dark rounded-lg border border-dark-border p-3">
            <p className="text-muted text-xs mb-1">Pending Review</p>
            <p className={`text-lg font-semibold ${pendingReview.length > 0 ? "text-purple-400" : "text-foreground"}`}>
              {analytics.countByStatus.in_review || 0}
            </p>
          </div>
          <div className="bg-dark rounded-lg border border-dark-border p-3">
            <p className="text-muted text-xs mb-1">Published</p>
            <p className="text-lg font-semibold text-blue-400">
              {analytics.countByStatus.published || 0}
            </p>
          </div>
          <div className="bg-dark rounded-lg border border-dark-border p-3">
            <p className="text-muted text-xs mb-1">Avg Quality</p>
            <p className={`text-lg font-semibold ${
              analytics.avgQualityScore !== null
                ? analytics.avgQualityScore >= 80
                  ? "text-emerald-400"
                  : analytics.avgQualityScore >= 60
                  ? "text-amber-400"
                  : "text-red-400"
                : "text-muted"
            }`}>
              {analytics.avgQualityScore !== null ? analytics.avgQualityScore : "--"}
            </p>
          </div>
          <div className="bg-dark rounded-lg border border-dark-border p-3">
            <p className="text-muted text-xs mb-1">Avg Review Time</p>
            <p className="text-lg font-semibold text-foreground">
              {analytics.avgReviewTimeMs ? formatDuration(analytics.avgReviewTimeMs) : "--"}
            </p>
          </div>
          <div className="bg-dark rounded-lg border border-dark-border p-3">
            <p className="text-muted text-xs mb-1">By Type</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(analytics.countByType).slice(0, 4).map(([type, count]) => (
                <span key={type} className="text-[9px] px-1 py-0.5 rounded bg-dark-border text-muted-light">
                  {type}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters + Bulk actions */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="bg-dark border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg"
        >
          <option value="">All types</option>
          {ARTIFACT_TYPES.map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="bg-dark border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg"
        >
          <option value="">All statuses</option>
          {ARTIFACT_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        {(filterType || filterStatus || filterOrg) && (
          <button
            onClick={() => { setFilterType(""); setFilterStatus(""); setFilterOrg(""); setPage(1); }}
            className="text-orange text-sm hover:underline"
          >
            Clear filters
          </button>
        )}

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-muted text-xs">{selected.size} selected</span>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="bg-dark border border-dark-border text-foreground text-sm px-2 py-1.5 rounded-lg"
            >
              <option value="">Bulk action...</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
              <option value="archive">Archive</option>
            </select>
            {bulkAction === "reject" && (
              <input
                type="text"
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                placeholder="Rejection notes..."
                className="bg-dark border border-dark-border text-foreground text-sm px-2 py-1.5 rounded-lg w-48"
              />
            )}
            {bulkAction && (
              <button
                onClick={executeBulkAction}
                className="text-xs px-3 py-1.5 rounded-lg bg-orange/10 text-orange hover:bg-orange/20 transition-colors"
              >
                Apply
              </button>
            )}
          </div>
        )}
      </div>

      {/* Artifacts table */}
      <div className="bg-dark rounded-lg border border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border text-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === artifacts.length && artifacts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-dark-border"
                  />
                </th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Org</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Quality</th>
                <th className="text-left px-4 py-3">Version</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {artifacts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted">
                    {loading ? "Loading..." : "No artifacts found"}
                  </td>
                </tr>
              ) : (
                artifacts.map((artifact) => (
                  <tr
                    key={artifact.id}
                    className={`hover:bg-dark-border/30 transition-colors ${
                      artifact.status === "in_review" ? "bg-purple-500/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(artifact.id)}
                        onChange={() => toggleSelect(artifact.id)}
                        className="rounded border-dark-border"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground font-medium truncate max-w-[200px]">
                        {artifact.name}
                      </p>
                      {artifact.description && (
                        <p className="text-muted text-xs truncate max-w-[200px] mt-0.5">
                          {artifact.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground text-sm truncate max-w-[120px]">
                        {artifact.organization?.name ?? "--"}
                      </p>
                      <p className="text-muted text-xs capitalize">
                        {artifact.organization?.tier ?? ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted-light text-xs capitalize">
                        {TYPE_LABELS[artifact.type]}
                      </span>
                      <p className="text-muted text-[10px] font-mono">{artifact.format}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[artifact.status]}`}>
                        {STATUS_LABELS[artifact.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {artifact.quality_score !== null ? (
                        <span className={`text-xs font-semibold ${
                          artifact.quality_score >= 80
                            ? "text-emerald-400"
                            : artifact.quality_score >= 60
                            ? "text-amber-400"
                            : "text-red-400"
                        }`}>
                          {artifact.quality_score}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted text-xs">v{artifact.version}</span>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                      {timeAgo(artifact.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => runQualityGates(artifact.id)}
                          className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-500/10 transition-colors"
                          title="Run quality gates"
                        >
                          QA
                        </button>
                        {artifact.status === "in_review" && (
                          <>
                            <button
                              onClick={async () => {
                                await fetch(`/api/console/artifacts/${artifact.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ action: "approve" }),
                                });
                                refresh();
                              }}
                              className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-500/10 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                const reason = prompt("Rejection reason:");
                                if (!reason) return;
                                await fetch(`/api/console/artifacts/${artifact.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ action: "reject", notes: reason }),
                                });
                                refresh();
                              }}
                              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-border">
            <p className="text-muted text-xs">
              Showing {(page - 1) * 30 + 1}--{Math.min(page * 30, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-xs text-muted hover:text-foreground disabled:opacity-30 px-2 py-1"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="text-xs text-muted hover:text-foreground disabled:opacity-30 px-2 py-1"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return `${Math.round(ms / 86_400_000)}d ago`;
}

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${(ms / 3_600_000).toFixed(1)}h`;
  return `${(ms / 86_400_000).toFixed(1)}d`;
}
