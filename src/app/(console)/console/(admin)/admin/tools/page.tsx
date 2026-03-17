"use client";

import { useEffect, useState, useCallback } from "react";
import EmptyState from "@/components/console/EmptyState";
import type {
  AgentTool,
  ToolExecutionRecord,
  ToolRiskTier,
  GroupCapabilityProfile,
  AgentGroup,
} from "@/lib/console/types";

const RISK_TIER_COLORS: Record<ToolRiskTier, string> = {
  safe: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  guarded: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  elevated: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-[#9E9E98]/15 text-[#9E9E98] border-[#9E9E98]/30",
  running: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
  denied: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

const AGENT_GROUP_LABELS: Record<AgentGroup, string> = {
  research: "Research",
  content: "Content",
  frontend: "Frontend",
  integration: "Integration",
  data: "Data",
  infra: "Infra",
  security: "Security",
  qa: "QA",
  ops: "Ops",
};

type TabId = "registry" | "executions" | "capabilities";

interface ExecutionStats {
  total: number;
  completed: number;
  failed: number;
  denied: number;
  avgDurationMs: number;
  escalationCount: number;
}

export default function AdminToolsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("registry");
  const [tools, setTools] = useState<AgentTool[]>([]);
  const [executions, setExecutions] = useState<ToolExecutionRecord[]>([]);
  const [capabilities, setCapabilities] = useState<GroupCapabilityProfile[]>([]);
  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [riskTierCounts, setRiskTierCounts] = useState<Record<ToolRiskTier, number>>({
    safe: 0, guarded: 0, elevated: 0, critical: 0,
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [toolFilter, setToolFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (toolFilter) params.set("toolId", toolFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (groupFilter) params.set("agentGroup", groupFilter);
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    try {
      const res = await fetch(`/api/console/admin/tools?${params}`);
      const data = await res.json();
      setTools(data.tools || []);
      setExecutions(data.executions || []);
      setCapabilities(data.capabilities || []);
      setStats(data.stats || null);
      setRiskTierCounts(data.riskTierCounts || { safe: 0, guarded: 0, elevated: 0, critical: 0 });
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch tools data:", err);
    }
    setLoading(false);
  }, [toolFilter, statusFilter, groupFilter, offset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setOffset(0);
  }, [toolFilter, statusFilter, groupFilter]);

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const successRate =
    stats && stats.total > 0
      ? ((stats.completed / stats.total) * 100).toFixed(1)
      : "0";

  const TABS: { id: TabId; label: string }[] = [
    { id: "registry", label: "Tool Registry" },
    { id: "executions", label: "Executions" },
    { id: "capabilities", label: "Group Capabilities" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tool Runner Dashboard</h1>
          <p className="text-muted text-sm mt-1">
            Manage agent tools, view executions, and monitor access controls
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-dark rounded-lg border border-dark-border p-4">
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Total Executions</p>
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
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Denied</p>
            <p className="text-orange-400 text-xl font-semibold">{stats.denied}</p>
          </div>
          <div className="bg-dark rounded-lg border border-dark-border p-4">
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Avg Duration</p>
            <p className="text-foreground text-xl font-semibold">
              {formatDuration(stats.avgDurationMs)}
            </p>
          </div>
          <div className="bg-dark rounded-lg border border-dark-border p-4">
            <p className="text-muted text-xs uppercase tracking-wider mb-1">Escalations</p>
            <p className="text-yellow-400 text-xl font-semibold">{stats.escalationCount}</p>
          </div>
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
          {/* ── Registry Tab ──────────────────────────────────────── */}
          {activeTab === "registry" && (
            <div>
              {/* Risk tier summary */}
              <div className="flex gap-3 mb-6">
                {(["safe", "guarded", "elevated", "critical"] as ToolRiskTier[]).map((tier) => (
                  <div
                    key={tier}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${RISK_TIER_COLORS[tier]}`}
                  >
                    <span className="capitalize">{tier}</span>
                    <span className="opacity-70">{riskTierCounts[tier]}</span>
                  </div>
                ))}
              </div>

              <div className="bg-dark rounded-lg border border-dark-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-border">
                      <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">Tool</th>
                      <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">Category</th>
                      <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">Risk Tier</th>
                      <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">Approval</th>
                      <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">Groups</th>
                      <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">Risk Levels</th>
                      <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">Rate Limits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {tools.map((tool) => (
                      <tr key={tool.id} className="hover:bg-dark-border/20 transition-colors">
                        <td className="px-5 py-3">
                          <div>
                            <p className="text-foreground font-medium text-sm">{tool.name}</p>
                            <p className="text-muted text-xs mt-0.5">{tool.description}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-foreground text-sm capitalize">{tool.category}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${RISK_TIER_COLORS[tool.riskTier]}`}>
                            {tool.riskTier}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs ${tool.requiredApproval ? "text-yellow-400" : "text-muted"}`}>
                            {tool.requiredApproval ? "Required" : "No"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {tool.allowedAgentGroups.slice(0, 4).map((g) => (
                              <span key={g} className="text-xs bg-dark-border/40 text-muted px-1.5 py-0.5 rounded">
                                {g}
                              </span>
                            ))}
                            {tool.allowedAgentGroups.length > 4 && (
                              <span className="text-xs text-muted">
                                +{tool.allowedAgentGroups.length - 4}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1">
                            {tool.allowedRiskLevels.map((rl) => (
                              <span key={rl} className="text-xs bg-dark-border/40 text-muted px-1.5 py-0.5 rounded capitalize">
                                {rl}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {tool.rateLimits ? (
                            <span className="text-muted text-xs">
                              {tool.rateLimits.maxPerHour}/hr, {tool.rateLimits.maxPerDay}/day
                            </span>
                          ) : (
                            <span className="text-muted text-xs">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Executions Tab ────────────────────────────────────── */}
          {activeTab === "executions" && (
            <div>
              {/* Filters */}
              <div className="flex gap-3 mb-6">
                <select
                  value={toolFilter}
                  onChange={(e) => setToolFilter(e.target.value)}
                  className="px-3 py-2 bg-dark border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
                >
                  <option value="">All tools</option>
                  {tools.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-dark border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="denied">Denied</option>
                </select>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="px-3 py-2 bg-dark border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
                >
                  <option value="">All groups</option>
                  {Object.entries(AGENT_GROUP_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {executions.length === 0 ? (
                <EmptyState
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  }
                  title="No tool executions found"
                  description={
                    toolFilter || statusFilter || groupFilter
                      ? "Try adjusting your filters."
                      : "No tools have been executed yet."
                  }
                />
              ) : (
                <>
                  <div className="bg-dark rounded-lg border border-dark-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-dark-border">
                          <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">Time</th>
                          <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">Tool</th>
                          <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">Group</th>
                          <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">Status</th>
                          <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">Duration</th>
                          <th className="text-left px-5 py-3 text-muted text-xs uppercase tracking-wider font-medium">Escalation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-border">
                        {executions.map((exec) => {
                          const isExpanded = expandedId === exec.id;
                          const toolMeta = tools.find((t) => t.id === exec.tool_id);

                          return (
                            <tr key={exec.id} className="group">
                              <td colSpan={6} className="p-0">
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : exec.id)}
                                  className="w-full text-left hover:bg-dark-border/30 transition-colors"
                                >
                                  <div className="flex items-center px-5 py-3">
                                    <div className="w-[140px] shrink-0">
                                      <span className="text-foreground text-sm">
                                        {formatDate(exec.created_at)}
                                      </span>
                                    </div>
                                    <div className="w-[140px] shrink-0">
                                      <span className="text-foreground text-sm">
                                        {toolMeta?.name || exec.tool_id}
                                      </span>
                                    </div>
                                    <div className="w-[100px] shrink-0">
                                      <span className="text-muted text-sm capitalize">
                                        {exec.agent_group}
                                      </span>
                                    </div>
                                    <div className="w-[110px] shrink-0">
                                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${STATUS_COLORS[exec.status] || ""}`}>
                                        {exec.status}
                                      </span>
                                    </div>
                                    <div className="w-[80px] shrink-0">
                                      <span className="text-muted text-sm">
                                        {formatDuration(exec.duration_ms)}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      {exec.requires_escalation && (
                                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full border bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
                                          Escalated
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>

                                {isExpanded && (
                                  <div className="px-5 pb-4 pt-0 border-t border-dark-border/50 bg-dark-border/10">
                                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                      <div>
                                        <p className="text-muted text-xs uppercase tracking-wider mb-1">Execution ID</p>
                                        <p className="text-foreground font-mono text-xs">{exec.id}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted text-xs uppercase tracking-wider mb-1">Task ID</p>
                                        <p className="text-foreground font-mono text-xs">{exec.task_id}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted text-xs uppercase tracking-wider mb-1">Trace ID</p>
                                        <p className="text-foreground font-mono text-xs">{exec.trace_id}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted text-xs uppercase tracking-wider mb-1">Risk Level / Tier</p>
                                        <p className="text-foreground text-xs capitalize">
                                          {exec.risk_level} / {exec.tier}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted text-xs uppercase tracking-wider mb-1">Attempt</p>
                                        <p className="text-foreground text-xs">{exec.attempt_number}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted text-xs uppercase tracking-wider mb-1">Tokens Used</p>
                                        <p className="text-foreground text-xs">{exec.tokens_used}</p>
                                      </div>
                                      {exec.error && (
                                        <div className="col-span-2">
                                          <p className="text-red-400 text-xs uppercase tracking-wider mb-1">Error</p>
                                          <pre className="text-red-300 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-3 whitespace-pre-wrap overflow-x-auto">
                                            {exec.error}
                                          </pre>
                                        </div>
                                      )}
                                      {exec.input_params && Object.keys(exec.input_params).length > 0 && (
                                        <div className="col-span-2">
                                          <p className="text-muted text-xs uppercase tracking-wider mb-1">Input Params</p>
                                          <pre className="text-foreground text-xs bg-dark-border/30 rounded-lg p-3 whitespace-pre-wrap overflow-x-auto">
                                            {JSON.stringify(exec.input_params, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                      {exec.sandbox_config && (
                                        <div className="col-span-2">
                                          <p className="text-muted text-xs uppercase tracking-wider mb-1">Sandbox Config</p>
                                          <pre className="text-foreground text-xs bg-dark-border/30 rounded-lg p-3 whitespace-pre-wrap overflow-x-auto">
                                            {JSON.stringify(exec.sandbox_config, null, 2)}
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
          )}

          {/* ── Capabilities Tab ──────────────────────────────────── */}
          {activeTab === "capabilities" && (
            <div className="space-y-4">
              {capabilities.map((cap) => (
                <div
                  key={cap.group}
                  className="bg-dark rounded-lg border border-dark-border p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-foreground font-semibold capitalize text-lg">
                      {AGENT_GROUP_LABELS[cap.group] || cap.group}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <span>Max concurrent: {cap.maxConcurrentTools}</span>
                      <span>
                        Human review at:{" "}
                        <span className="capitalize text-yellow-400">
                          {cap.requiresHumanReview}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-muted text-xs uppercase tracking-wider mb-2">
                        Default Tools ({cap.defaultTools.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {cap.defaultTools.map((tid) => {
                          const t = tools.find((tool) => tool.id === tid);
                          return (
                            <span
                              key={tid}
                              className="text-xs bg-dark-border/40 text-foreground px-2 py-1 rounded"
                              title={t?.description}
                            >
                              {t?.name || tid}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {(["low", "medium", "high"] as const).map((rl) => {
                      const riskTools = cap.riskLevelTools[rl] ?? [];
                      if (riskTools.length === 0) return null;
                      return (
                        <div key={rl}>
                          <p className="text-muted text-xs uppercase tracking-wider mb-2">
                            Additional at <span className="capitalize">{rl}</span> risk ({riskTools.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {riskTools.map((tid) => {
                              const t = tools.find((tool) => tool.id === tid);
                              return (
                                <span
                                  key={tid}
                                  className={`text-xs px-2 py-1 rounded border ${
                                    t ? RISK_TIER_COLORS[t.riskTier] : "bg-dark-border/40 text-muted border-dark-border"
                                  }`}
                                  title={t?.description}
                                >
                                  {t?.name || tid}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    <div>
                      <p className="text-muted text-xs uppercase tracking-wider mb-2">
                        Can escalate to
                      </p>
                      <div className="flex gap-1.5">
                        {cap.canEscalateTo.map((g) => (
                          <span
                            key={g}
                            className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-1 rounded capitalize"
                          >
                            {AGENT_GROUP_LABELS[g] || g}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
