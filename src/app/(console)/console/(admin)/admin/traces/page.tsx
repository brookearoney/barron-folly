"use client";

import { useState, useEffect, useCallback } from "react";
import type { TraceSpan, AuditEntry } from "@/lib/console/types";

interface TraceSummary {
  traceId: string;
  name: string;
  service: string;
  status: string;
  startTime: string;
  duration_ms: number;
  spanCount: number;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  error: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function AdminTracesPage() {
  const [traces, setTraces] = useState<TraceSummary[]>([]);
  const [spans, setSpans] = useState<TraceSpan[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [searchTraceId, setSearchTraceId] = useState("");
  const [searchTaskId, setSearchTaskId] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Detail view
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [detailSpans, setDetailSpans] = useState<TraceSpan[]>([]);
  const [detailAudit, setDetailAudit] = useState<AuditEntry[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedSpanId, setExpandedSpanId] = useState<string | null>(null);

  const limit = 50;

  const fetchTraces = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (searchTraceId) params.set("trace_id", searchTraceId);
      if (searchTaskId) params.set("task_id", searchTaskId);
      if (filterService) params.set("service", filterService);
      if (filterStatus) params.set("status", filterStatus);

      const res = await fetch(`/api/console/admin/traces?${params}`);
      const data = await res.json();
      setTraces(data.traces ?? []);
      setSpans(data.spans ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch traces:", err);
    }
    setLoading(false);
  }, [page, searchTraceId, searchTaskId, filterService, filterStatus]);

  useEffect(() => {
    if (!selectedTraceId) {
      fetchTraces();
    }
  }, [fetchTraces, selectedTraceId]);

  useEffect(() => {
    setPage(1);
  }, [searchTraceId, searchTaskId, filterService, filterStatus]);

  async function viewTrace(traceId: string) {
    setSelectedTraceId(traceId);
    setDetailLoading(true);
    try {
      const res = await fetch(
        `/api/console/admin/traces?trace_id=${traceId}`
      );
      const data = await res.json();
      setDetailSpans(data.spans ?? []);
      setDetailAudit(data.auditEntries ?? []);
    } catch (err) {
      console.error("Failed to fetch trace detail:", err);
    }
    setDetailLoading(false);
  }

