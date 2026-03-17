"use client";

import { useState, useEffect, useCallback } from "react";
import type { OrchestratorTask, QueueStats, AgentGroup, QueueStatus } from "@/lib/console/types";

const STATUS_COLORS: Record<string, string> = {
  queued: "bg-blue-500/20 text-blue-400",
  assigned: "bg-indigo-500/20 text-indigo-400",
  running: "bg-emerald-500/20 text-emerald-400",
  blocked: "bg-amber-500/20 text-amber-400",
  completed: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
  cancelled: "bg-gray-500/20 text-gray-400",
};

const RISK_COLORS: Record<string, string> = {
  low: "text-green-400",
  medium: "text-amber-400",
  high: "text-red-400",
};

const AGENT_GROUPS: AgentGroup[] = [
  "research", "content", "frontend", "integration", "data", "infra", "security", "qa", "ops",
];

const STATUSES: QueueStatus[] = [
  "queued", "assigned", "running", "blocked", "completed", "failed", "cancelled",
];

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return `${Math.round(ms / 86_400_000)}d ago`;
}

interface TaskWithOrg extends OrchestratorTask {
  organization?: { id: string; name: string; slug: string; tier: string };
}

export default function AdminQueuePage() {
  const [tasks, setTasks] = useState<TaskWithOrg[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterAgent, setFilterAgent] = useState<string>("");
  const [filterRisk, setFilterRisk] = useState<string>("");

  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (filterStatus) params.set("status", filterStatus);
      if (filterAgent) params.set("agent_group", filterAgent);

      const res = await fetch(`/api/console/admin/queue?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      let filtered = data.tasks as TaskWithOrg[];
      if (filterRisk) {
        filtered = filtered.filter((t) => t.risk_level === filterRisk);
      }

      setTasks(filtered);
      setTotal(data.total);
    } catch (err) {
      console.error("Fetch tasks error:", err);
    }
  }, [page, filterStatus, filterAgent, filterRisk]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/console/admin/queue/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTasks(), fetchStats()]);
    setLastRefresh(new Date());
    setLoading(false);
  }, [fetchTasks, fetchStats]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleAction(taskId: string, action: string) {
    try {
      const res = await fetch(`/api/console/admin/queue/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Action failed");
      await refresh();
    } catch (err) {
      console.error("Action error:", err);
    }
  }

  async function handleReassign(taskId: string, agentGroup: string) {
    try {
      const res = await fetch(`/api/console/admin/queue/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentGroup }),
      });
      if (!res.ok) throw new Error("Reassign failed");
      await refresh();
    } catch (err) {
      console.error("Reassign error:", err);
    }
  }

  const totalPages = Math.ceil(total / 30);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Air Traffic Control
          </h1>
          <p className="text-muted text-sm mt-1">
            Orchestrator queue management
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

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Queued", value: stats.queued, color: "text-blue-400" },
            { label: "Running", value: stats.running, color: "text-emerald-400" },
            { label: "Blocked", value: stats.blocked, color: stats.blocked > 0 ? "text-amber-400" : "text-foreground" },
            { label: "Completed", value: stats.completed, color: "text-green-400" },
            { label: "Failed", value: stats.failed, color: stats.failed > 0 ? "text-red-400" : "text-foreground" },
            { label: "Avg wait", value: formatDuration(stats.avgWaitTimeMs), color: "text-foreground" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-dark rounded-lg border border-dark-border p-3"
            >
              <p className="text-muted text-xs mb-1">{stat.label}</p>
              <p className={`text-lg font-semibold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="bg-dark border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={filterAgent}
          onChange={(e) => { setFilterAgent(e.target.value); setPage(1); }}
          className="bg-dark border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg"
        >
          <option value="">All agent groups</option>
          {AGENT_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={filterRisk}
          onChange={(e) => { setFilterRisk(e.target.value); setPage(1); }}
          className="bg-dark border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg"
        >
          <option value="">All risk levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        {(filterStatus || filterAgent || filterRisk) && (
          <button
            onClick={() => { setFilterStatus(""); setFilterAgent(""); setFilterRisk(""); setPage(1); }}
            className="text-orange text-sm hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Queue table */}
      <div className="bg-dark rounded-lg border border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border text-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">Priority</th>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Org</th>
                <th className="text-left px-4 py-3">Agent</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Risk</th>
                <th className="text-left px-4 py-3">Wait</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    {loading ? "Loading..." : "No tasks in queue"}
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const isBlocked = task.status === "blocked";
                  const isFailed = task.status === "failed";

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-dark-border/30 transition-colors ${
                        isBlocked
                          ? "bg-amber-500/5"
                          : isFailed
                          ? "bg-red-500/5"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${
                            task.priority >= 80
                              ? "bg-orange/20 text-orange"
                              : task.priority >= 60
                              ? "bg-blue-500/20 text-blue-400"
                              : task.priority >= 40
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-foreground font-medium truncate max-w-[240px]">
                          {task.title}
                        </p>
                        {task.linear_issue_key && (
                          <p className="text-muted text-xs mt-0.5">
                            {task.linear_issue_key}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-foreground text-sm truncate max-w-[120px]">
                          {task.organization?.name ?? "—"}
                        </p>
                        <p className="text-muted text-xs capitalize">
                          {task.tier}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-muted-light text-xs capitalize">
                          {task.agent_group ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            STATUS_COLORS[task.status] ?? ""
                          }`}
                        >
                          {task.status}
                        </span>
                        {isBlocked && task.blocked_reason && (
                          <p className="text-amber-400 text-xs mt-0.5 truncate max-w-[140px]">
                            {task.blocked_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium capitalize ${RISK_COLORS[task.risk_level] ?? ""}`}>
                          {task.risk_level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                        {timeAgo(task.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {isFailed && (
                            <button
                              onClick={() => handleAction(task.id, "retry")}
                              className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-500/10 transition-colors"
                            >
                              Retry
                            </button>
                          )}
                          {!["completed", "cancelled", "failed"].includes(task.status) && (
                            <button
                              onClick={() => handleAction(task.id, "cancel")}
                              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          {!["completed", "cancelled"].includes(task.status) && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleReassign(task.id, e.target.value);
                                  e.target.value = "";
                                }
                              }}
                              defaultValue=""
                              className="bg-transparent border border-dark-border text-muted text-xs px-1 py-1 rounded"
                            >
                              <option value="" disabled>
                                Reassign
                              </option>
                              {AGENT_GROUPS.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-border">
            <p className="text-muted text-xs">
              Showing {(page - 1) * 30 + 1}–{Math.min(page * 30, total)} of{" "}
              {total}
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
