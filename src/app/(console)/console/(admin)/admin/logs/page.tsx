"use client";

import { useEffect, useState, useCallback } from "react";
import EmptyState from "@/components/console/EmptyState";
import type { AgentRunLog, AgentFlowType, RunLogStatus } from "@/lib/console/types";

const FLOW_LABELS: Record<AgentFlowType, string> = {
  dossier: "Dossier",
  style_guide: "Style Guide",
  clarify: "Clarify",
  construct: "Construct",
  suggestions: "Suggestions",
  scrape: "Scrape",
};

const STATUS_COLORS: Record<RunLogStatus, string> = {
  started: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
  cancelled: "bg-[#9E9E98]/15 text-[#9E9E98] border-[#9E9E98]/30",
};

interface RunLogStats {
  total: number;
  completed: number;
  failed: number;
  avgDurationMs: number;
  totalTokens: number;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AgentRunLog[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<RunLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [flowFilter, setFlowFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (flowFilter) params.set("flow", flowFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (orgFilter) params.set("orgId", orgFilter);
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    try {
      const res = await fetch(`/api/console/admin/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total ?? 0);
      setStats(data.stats || null);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
    setLoading(false);
  }, [flowFilter, statusFilter, orgFilter, offset]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0);
  }, [flowFilter, statusFilter, orgFilter]);

  async function fetchOrgs() {
    try {
      const res = await fetch("/api/console/admin/organizations");
      const data = await res.json();
      setOrgs(
        (data.organizations || []).map((o: { id: string; name: string }) => ({
          id: o.id,
          name: o.name,
        }))
      );
    } catch {
      // Non-critical
    }
  }

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  function formatTokens(n: number): string {
    if (n < 1000) return String(n);
    return `${(n / 1000).toFixed(1)}k`;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const successRate =
    stats && stats.total > 0
      ? ((stats.completed / stats.total) * 100).toFixed(1)
      : "0";

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Agent Run Logs</h1>
          <p className="text-muted text-sm mt-1">{total} total runs</p>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-dark rounded-lg border border-dark-border p-4">
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Total Runs</p>
            <p className="text-foreground text-xl font-semibold">{stats.total}</p>
          </div>
          <div className="bg-dark rounded-lg border border-dark-border p-4">
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Success Rate</p>
            <p className="text-emerald-400 text-xl font-semibold">{successRate}%</p>
          </div>
          <div className="bg-dark rounded-lg border border-dark-border p-4">
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Failed</p>
            <p className="text-red-400 text-xl font-semibold">{stats.failed}</p>
          </div>
          <div className="bg-dark rounded-lg border border-dark-border p-4">
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Avg Duration</p>
            <p className="text-foreground text-xl font-semibold">
              {formatDuration(stats.avgDurationMs)}
            </p>
          </div>
          <div className="bg-dark rounded-lg border border-dark-border p-4">
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Total Tokens</p>
            <p className="text-foreground text-xl font-semibold">
              {formatTokens(stats.totalTokens)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={flowFilter}
          onChange={(e) => setFlowFilter(e.target.value)}
          className="px-3 py-2 bg-dark border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
        >
          <option value="">All flows</option>
          {Object.entries(FLOW_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-dark border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
        >
          <option value="">All statuses</option>
          <option value="started">Started</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={orgFilter}
          onChange={(e) => setOrgFilter(e.target.value)}
          className="px-3 py-2 bg-dark border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
        >
          <option value="">All organizations</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
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
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          title="No run logs found"
          description={
            flowFilter || statusFilter || orgFilter
              ? "Try adjusting your filters."
              : "No agent runs have been logged yet."
          }
        />
      ) : (
        <>
          {/* Table */}
          <div className="bg-dark rounded-lg border border-dark-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">
                    Time
                  </th>
                  <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">
                    Flow
                  </th>
                  <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">
                    Duration
                  </th>
                  <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">
                    Tokens
                  </th>
                  <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">
                    Input
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const totalTokens = (log.tokens_input || 0) + (log.tokens_output || 0);

                  return (
                    <tr key={log.id} className="group">
                      <td
                        colSpan={6}
                        className="p-0"
                      >
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : log.id)
                          }
                          className="w-full text-left hover:bg-dark-border/30 transition-colors"
                        >
                          <div className="flex items-center px-5 py-3">
                            <div className="w-[140px] shrink-0">
                              <span className="text-foreground text-sm">
                                {formatDate(log.created_at)}
                              </span>
                            </div>
                            <div className="w-[100px] shrink-0">
                              <span className="text-foreground text-sm">
                                {FLOW_LABELS[log.flow as AgentFlowType] || log.flow}
                              </span>
                            </div>
                            <div className="w-[110px] shrink-0">
                              <span
                                className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${
                                  STATUS_COLORS[log.status as RunLogStatus] || ""
                                }`}
                              >
                                {log.status}
                              </span>
                            </div>
                            <div className="w-[80px] shrink-0">
                              <span className="text-muted text-sm">
                                {formatDuration(log.duration_ms)}
                              </span>
                            </div>
                            <div className="w-[80px] shrink-0">
                              <span className="text-muted text-sm">
                                {formatTokens(totalTokens)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-muted text-sm truncate block">
                                {log.input_summary || "--"}
                              </span>
                            </div>
                          </div>
                        </button>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="px-5 pb-4 pt-0 border-t border-dark-border/50 bg-dark-border/10">
                            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                              <div>
                                <p className="text-muted text-xs uppercase tracking-wider mb-1">
                                  Run ID
                                </p>
                                <p className="text-foreground font-mono text-xs">
                                  {log.id}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted text-xs uppercase tracking-wider mb-1">
                                  Organization ID
                                </p>
                                <p className="text-foreground font-mono text-xs">
                                  {log.organization_id || "--"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted text-xs uppercase tracking-wider mb-1">
                                  Request ID
                                </p>
                                <p className="text-foreground font-mono text-xs">
                                  {log.request_id || "--"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted text-xs uppercase tracking-wider mb-1">
                                  Linear Task ID
                                </p>
                                <p className="text-foreground font-mono text-xs">
                                  {log.linear_task_id || "--"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted text-xs uppercase tracking-wider mb-1">
                                  Tokens (In / Out)
                                </p>
                                <p className="text-foreground text-xs">
                                  {formatTokens(log.tokens_input)} /{" "}
                                  {formatTokens(log.tokens_output)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted text-xs uppercase tracking-wider mb-1">
                                  Completed At
                                </p>
                                <p className="text-foreground text-xs">
                                  {log.completed_at
                                    ? formatDate(log.completed_at)
                                    : "--"}
                                </p>
                              </div>
                              {log.output_summary && (
                                <div className="col-span-2">
                                  <p className="text-muted text-xs uppercase tracking-wider mb-1">
                                    Output Summary
                                  </p>
                                  <p className="text-foreground text-xs">
                                    {log.output_summary}
                                  </p>
                                </div>
                              )}
                              {log.error_message && (
                                <div className="col-span-2">
                                  <p className="text-red-400 text-xs uppercase tracking-wider mb-1">
                                    Error
                                  </p>
                                  <pre className="text-red-300 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-3 whitespace-pre-wrap overflow-x-auto">
                                    {log.error_message}
                                  </pre>
                                </div>
                              )}
                              {log.metadata &&
                                Object.keys(log.metadata).length > 0 && (
                                  <div className="col-span-2">
                                    <p className="text-muted text-xs uppercase tracking-wider mb-1">
                                      Metadata
                                    </p>
                                    <pre className="text-foreground text-xs bg-dark-border/30 rounded-lg p-3 whitespace-pre-wrap overflow-x-auto">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-muted text-sm">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-3 py-1.5 text-sm bg-dark border border-dark-border rounded-lg text-foreground hover:bg-dark-border/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
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
