"use client";

import { useState, useEffect, useCallback } from "react";
import type { SuggestionMetrics, Organization } from "@/lib/console/types";

interface EffectivenessRecord {
  accepted: number;
  dismissed: number;
  rate: number;
}

interface EffectivenessData {
  byCategory: Record<string, EffectivenessRecord>;
  bySource: Record<string, EffectivenessRecord>;
  byPriority: Record<string, EffectivenessRecord>;
}

interface OrgOption {
  id: string;
  name: string;
  tier: string;
}

const SOURCE_LABELS: Record<string, string> = {
  ai: "AI",
  admin: "Admin",
  system: "System",
  trend: "Trend",
};

const CATEGORY_LABELS: Record<string, string> = {
  web_platform: "Web Platform",
  automation: "Automation",
  design_system: "Design System",
  integration: "Integration",
  internal_tool: "Internal Tools",
  seo: "SEO",
  content: "Content",
  brand: "Brand",
  ai_agent: "AI Agent",
  other: "General",
  uncategorized: "Uncategorized",
};

export default function AdminSuggestionsPage() {
  const [metrics, setMetrics] = useState<SuggestionMetrics | null>(null);
  const [effectiveness, setEffectiveness] = useState<EffectivenessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [runningCycle, setRunningCycle] = useState(false);
  const [cycleResult, setCycleResult] = useState<string | null>(null);

  // Manual suggestion form
  const [selectedOrg, setSelectedOrg] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [manualPriority, setManualPriority] = useState("medium");
  const [manualRationale, setManualRationale] = useState("");
  const [manualEffort, setManualEffort] = useState("");
  const [submittingManual, setSubmittingManual] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, orgsRes] = await Promise.all([
        fetch("/api/console/admin/suggestions"),
        fetch("/api/console/admin/organizations"),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.metrics);
        setEffectiveness(data.effectiveness);
      }

      if (orgsRes.ok) {
        const data = await orgsRes.json();
        setOrgs(
          (data.organizations || []).map((o: Organization) => ({
            id: o.id,
            name: o.name,
            tier: o.tier,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch admin suggestion data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleRunAllCycles() {
    setRunningCycle(true);
    setCycleResult(null);
    try {
      const res = await fetch("/api/console/admin/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCycleResult(
        `Generated ${data.totalGenerated} suggestions across ${data.orgCount} orgs (${data.skippedCount} skipped)`
      );
      await fetchData();
    } catch (err) {
      setCycleResult(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setRunningCycle(false);
    }
  }

  async function handleExpireOld() {
    try {
      const res = await fetch("/api/console/admin/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "expire", daysOld: 90 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCycleResult(`Expired ${data.expired} old suggestions`);
      await fetchData();
    } catch (err) {
      setCycleResult(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrg || !manualTitle || !manualDescription) return;

    setSubmittingManual(true);
    try {
      const res = await fetch(
        `/api/console/admin/suggestions/${selectedOrg}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "manual",
            title: manualTitle,
            description: manualDescription,
            category: manualCategory || null,
            priority: manualPriority,
            rationale: manualRationale || undefined,
            estimated_effort: manualEffort || undefined,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      // Reset form
      setManualTitle("");
      setManualDescription("");
      setManualCategory("");
      setManualPriority("medium");
      setManualRationale("");
      setManualEffort("");
      setShowManualForm(false);
      setCycleResult("Manual suggestion created successfully");
      await fetchData();
    } catch (err) {
      setCycleResult(
        `Error: ${err instanceof Error ? err.message : "Failed to create suggestion"}`
      );
    } finally {
      setSubmittingManual(false);
    }
  }

  async function handleRunOrgCycle(orgId: string) {
    try {
      const res = await fetch(
        `/api/console/admin/suggestions/${orgId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generate" }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCycleResult(
        `Generated ${data.stored} suggestions for org (${data.generated} candidates, ${data.deduped} after dedup)`
      );
      await fetchData();
    } catch (err) {
      setCycleResult(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Suggestion Engine
          </h1>
          <p className="text-muted text-sm mt-1">
            Proactive suggestions management and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExpireOld}
            className="bg-dark border border-dark-border text-muted text-sm px-3 py-2 rounded-lg hover:text-foreground hover:bg-dark-border/50 transition-colors"
          >
            Expire Old
          </button>
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="bg-dark border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg hover:bg-dark-border/50 transition-colors"
          >
            {showManualForm ? "Cancel" : "Create Manual"}
          </button>
          <button
            onClick={handleRunAllCycles}
            disabled={runningCycle}
            className="bg-orange text-background text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange/90 transition-colors disabled:opacity-50"
          >
            {runningCycle ? "Running..." : "Run All Cycles"}
          </button>
        </div>
      </div>

      {/* Cycle result banner */}
      {cycleResult && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg text-sm ${
            cycleResult.startsWith("Error")
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          }`}
        >
          {cycleResult}
          <button
            onClick={() => setCycleResult(null)}
            className="ml-3 text-xs opacity-60 hover:opacity-100"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Manual suggestion form */}
      {showManualForm && (
        <div className="bg-dark rounded-lg border border-dark-border p-5 mb-6">
          <h2 className="text-foreground font-medium mb-4">
            Create Manual Suggestion
          </h2>
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-muted text-xs block mb-1">
                  Organization
                </label>
                <select
                  value={selectedOrg}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                  required
                  className="w-full bg-background border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg"
                >
                  <option value="">Select org...</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.tier})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-muted text-xs block mb-1">
                  Category
                </label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full bg-background border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg"
                >
                  <option value="">None</option>
                  {Object.entries(CATEGORY_LABELS)
                    .filter(([k]) => k !== "uncategorized")
                    .map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-muted text-xs block mb-1">Title</label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                required
                placeholder="Suggestion title"
                className="w-full bg-background border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg placeholder:text-muted/50 focus:outline-none focus:border-orange/40"
              />
            </div>

            <div>
              <label className="text-muted text-xs block mb-1">
                Description
              </label>
              <textarea
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                required
                rows={3}
                placeholder="Describe what this suggestion is about and why it matters..."
                className="w-full bg-background border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg placeholder:text-muted/50 focus:outline-none focus:border-orange/40 resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-muted text-xs block mb-1">
                  Priority
                </label>
                <select
                  value={manualPriority}
                  onChange={(e) => setManualPriority(e.target.value)}
                  className="w-full bg-background border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-muted text-xs block mb-1">
                  Est. Effort
                </label>
                <input
                  type="text"
                  value={manualEffort}
                  onChange={(e) => setManualEffort(e.target.value)}
                  placeholder="e.g., days, weeks"
                  className="w-full bg-background border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg placeholder:text-muted/50 focus:outline-none focus:border-orange/40"
                />
              </div>
              <div>
                <label className="text-muted text-xs block mb-1">
                  Rationale
                </label>
                <input
                  type="text"
                  value={manualRationale}
                  onChange={(e) => setManualRationale(e.target.value)}
                  placeholder="Why this matters"
                  className="w-full bg-background border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg placeholder:text-muted/50 focus:outline-none focus:border-orange/40"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submittingManual || !selectedOrg || !manualTitle || !manualDescription}
                className="bg-orange text-background text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange/90 transition-colors disabled:opacity-50"
              >
                {submittingManual ? "Creating..." : "Create Suggestion"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Overview metrics */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
          {[
            {
              label: "Total Generated",
              value: metrics.totalGenerated,
              color: "text-foreground",
            },
            {
              label: "Accepted",
              value: metrics.acceptedCount,
              color: "text-emerald-400",
            },
            {
              label: "Dismissed",
              value: metrics.dismissedCount,
              color: "text-red-400",
            },
            {
              label: "Acceptance Rate",
              value: `${Math.round(metrics.acceptanceRate * 100)}%`,
              color:
                metrics.acceptanceRate >= 0.5
                  ? "text-emerald-400"
                  : metrics.acceptanceRate >= 0.3
                    ? "text-amber-400"
                    : "text-red-400",
            },
            {
              label: "Avg Confidence",
              value: `${Math.round(metrics.avgConfidence * 100)}%`,
              color: "text-foreground",
            },
            {
              label: "Avg Time to Action",
              value: `${metrics.avgTimeToAction}h`,
              color: "text-foreground",
            },
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

      {/* Effectiveness breakdown */}
      {effectiveness && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <EffectivenessTable
            title="By Source"
            data={effectiveness.bySource}
            labelMap={SOURCE_LABELS}
          />
          <EffectivenessTable
            title="By Priority"
            data={effectiveness.byPriority}
            labelMap={{ low: "Low", medium: "Medium", high: "High" }}
          />
          <EffectivenessTable
            title="By Category"
            data={effectiveness.byCategory}
            labelMap={CATEGORY_LABELS}
          />
        </div>
      )}

      {/* Top categories */}
      {metrics && metrics.topCategories.length > 0 && (
        <div className="bg-dark rounded-lg border border-dark-border p-5 mb-6">
          <h2 className="text-foreground font-medium mb-3">
            Top Suggestion Categories
          </h2>
          <div className="space-y-2">
            {metrics.topCategories.map((tc) => {
              const maxCount = metrics.topCategories[0]?.count || 1;
              const pct = Math.round((tc.count / maxCount) * 100);
              return (
                <div key={tc.category} className="flex items-center gap-3">
                  <span className="text-sm text-muted w-32 truncate">
                    {CATEGORY_LABELS[tc.category] || tc.category}
                  </span>
                  <div className="flex-1 bg-dark-border/30 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-orange/60 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted w-8 text-right">
                    {tc.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-org trigger */}
      <div className="bg-dark rounded-lg border border-dark-border p-5">
        <h2 className="text-foreground font-medium mb-3">
          Per-Organization Actions
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border text-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-2">Organization</th>
                <th className="text-left px-4 py-2">Tier</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {orgs.map((org) => (
                <tr
                  key={org.id}
                  className="hover:bg-dark-border/30 transition-colors"
                >
                  <td className="px-4 py-2 text-foreground">{org.name}</td>
                  <td className="px-4 py-2 text-muted capitalize">
                    {org.tier}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleRunOrgCycle(org.id)}
                      className="text-xs text-orange hover:text-orange/80 px-2 py-1 rounded hover:bg-orange/10 transition-colors"
                    >
                      Run Cycle
                    </button>
                  </td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-muted"
                  >
                    No organizations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EffectivenessTable({
  title,
  data,
  labelMap,
}: {
  title: string;
  data: Record<string, EffectivenessRecord>;
  labelMap: Record<string, string>;
}) {
  const entries = Object.entries(data).sort(
    (a, b) => b[1].accepted + b[1].dismissed - (a[1].accepted + a[1].dismissed)
  );

  if (entries.length === 0) {
    return (
      <div className="bg-dark rounded-lg border border-dark-border p-4">
        <h3 className="text-foreground text-sm font-medium mb-2">{title}</h3>
        <p className="text-muted text-xs">No data yet</p>
      </div>
    );
  }

  return (
    <div className="bg-dark rounded-lg border border-dark-border p-4">
      <h3 className="text-foreground text-sm font-medium mb-3">{title}</h3>
      <div className="space-y-2">
        {entries.map(([key, record]) => (
          <div
            key={key}
            className="flex items-center justify-between text-xs"
          >
            <span className="text-muted truncate max-w-[100px]">
              {labelMap[key] || key}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">{record.accepted}a</span>
              <span className="text-muted">/</span>
              <span className="text-red-400">{record.dismissed}d</span>
              <span
                className={`font-medium ${
                  record.rate >= 0.5
                    ? "text-emerald-400"
                    : record.rate >= 0.3
                      ? "text-amber-400"
                      : "text-red-400"
                }`}
              >
                {Math.round(record.rate * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