  function formatDuration(ms: number | null): string {
    if (ms === null || ms === undefined) return "--";
    if (ms < 1) return "<1ms";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function timeAgo(dateStr: string): string {
    const ms = Date.now() - new Date(dateStr).getTime();
    if (ms < 60_000) return "just now";
    if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
    if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
    return `${Math.round(ms / 86_400_000)}d ago`;
  }

  const totalPages = Math.ceil(total / limit);

  // ─── Trace Detail View ──────────────────────────────────────────────
  if (selectedTraceId) {
    // Build a waterfall: sort spans by start time, calculate relative positions
    const traceStart = detailSpans.length > 0
      ? Math.min(...detailSpans.map((s) => new Date(s.startTime).getTime()))
      : 0;
    const traceEnd = detailSpans.length > 0
      ? Math.max(...detailSpans.map((s) => {
          if (s.endTime) return new Date(s.endTime).getTime();
          return new Date(s.startTime).getTime() + (s.duration_ms ?? 0);
        }))
      : 0;
    const totalTraceDuration = traceEnd - traceStart || 1;

    return (
      <div>
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => {
              setSelectedTraceId(null);
              setDetailSpans([]);
              setDetailAudit([]);
              setExpandedSpanId(null);
            }}
            className="text-muted hover:text-foreground transition-colors text-sm"
          >
            &larr; Back to traces
          </button>
          <h1 className="text-2xl font-semibold text-foreground">Trace Detail</h1>
        </div>

        {/* Trace info */}
        <div className="bg-dark rounded-lg border border-dark-border p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted text-xs uppercase tracking-wider mb-1">Trace ID</p>
              <p className="text-foreground font-mono text-xs break-all">{selectedTraceId}</p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wider mb-1">Spans</p>
              <p className="text-foreground text-lg font-semibold">{detailSpans.length}</p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wider mb-1">Duration</p>
              <p className="text-foreground text-lg font-semibold">
                {formatDuration(totalTraceDuration)}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wider mb-1">Status</p>
              {(() => {
                const hasError = detailSpans.some((s) => s.status === "error");
                const hasActive = detailSpans.some((s) => s.status === "active");
                const status = hasError ? "error" : hasActive ? "active" : "completed";
                return (
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${STATUS_COLORS[status]}`}
                  >
                    {status}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {detailLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Waterfall / Timeline */}
            <h2 className="text-lg font-semibold text-foreground mb-3">Span Waterfall</h2>
            <div className="bg-dark rounded-lg border border-dark-border overflow-hidden mb-6">
              {detailSpans.map((span) => {
                const spanStart = new Date(span.startTime).getTime() - traceStart;
                const spanDuration = span.duration_ms ?? 0;
                const leftPercent = (spanStart / totalTraceDuration) * 100;
                const widthPercent = Math.max(
                  (spanDuration / totalTraceDuration) * 100,
                  0.5
                );
                const isError = span.status === "error";
                const isExpanded = expandedSpanId === span.id;

                return (
                  <div key={span.id} className="border-b border-dark-border/50 last:border-b-0">
                    <button
                      onClick={() => setExpandedSpanId(isExpanded ? null : span.id)}
                      className="w-full text-left hover:bg-dark-border/20 transition-colors"
                    >
                      <div className="flex items-center px-4 py-2.5">
                        {/* Span name */}
                        <div className="w-[240px] shrink-0 pr-3">
                          <p
                            className={`text-sm truncate ${
                              isError ? "text-red-400" : "text-foreground"
                            }`}
                          >
                            {span.name}
                          </p>
                          <p className="text-muted text-xs">{span.service}</p>
                        </div>

                        {/* Timeline bar */}
                        <div className="flex-1 min-w-0 relative h-6">
                          <div className="absolute inset-0 bg-dark-border/20 rounded" />
                          <div
                            className={`absolute top-0.5 bottom-0.5 rounded ${
                              isError
                                ? "bg-red-500/60"
                                : span.status === "active"
                                ? "bg-blue-500/60"
                                : "bg-emerald-500/60"
                            }`}
                            style={{
                              left: `${Math.min(leftPercent, 99)}%`,
                              width: `${Math.min(widthPercent, 100 - leftPercent)}%`,
                            }}
                          />
                        </div>

                        {/* Duration */}
                        <div className="w-[80px] shrink-0 text-right pl-3">
                          <span className="text-muted text-xs">
                            {formatDuration(span.duration_ms)}
                          </span>
                        </div>

                        {/* Status badge */}
                        <div className="w-[80px] shrink-0 text-right pl-2">
                          <span
                            className={`inline-flex px-1.5 py-0.5 text-xs rounded border ${
                              STATUS_COLORS[span.status] ?? ""
                            }`}
                          >
                            {span.status}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 bg-dark-border/10 border-t border-dark-border/30">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-2 text-sm">
                          <div>
                            <p className="text-muted text-xs uppercase tracking-wider mb-1">Span ID</p>
                            <p className="text-foreground font-mono text-xs">{span.id}</p>
                          </div>
                          <div>
                            <p className="text-muted text-xs uppercase tracking-wider mb-1">Parent Span</p>
                            <p className="text-foreground font-mono text-xs">{span.parentSpanId ?? "root"}</p>
                          </div>
                          <div>
                            <p className="text-muted text-xs uppercase tracking-wider mb-1">Operation</p>
                            <p className="text-foreground text-xs">{span.operation}</p>
                          </div>
                          <div>
                            <p className="text-muted text-xs uppercase tracking-wider mb-1">Start</p>
                            <p className="text-foreground text-xs">{formatDate(span.startTime)}</p>
                          </div>
                          <div>
                            <p className="text-muted text-xs uppercase tracking-wider mb-1">End</p>
                            <p className="text-foreground text-xs">
                              {span.endTime ? formatDate(span.endTime) : "in progress"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted text-xs uppercase tracking-wider mb-1">Duration</p>
                            <p className="text-foreground text-xs">{formatDuration(span.duration_ms)}</p>
                          </div>
                        </div>

                        {/* Error */}
                        {span.error && (
                          <div className="mt-3">
                            <p className="text-red-400 text-xs uppercase tracking-wider mb-1">Error</p>
                            <pre className="text-red-300 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-3 whitespace-pre-wrap overflow-x-auto">
                              {span.error.message}
                              {span.error.stack && `\n\n${span.error.stack}`}
                            </pre>
                          </div>
                        )}

                        {/* Events */}
                        {span.events.length > 0 && (
                          <div className="mt-3">
                            <p className="text-muted text-xs uppercase tracking-wider mb-2">
                              Events ({span.events.length})
                            </p>
                            <div className="space-y-1.5">
                              {span.events.map((evt, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-3 text-xs bg-dark-border/20 rounded px-3 py-2"
                                >
                                  <span className="text-muted shrink-0">
                                    {new Date(evt.timestamp).toLocaleTimeString()}
                                  </span>
                                  <span className="text-foreground">{evt.name}</span>
                                  {evt.attributes && Object.keys(evt.attributes).length > 0 && (
                                    <span className="text-muted font-mono">
                                      {JSON.stringify(evt.attributes)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Attributes */}
                        {Object.keys(span.attributes).length > 0 && (
                          <div className="mt-3">
                            <p className="text-muted text-xs uppercase tracking-wider mb-1">Attributes</p>
                            <pre className="text-foreground text-xs bg-dark-border/30 rounded-lg p-3 whitespace-pre-wrap overflow-x-auto">
                              {JSON.stringify(span.attributes, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {detailSpans.length === 0 && (
                <div className="px-4 py-8 text-center text-muted text-sm">
                  No spans found for this trace
                </div>
              )}
            </div>

            {/* Related Audit Entries */}
            {detailAudit.length > 0 && (
              <>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Related Audit Entries
                </h2>
                <div className="bg-dark rounded-lg border border-dark-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dark-border text-muted text-xs uppercase tracking-wider">
                        <th className="text-left px-4 py-3">Time</th>
                        <th className="text-left px-4 py-3">Action</th>
                        <th className="text-left px-4 py-3">Actor</th>
                        <th className="text-left px-4 py-3">Resource</th>
                        <th className="text-left px-4 py-3">Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {detailAudit.map((entry) => (
                        <tr key={entry.id} className="hover:bg-dark-border/20 transition-colors">
                          <td className="px-4 py-2.5 text-foreground text-xs">
                            {formatDate(entry.created_at)}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-foreground text-xs font-mono">{entry.action}</span>
                          </td>
                          <td className="px-4 py-2.5 text-muted text-xs">
                            {entry.actorType}
                            {entry.actorId ? ` (${entry.actorId.slice(0, 8)}...)` : ""}
                          </td>
                          <td className="px-4 py-2.5 text-muted text-xs truncate max-w-[200px]">
                            {entry.resource}
                          </td>
                          <td className="px-4 py-2.5">
                            {entry.riskLevel && (
                              <span
                                className={`text-xs font-medium capitalize ${
                                  entry.riskLevel === "high"
                                    ? "text-red-400"
                                    : entry.riskLevel === "medium"
                                    ? "text-amber-400"
                                    : "text-green-400"
                                }`}
                              >
                                {entry.riskLevel}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  // ─── Trace List View ────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Trace Explorer</h1>
          <p className="text-muted text-sm mt-1">
            Distributed tracing across the agent system
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={searchTraceId}
          onChange={(e) => setSearchTraceId(e.target.value)}
          placeholder="Search by Trace ID..."
          className="px-3 py-2 bg-dark border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors w-64"
        />
        <input
          type="text"
          value={searchTaskId}
          onChange={(e) => setSearchTaskId(e.target.value)}
          placeholder="Search by Task ID..."
          className="px-3 py-2 bg-dark border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors w-56"
        />
        <select
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          className="px-3 py-2 bg-dark border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
        >
          <option value="">All services</option>
          <option value="root">Root</option>
          <option value="orchestrator">Orchestrator</option>
          <option value="agent-router">Agent Router</option>
          <option value="policy-enforcement">Policy Enforcement</option>
          <option value="tool-runner">Tool Runner</option>
          <option value="api">API</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-dark border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="error">Error</option>
        </select>

        {(searchTraceId || searchTaskId || filterService || filterStatus) && (
          <button
            onClick={() => {
              setSearchTraceId("");
              setSearchTaskId("");
              setFilterService("");
              setFilterStatus("");
              setPage(1);
            }}
            className="text-orange text-sm hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : traces.length === 0 ? (
        <div className="bg-dark rounded-lg border border-dark-border p-12 text-center">
          <p className="text-muted text-sm">
            {searchTraceId || searchTaskId || filterService || filterStatus
              ? "No traces match your filters."
              : "No traces recorded yet. Traces will appear when instrumented operations run."}
          </p>
        </div>
      ) : (
        <>
          {/* Trace list */}
          <div className="bg-dark rounded-lg border border-dark-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border text-muted text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Trace</th>
                  <th className="text-left px-4 py-3">Service</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Duration</th>
                  <th className="text-left px-4 py-3">Spans</th>
                  <th className="text-left px-4 py-3">Started</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {traces.map((trace) => (
                  <tr
                    key={trace.traceId}
                    className={`hover:bg-dark-border/20 transition-colors ${
                      trace.status === "error" ? "bg-red-500/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-foreground text-sm font-medium truncate max-w-[200px]">
                        {trace.name}
                      </p>
                      <p className="text-muted font-mono text-xs mt-0.5">
                        {trace.traceId.slice(0, 8)}...
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted text-xs">{trace.service}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${
                          STATUS_COLORS[trace.status] ?? ""
                        }`}
                      >
                        {trace.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted text-sm">
                      {formatDuration(trace.duration_ms)}
                    </td>
                    <td className="px-4 py-3 text-muted text-sm">{trace.spanCount}</td>
                    <td className="px-4 py-3 text-muted text-xs">
                      {timeAgo(trace.startTime)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => viewTrace(trace.traceId)}
                        className="text-xs text-orange hover:text-orange/80 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-muted text-sm">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm bg-dark border border-dark-border rounded-lg text-foreground hover:bg-dark-border/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm bg-dark border border-dark-border rounded-lg text-foreground hover:bg-dark-border/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
