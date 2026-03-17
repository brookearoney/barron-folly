"use client";

import { useEffect, useState, useCallback } from "react";
import EmptyState from "@/components/console/EmptyState";
import type {
  PromptFlowType,
  PromptVersion,
  ABTest,
  ABTestResults,
  PromptPerformanceStats,
} from "@/lib/console/types";

const FLOW_LABELS: Record<PromptFlowType, string> = {
  dossier: "Business Dossier",
  style_guide: "Style Guide",
  clarify: "Clarify Questions",
  construct: "Task Construction",
  suggestions: "Suggestions",
  scrape: "Scrape",
};

const FLOW_LIST: PromptFlowType[] = ["dossier", "style_guide", "clarify", "construct", "suggestions", "scrape"];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-[#9E9E98]/15 text-[#9E9E98] border-[#9E9E98]/30",
  running: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  paused: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

type TabId = "versions" | "tests" | "performance";

export default function AdminPromptsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("versions");
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFlow, setExpandedFlow] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [versionStats, setVersionStats] = useState<Record<string, PromptPerformanceStats>>({});
  const [testResults, setTestResults] = useState<Record<string, ABTestResults>>({});
  const [flowFilter, setFlowFilter] = useState<string>("");

  // Create version form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFlow, setCreateFlow] = useState<PromptFlowType>("clarify");
  const [createName, setCreateName] = useState("");
  const [createSystemPrompt, setCreateSystemPrompt] = useState("");
  const [createUserTemplate, setCreateUserTemplate] = useState("");
  const [createModel, setCreateModel] = useState("claude-sonnet-4-20250514");
  const [createTemp, setCreateTemp] = useState("0");
  const [createMaxTokens, setCreateMaxTokens] = useState("4096");
  const [creating, setCreating] = useState(false);

  // Create test form
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [testFlow, setTestFlow] = useState<PromptFlowType>("clarify");
  const [testName, setTestName] = useState("");
  const [testDescription, setTestDescription] = useState("");
  const [testVariantA, setTestVariantA] = useState("");
  const [testVariantB, setTestVariantB] = useState("");
  const [testSplit, setTestSplit] = useState("50");
  const [testMinSample, setTestMinSample] = useState("30");
  const [creatingTest, setCreatingTest] = useState(false);

  const fetchVersions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (flowFilter) params.set("flow", flowFilter);
      const res = await fetch(`/api/console/admin/prompts?${params}`);
      const data = await res.json();
      setVersions(data.versions ?? []);
    } catch (err) {
      console.error("Failed to fetch prompt versions:", err);
    }
  }, [flowFilter]);

  const fetchTests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (flowFilter) params.set("flow", flowFilter);
      const res = await fetch(`/api/console/admin/prompts/tests?${params}`);
      const data = await res.json();
      setTests(data.tests ?? []);
    } catch (err) {
      console.error("Failed to fetch A/B tests:", err);
    }
  }, [flowFilter]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchVersions(), fetchTests()]);
    setLoading(false);
  }, [fetchVersions, fetchTests]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function fetchVersionStats(versionId: string) {
    if (versionStats[versionId]) return;
    try {
      const res = await fetch(`/api/console/admin/prompts/${versionId}`);
      const data = await res.json();
      if (data.stats) {
        setVersionStats((prev) => ({ ...prev, [versionId]: data.stats }));
      }
    } catch (err) {
      console.error("Failed to fetch version stats:", err);
    }
  }

  async function fetchTestResults(testId: string) {
    if (testResults[testId]) return;
    try {
      const res = await fetch(`/api/console/admin/prompts/tests/${testId}`);
      const data = await res.json();
      if (data.results) {
        setTestResults((prev) => ({ ...prev, [testId]: data.results }));
      }
    } catch (err) {
      console.error("Failed to fetch test results:", err);
    }
  }

  async function handleActivate(versionId: string) {
    try {
      await fetch(`/api/console/admin/prompts/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate" }),
      });
      await fetchVersions();
    } catch (err) {
      console.error("Failed to activate version:", err);
    }
  }

  async function handleDeactivate(versionId: string) {
    try {
      await fetch(`/api/console/admin/prompts/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate" }),
      });
      await fetchVersions();
    } catch (err) {
      console.error("Failed to deactivate version:", err);
    }
  }

  async function handleCreateVersion() {
    if (!createName || !createSystemPrompt || !createUserTemplate) return;
    setCreating(true);
    try {
      await fetch("/api/console/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow: createFlow,
          name: createName,
          system_prompt: createSystemPrompt,
          user_prompt_template: createUserTemplate,
          model: createModel,
          temperature: parseFloat(createTemp),
          max_tokens: parseInt(createMaxTokens, 10),
        }),
      });
      setShowCreateForm(false);
      setCreateName("");
      setCreateSystemPrompt("");
      setCreateUserTemplate("");
      await fetchVersions();
    } catch (err) {
      console.error("Failed to create version:", err);
    }
    setCreating(false);
  }

  async function handleCreateTest() {
    if (!testName || !testVariantA || !testVariantB) return;
    setCreatingTest(true);
    try {
      await fetch("/api/console/admin/prompts/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow: testFlow,
          name: testName,
          description: testDescription,
          variantAId: testVariantA,
          variantBId: testVariantB,
          splitPercentage: parseInt(testSplit, 10),
          minSampleSize: parseInt(testMinSample, 10),
        }),
      });
      setShowCreateTest(false);
      setTestName("");
      setTestDescription("");
      setTestVariantA("");
      setTestVariantB("");
      await fetchTests();
    } catch (err) {
      console.error("Failed to create test:", err);
    }
    setCreatingTest(false);
  }

  async function handleTestAction(testId: string, action: string, winnerId?: string) {
    try {
      await fetch(`/api/console/admin/prompts/tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          winnerId,
          conclusion: action === "complete" ? `Test completed. Winner: ${winnerId}` : undefined,
        }),
      });
      // Clear cached results so they'll be refetched
      setTestResults((prev) => {
        const next = { ...prev };
        delete next[testId];
        return next;
      });
      await fetchTests();
    } catch (err) {
      console.error("Failed to update test:", err);
    }
  }

  async function handleSeedRegistry() {
    setLoading(true);
    try {
      await fetch("/api/console/admin/prompts?seed=true");
      await fetchVersions();
    } catch (err) {
      console.error("Failed to seed registry:", err);
    }
    setLoading(false);
  }

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

  function formatCost(usd: number): string {
    if (usd < 0.01) return `$${(usd * 100).toFixed(2)}c`;
    return `$${usd.toFixed(4)}`;
  }

  // Group versions by flow
  const versionsByFlow: Record<string, PromptVersion[]> = {};
  for (const v of versions) {
    if (!versionsByFlow[v.flow]) versionsByFlow[v.flow] = [];
    versionsByFlow[v.flow].push(v);
  }

  // Versions available for A/B test creation (filtered by testFlow)
  const testFlowVersions = versions.filter((v) => v.flow === testFlow);

  // Compute summary stats for the Performance tab
  const activeVersions = versions.filter((v) => v.is_active);
  const totalVersions = versions.length;
  const flowsWithActive = new Set(activeVersions.map((v) => v.flow)).size;

  const TABS: { id: TabId; label: string }[] = [
    { id: "versions", label: "Prompt Versions" },
    { id: "tests", label: "A/B Tests" },
    { id: "performance", label: "Performance" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Prompt Lab</h1>
          <p className="text-muted text-sm mt-1">
            Version, test, and optimize AI prompts across all flows
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSeedRegistry}
            className="px-4 py-2 text-sm bg-dark border border-dark-border rounded-lg text-muted hover:text-foreground hover:border-orange transition-colors"
          >
            Seed Registry
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-dark rounded-lg border border-dark-border p-4">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">Total Versions</p>
          <p className="text-foreground text-xl font-semibold">{totalVersions}</p>
        </div>
        <div className="bg-dark rounded-lg border border-dark-border p-4">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">Active Versions</p>
          <p className="text-emerald-400 text-xl font-semibold">{activeVersions.length}</p>
        </div>
        <div className="bg-dark rounded-lg border border-dark-border p-4">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">Flows Covered</p>
          <p className="text-foreground text-xl font-semibold">{flowsWithActive}</p>
        </div>
        <div className="bg-dark rounded-lg border border-dark-border p-4">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">Active Tests</p>
          <p className="text-yellow-400 text-xl font-semibold">
            {tests.filter((t) => t.status === "running").length}
          </p>
        </div>
      </div>

      {/* Flow Filter */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={flowFilter}
          onChange={(e) => setFlowFilter(e.target.value)}
          className="px-3 py-2 bg-dark border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
        >
          <option value="">All flows</option>
          {FLOW_LIST.map((f) => (
            <option key={f} value={f}>{FLOW_LABELS[f]}</option>
          ))}
        </select>
      </div>

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
          {/* ── Prompt Versions Tab ─────────────────────────────────── */}
          {activeTab === "versions" && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="px-4 py-2 text-sm bg-orange text-white rounded-lg hover:bg-orange/90 transition-colors"
                >
                  {showCreateForm ? "Cancel" : "New Version"}
                </button>
              </div>

              {/* Create Form */}
              {showCreateForm && (
                <div className="bg-dark rounded-lg border border-dark-border p-5 mb-6">
                  <h3 className="text-foreground font-semibold mb-4">Create New Prompt Version</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-muted text-xs uppercase tracking-wider block mb-1">Flow</label>
                      <select
                        value={createFlow}
                        onChange={(e) => setCreateFlow(e.target.value as PromptFlowType)}
                        className="w-full px-3 py-2 bg-dark-border/30 border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange"
                      >
                        {FLOW_LIST.map((f) => (
                          <option key={f} value={f}>{FLOW_LABELS[f]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-muted text-xs uppercase tracking-wider block mb-1">Name</label>
                      <input
                        type="text"
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        placeholder="v2-concise-clarify"
                        className="w-full px-3 py-2 bg-dark-border/30 border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-muted text-xs uppercase tracking-wider block mb-1">Model</label>
                      <select
                        value={createModel}
                        onChange={(e) => setCreateModel(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-border/30 border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange"
                      >
                        <option value="claude-sonnet-4-20250514">Claude Sonnet</option>
                        <option value="claude-haiku-4-5-20251001">Claude Haiku</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-muted text-xs uppercase tracking-wider block mb-1">Temperature</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={createTemp}
                        onChange={(e) => setCreateTemp(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-border/30 border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange"
                      />
                    </div>
                    <div>
                      <label className="text-muted text-xs uppercase tracking-wider block mb-1">Max Tokens</label>
                      <input
                        type="number"
                        value={createMaxTokens}
                        onChange={(e) => setCreateMaxTokens(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-border/30 border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="text-muted text-xs uppercase tracking-wider block mb-1">System Prompt</label>
                    <textarea
                      value={createSystemPrompt}
                      onChange={(e) => setCreateSystemPrompt(e.target.value)}
                      rows={6}
                      placeholder="You are..."
                      className="w-full px-3 py-2 bg-dark-border/30 border border-dark-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:border-orange resize-y"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="text-muted text-xs uppercase tracking-wider block mb-1">
                      User Prompt Template
                      <span className="text-muted/60 normal-case ml-2">Use {"{{variable}}"} for placeholders</span>
                    </label>
                    <textarea
                      value={createUserTemplate}
                      onChange={(e) => setCreateUserTemplate(e.target.value)}
                      rows={6}
                      placeholder="Here is the input: {{input}}..."
                      className="w-full px-3 py-2 bg-dark-border/30 border border-dark-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:border-orange resize-y"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleCreateVersion}
                      disabled={creating || !createName || !createSystemPrompt || !createUserTemplate}
                      className="px-4 py-2 text-sm bg-orange text-white rounded-lg hover:bg-orange/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {creating ? "Creating..." : "Create Version"}
                    </button>
                  </div>
                </div>
              )}

              {/* Versions by Flow */}
              {Object.keys(versionsByFlow).length === 0 ? (
                <EmptyState
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                      />
                    </svg>
                  }
                  title="No prompt versions found"
                  description='Click "Seed Registry" to import the current hardcoded prompts as v1 baselines.'
                />
              ) : (
                <div className="space-y-3">
                  {FLOW_LIST.filter((f) => versionsByFlow[f]).map((flow) => {
                    const flowVersions = versionsByFlow[flow];
                    const isExpanded = expandedFlow === flow;
                    const activeVersion = flowVersions.find((v) => v.is_active);

                    return (
                      <div key={flow} className="bg-dark rounded-lg border border-dark-border overflow-hidden">
                        <button
                          onClick={() => setExpandedFlow(isExpanded ? null : flow)}
                          className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-dark-border/20 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-foreground font-semibold">{FLOW_LABELS[flow]}</span>
                            <span className="text-muted text-xs">{flowVersions.length} version{flowVersions.length !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {activeVersion && (
                              <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                Active: {activeVersion.name}
                              </span>
                            )}
                            <svg
                              className={`w-4 h-4 text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-dark-border">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-dark-border">
                                  <th className="text-left px-5 py-2.5 text-muted text-xs uppercase tracking-wider font-medium">Version</th>
                                  <th className="text-left px-5 py-2.5 text-muted text-xs uppercase tracking-wider font-medium">Name</th>
                                  <th className="text-left px-5 py-2.5 text-muted text-xs uppercase tracking-wider font-medium">Model</th>
                                  <th className="text-left px-5 py-2.5 text-muted text-xs uppercase tracking-wider font-medium">Status</th>
                                  <th className="text-left px-5 py-2.5 text-muted text-xs uppercase tracking-wider font-medium">Created</th>
                                  <th className="text-right px-5 py-2.5 text-muted text-xs uppercase tracking-wider font-medium">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-dark-border">
                                {flowVersions.map((v) => {
                                  const isVersionExpanded = expandedVersion === v.id;
                                  const stats = versionStats[v.id];

                                  return (
                                    <tr key={v.id} className="group">
                                      <td colSpan={6} className="p-0">
                                        <div>
                                          <button
                                            onClick={() => {
                                              setExpandedVersion(isVersionExpanded ? null : v.id);
                                              if (!isVersionExpanded) fetchVersionStats(v.id);
                                            }}
                                            className="w-full text-left hover:bg-dark-border/20 transition-colors"
                                          >
                                            <div className="flex items-center px-5 py-3">
                                              <div className="w-[60px] shrink-0">
                                                <span className="text-foreground font-mono text-sm">v{v.version}</span>
                                              </div>
                                              <div className="w-[200px] shrink-0">
                                                <span className="text-foreground text-sm">{v.name}</span>
                                              </div>
                                              <div className="w-[180px] shrink-0">
                                                <span className="text-muted text-xs font-mono">{v.model}</span>
                                              </div>
                                              <div className="w-[120px] shrink-0 flex gap-1">
                                                {v.is_active && (
                                                  <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                                    Active
                                                  </span>
                                                )}
                                                {v.is_baseline && (
                                                  <span className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                                                    Baseline
                                                  </span>
                                                )}
                                              </div>
                                              <div className="w-[120px] shrink-0">
                                                <span className="text-muted text-xs">{formatDate(v.created_at)}</span>
                                              </div>
                                              <div className="flex-1 flex justify-end">
                                                <span
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (v.is_active) {
                                                      handleDeactivate(v.id);
                                                    } else {
                                                      handleActivate(v.id);
                                                    }
                                                  }}
                                                  className={`text-xs px-2.5 py-1 rounded cursor-pointer transition-colors ${
                                                    v.is_active
                                                      ? "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
                                                      : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                                                  }`}
                                                >
                                                  {v.is_active ? "Deactivate" : "Activate"}
                                                </span>
                                              </div>
                                            </div>
                                          </button>

                                          {isVersionExpanded && (
                                            <div className="px-5 pb-4 border-t border-dark-border/50 bg-dark-border/10">
                                              {/* Stats row */}
                                              {stats && stats.totalRuns > 0 && (
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 mb-4">
                                                  <div className="bg-dark rounded p-2.5 border border-dark-border/50">
                                                    <p className="text-muted text-xs mb-0.5">Runs</p>
                                                    <p className="text-foreground text-sm font-semibold">{stats.totalRuns}</p>
                                                  </div>
                                                  <div className="bg-dark rounded p-2.5 border border-dark-border/50">
                                                    <p className="text-muted text-xs mb-0.5">Success Rate</p>
                                                    <p className="text-emerald-400 text-sm font-semibold">{(stats.successRate * 100).toFixed(1)}%</p>
                                                  </div>
                                                  <div className="bg-dark rounded p-2.5 border border-dark-border/50">
                                                    <p className="text-muted text-xs mb-0.5">Avg Cost</p>
                                                    <p className="text-foreground text-sm font-semibold">{formatCost(stats.avgCost)}</p>
                                                  </div>
                                                  <div className="bg-dark rounded p-2.5 border border-dark-border/50">
                                                    <p className="text-muted text-xs mb-0.5">Avg Duration</p>
                                                    <p className="text-foreground text-sm font-semibold">{formatDuration(stats.avgDuration)}</p>
                                                  </div>
                                                  <div className="bg-dark rounded p-2.5 border border-dark-border/50">
                                                    <p className="text-muted text-xs mb-0.5">Quality</p>
                                                    <p className="text-foreground text-sm font-semibold">
                                                      {stats.avgQualityScore != null ? stats.avgQualityScore.toFixed(1) : "--"}
                                                    </p>
                                                  </div>
                                                </div>
                                              )}

                                              {/* Config */}
                                              <div className="grid grid-cols-3 gap-3 mt-3 mb-3 text-xs">
                                                <div>
                                                  <p className="text-muted uppercase tracking-wider mb-1">Temperature</p>
                                                  <p className="text-foreground">{v.temperature}</p>
                                                </div>
                                                <div>
                                                  <p className="text-muted uppercase tracking-wider mb-1">Max Tokens</p>
                                                  <p className="text-foreground">{v.max_tokens}</p>
                                                </div>
                                                <div>
                                                  <p className="text-muted uppercase tracking-wider mb-1">ID</p>
                                                  <p className="text-foreground font-mono text-[11px]">{v.id}</p>
                                                </div>
                                              </div>

                                              {/* System prompt preview */}
                                              <div className="mt-2">
                                                <p className="text-muted text-xs uppercase tracking-wider mb-1">System Prompt</p>
                                                <pre className="text-foreground text-xs bg-dark-border/30 rounded-lg p-3 whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">
                                                  {v.system_prompt}
                                                </pre>
                                              </div>

                                              {/* User template preview */}
                                              <div className="mt-3">
                                                <p className="text-muted text-xs uppercase tracking-wider mb-1">User Prompt Template</p>
                                                <pre className="text-foreground text-xs bg-dark-border/30 rounded-lg p-3 whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">
                                                  {v.user_prompt_template}
                                                </pre>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── A/B Tests Tab ──────────────────────────────────────── */}
          {activeTab === "tests" && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowCreateTest(!showCreateTest)}
                  className="px-4 py-2 text-sm bg-orange text-white rounded-lg hover:bg-orange/90 transition-colors"
                >
                  {showCreateTest ? "Cancel" : "New A/B Test"}
                </button>
              </div>

              {/* Create Test Form */}
              {showCreateTest && (
                <div className="bg-dark rounded-lg border border-dark-border p-5 mb-6">
                  <h3 className="text-foreground font-semibold mb-4">Create A/B Test</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-muted text-xs uppercase tracking-wider block mb-1">Flow</label>
                      <select
                        value={testFlow}
                        onChange={(e) => {
                          setTestFlow(e.target.value as PromptFlowType);
                          setTestVariantA("");
                          setTestVariantB("");
                        }}
                        className="w-full px-3 py-2 bg-dark-border/30 border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange"
                      >
                        {FLOW_LIST.map((f) => (
                          <option key={f} value={f}>{FLOW_LABELS[f]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-muted text-xs uppercase tracking-wider block mb-1">Test Name</label>
                      <input
                        type="text"
                        value={testName}
                        onChange={(e) => setTestName(e.target.value)}
                        placeholder="Concise vs verbose clarify"
                        className="w-full px-3 py-2 bg-dark-border/30 border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="text-muted text-xs uppercase tracking-wider block mb-1">Description</label>
                    <input
                      type="text"
                      value={testDescription}
                      onChange={(e) => setTestDescription(e.target.value)}
                      placeholder="Testing whether shorter prompts produce better questions"
                      className="w-full px-3 py-2 bg-dark-border/30 border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-muted text-xs uppercase tracking-wider block mb-1">Variant A (Control)</label>
                      <select
                        value={testVariantA}
                        onChange={(e) => setTestVariantA(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-border/30 border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange"
                      >
                        <option value="">Select version...</option>
                        {testFlowVersions.map((v) => (
                          <option key={v.id} value={v.id}>
                            v{v.version}: {v.name} {v.is_active ? "(active)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-muted text-xs uppercase tracking-wider block mb-1">Variant B (Challenger)</label>
                      <select
                        value={testVariantB}
                        onChange={(e) => setTestVariantB(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-border/30 border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange"
                      >
                        <option value="">Select version...</option>
                        {testFlowVersions.map((v) => (
                          <option key={v.id} value={v.id}>
                            v{v.version}: {v.name} {v.is_active ? "(active)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-muted text-xs uppercase tracking-wider block mb-1">Split % (to variant B)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={testSplit}
                        onChange={(e) => setTestSplit(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-border/30 border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange"
                      />
                    </div>
                    <div>
                      <label className="text-muted text-xs uppercase tracking-wider block mb-1">Min Sample Size</label>
                      <input
                        type="number"
                        min="5"
                        value={testMinSample}
                        onChange={(e) => setTestMinSample(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-border/30 border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleCreateTest}
                      disabled={creatingTest || !testName || !testVariantA || !testVariantB}
                      className="px-4 py-2 text-sm bg-orange text-white rounded-lg hover:bg-orange/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {creatingTest ? "Creating..." : "Create Test"}
                    </button>
                  </div>
                </div>
              )}

              {/* Tests List */}
              {tests.length === 0 ? (
                <EmptyState
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                      />
                    </svg>
                  }
                  title="No A/B tests found"
                  description="Create a test to compare two prompt versions head-to-head."
                />
              ) : (
                <div className="space-y-4">
                  {tests.map((test) => {
                    const results = testResults[test.id];
                    const variantAVersion = versions.find((v) => v.id === test.variant_a_id);
                    const variantBVersion = versions.find((v) => v.id === test.variant_b_id);

                    return (
                      <div key={test.id} className="bg-dark rounded-lg border border-dark-border overflow-hidden">
                        <div className="px-5 py-4 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-foreground font-semibold">{test.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[test.status]}`}>
                                {test.status}
                              </span>
                              <span className="text-muted text-xs">{FLOW_LABELS[test.flow as PromptFlowType]}</span>
                            </div>
                            {test.description && (
                              <p className="text-muted text-sm">{test.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {test.status === "draft" && (
                              <button
                                onClick={() => handleTestAction(test.id, "start")}
                                className="px-3 py-1.5 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/25 transition-colors"
                              >
                                Start
                              </button>
                            )}
                            {test.status === "running" && (
                              <>
                                <button
                                  onClick={() => handleTestAction(test.id, "pause")}
                                  className="px-3 py-1.5 text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 rounded hover:bg-yellow-500/25 transition-colors"
                                >
                                  Pause
                                </button>
                                <button
                                  onClick={() => fetchTestResults(test.id)}
                                  className="px-3 py-1.5 text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/25 transition-colors"
                                >
                                  View Results
                                </button>
                              </>
                            )}
                            {test.status === "paused" && (
                              <button
                                onClick={() => handleTestAction(test.id, "start")}
                                className="px-3 py-1.5 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/25 transition-colors"
                              >
                                Resume
                              </button>
                            )}
                            {(test.status === "running" || test.status === "paused") && (
                              <>
                                <button
                                  onClick={() => handleTestAction(test.id, "complete", test.variant_a_id)}
                                  className="px-3 py-1.5 text-xs bg-dark-border/40 text-muted rounded hover:bg-dark-border/60 transition-colors"
                                >
                                  A Wins
                                </button>
                                <button
                                  onClick={() => handleTestAction(test.id, "complete", test.variant_b_id)}
                                  className="px-3 py-1.5 text-xs bg-dark-border/40 text-muted rounded hover:bg-dark-border/60 transition-colors"
                                >
                                  B Wins
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Variant info */}
                        <div className="px-5 pb-3 flex gap-6 text-xs text-muted">
                          <span>
                            A: {variantAVersion ? `v${variantAVersion.version} ${variantAVersion.name}` : test.variant_a_id.slice(0, 8)}
                          </span>
                          <span>
                            B: {variantBVersion ? `v${variantBVersion.version} ${variantBVersion.name}` : test.variant_b_id.slice(0, 8)}
                          </span>
                          <span>Split: {test.split_percentage}% to B</span>
                          <span>Min samples: {test.min_sample_size}</span>
                        </div>

                        {/* Results */}
                        {results && (
                          <div className="border-t border-dark-border px-5 py-4">
                            <div className="grid grid-cols-2 gap-6 mb-4">
                              {/* Variant A */}
                              <div className="bg-dark-border/20 rounded-lg p-4">
                                <h4 className="text-foreground text-sm font-semibold mb-3">
                                  Variant A (Control)
                                  {test.winner_id === test.variant_a_id && (
                                    <span className="ml-2 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">Winner</span>
                                  )}
                                </h4>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div>
                                    <p className="text-muted mb-0.5">Runs</p>
                                    <p className="text-foreground font-semibold">{results.variantA.totalRuns}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted mb-0.5">Success</p>
                                    <p className="text-foreground font-semibold">{(results.variantA.successRate * 100).toFixed(1)}%</p>
                                  </div>
                                  <div>
                                    <p className="text-muted mb-0.5">Avg Cost</p>
                                    <p className="text-foreground font-semibold">{formatCost(results.variantA.avgCost)}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted mb-0.5">Avg Duration</p>
                                    <p className="text-foreground font-semibold">{formatDuration(results.variantA.avgDuration)}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted mb-0.5">Avg Tokens</p>
                                    <p className="text-foreground font-semibold">{results.variantA.avgTotalTokens}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted mb-0.5">Quality</p>
                                    <p className="text-foreground font-semibold">
                                      {results.variantA.avgQualityScore != null ? results.variantA.avgQualityScore.toFixed(1) : "--"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Variant B */}
                              <div className="bg-dark-border/20 rounded-lg p-4">
                                <h4 className="text-foreground text-sm font-semibold mb-3">
                                  Variant B (Challenger)
                                  {test.winner_id === test.variant_b_id && (
                                    <span className="ml-2 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">Winner</span>
                                  )}
                                </h4>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div>
                                    <p className="text-muted mb-0.5">Runs</p>
                                    <p className="text-foreground font-semibold">{results.variantB.totalRuns}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted mb-0.5">Success</p>
                                    <p className="text-foreground font-semibold">{(results.variantB.successRate * 100).toFixed(1)}%</p>
                                  </div>
                                  <div>
                                    <p className="text-muted mb-0.5">Avg Cost</p>
                                    <p className="text-foreground font-semibold">{formatCost(results.variantB.avgCost)}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted mb-0.5">Avg Duration</p>
                                    <p className="text-foreground font-semibold">{formatDuration(results.variantB.avgDuration)}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted mb-0.5">Avg Tokens</p>
                                    <p className="text-foreground font-semibold">{results.variantB.avgTotalTokens}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted mb-0.5">Quality</p>
                                    <p className="text-foreground font-semibold">
                                      {results.variantB.avgQualityScore != null ? results.variantB.avgQualityScore.toFixed(1) : "--"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Statistical indicators */}
                            <div className="flex gap-4 text-xs">
                              <span className={`px-2 py-1 rounded border ${results.sampleSizeReached ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"}`}>
                                {results.sampleSizeReached ? "Sample size reached" : "Insufficient samples"}
                              </span>
                              <span className={`px-2 py-1 rounded border ${results.statisticallySignificant ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-[#9E9E98]/15 text-[#9E9E98] border-[#9E9E98]/30"}`}>
                                {results.statisticallySignificant ? "Statistically significant" : "Not yet significant"}
                              </span>
                            </div>

                            {/* Recommendation */}
                            <div className="mt-3 px-3 py-2 bg-dark-border/30 rounded text-sm text-muted">
                              {results.recommendation}
                            </div>

                            {test.conclusion && (
                              <div className="mt-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded text-sm text-blue-400">
                                Conclusion: {test.conclusion}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Performance Tab ────────────────────────────────────── */}
          {activeTab === "performance" && (
            <div>
              {versions.length === 0 ? (
                <EmptyState
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                      />
                    </svg>
                  }
                  title="No performance data"
                  description="Seed the prompt registry and start running prompts to collect performance data."
                />
              ) : (
                <div className="space-y-6">
                  {/* Per-flow performance cards */}
                  {FLOW_LIST.filter((f) => !flowFilter || flowFilter === f)
                    .filter((f) => versionsByFlow[f])
                    .map((flow) => {
                      const flowVersions = versionsByFlow[flow];

                      return (
                        <div key={flow} className="bg-dark rounded-lg border border-dark-border p-5">
                          <h3 className="text-foreground font-semibold text-lg mb-4">{FLOW_LABELS[flow]}</h3>

                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-dark-border">
                                  <th className="text-left px-3 py-2 text-muted text-xs uppercase tracking-wider font-medium">Version</th>
                                  <th className="text-left px-3 py-2 text-muted text-xs uppercase tracking-wider font-medium">Status</th>
                                  <th className="text-right px-3 py-2 text-muted text-xs uppercase tracking-wider font-medium">Runs</th>
                                  <th className="text-right px-3 py-2 text-muted text-xs uppercase tracking-wider font-medium">Success</th>
                                  <th className="text-right px-3 py-2 text-muted text-xs uppercase tracking-wider font-medium">Avg Tokens</th>
                                  <th className="text-right px-3 py-2 text-muted text-xs uppercase tracking-wider font-medium">Avg Cost</th>
                                  <th className="text-right px-3 py-2 text-muted text-xs uppercase tracking-wider font-medium">P50 Dur</th>
                                  <th className="text-right px-3 py-2 text-muted text-xs uppercase tracking-wider font-medium">P95 Dur</th>
                                  <th className="text-right px-3 py-2 text-muted text-xs uppercase tracking-wider font-medium">Quality</th>
                                  <th className="text-right px-3 py-2 text-muted text-xs uppercase tracking-wider font-medium">Total Cost</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-dark-border">
                                {flowVersions.map((v) => {
                                  const stats = versionStats[v.id];

                                  return (
                                    <tr
                                      key={v.id}
                                      className="hover:bg-dark-border/20 transition-colors cursor-pointer"
                                      onClick={() => {
                                        fetchVersionStats(v.id);
                                      }}
                                    >
                                      <td className="px-3 py-2.5">
                                        <span className="text-foreground">v{v.version}</span>
                                        <span className="text-muted ml-2 text-xs">{v.name}</span>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        {v.is_active ? (
                                          <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                            Active
                                          </span>
                                        ) : (
                                          <span className="text-muted text-xs">Inactive</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2.5 text-right text-foreground">
                                        {stats ? stats.totalRuns : "--"}
                                      </td>
                                      <td className="px-3 py-2.5 text-right">
                                        <span className={stats && stats.successRate >= 0.95 ? "text-emerald-400" : stats && stats.successRate < 0.8 ? "text-red-400" : "text-foreground"}>
                                          {stats ? `${(stats.successRate * 100).toFixed(1)}%` : "--"}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5 text-right text-foreground">
                                        {stats ? stats.avgTotalTokens.toLocaleString() : "--"}
                                      </td>
                                      <td className="px-3 py-2.5 text-right text-foreground">
                                        {stats ? formatCost(stats.avgCost) : "--"}
                                      </td>
                                      <td className="px-3 py-2.5 text-right text-foreground">
                                        {stats ? formatDuration(stats.p50Duration) : "--"}
                                      </td>
                                      <td className="px-3 py-2.5 text-right text-foreground">
                                        {stats ? formatDuration(stats.p95Duration) : "--"}
                                      </td>
                                      <td className="px-3 py-2.5 text-right text-foreground">
                                        {stats && stats.avgQualityScore != null ? stats.avgQualityScore.toFixed(1) : "--"}
                                      </td>
                                      <td className="px-3 py-2.5 text-right text-foreground font-medium">
                                        {stats ? formatCost(stats.totalCost) : "--"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <p className="text-muted text-xs mt-3">
                            Click a row to load performance data for that version.
                          </p>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
