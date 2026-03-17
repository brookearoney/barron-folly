"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  AutonomyLevel,
  AutonomyOverride,
  EscalationEvent,
  RequestCategory,
} from "@/lib/console/types";

// ─── Constants ───────────────────────────────────────────────────────────

const AUTONOMY_LEVEL_COLORS: Record<AutonomyLevel, string> = {
  suggest: "bg-gray-500/20 text-gray-400",
  auto_draft: "bg-blue-500/20 text-blue-400",
  auto_execute: "bg-emerald-500/20 text-emerald-400",
  full_auto: "bg-orange/20 text-orange",
};

const AUTONOMY_LEVEL_LABELS: Record<AutonomyLevel, string> = {
  suggest: "Suggest",
  auto_draft: "Auto Draft",
  auto_execute: "Auto Execute",
  full_auto: "Full Auto",
};

const TRIGGER_COLORS: Record<string, string> = {
  confidence_drop: "text-amber-400",
  error_threshold: "text-red-400",
  policy_violation: "text-red-500",
  timeout: "text-amber-400",
  resource_limit: "text-amber-400",
  anomaly_detected: "text-red-400",
  client_escalation: "text-blue-400",
  dependency_blocked: "text-gray-400",
};

const CATEGORIES: RequestCategory[] = [
  "web_platform", "automation", "design_system", "integration",
  "internal_tool", "seo", "content", "brand", "ai_agent", "other",
];

const AUTONOMY_LEVELS: AutonomyLevel[] = [
  "suggest", "auto_draft", "auto_execute", "full_auto",
];

interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  tier: string;
}

interface AutonomyData {
  org: OrgSummary;
  policy: Record<string, unknown> | null;
  overrides: AutonomyOverride[];
  escalations: { events: EscalationEvent[]; total: number };
  autonomyLevels: Record<string, { level: AutonomyLevel; confidence: number }> | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return `${Math.round(ms / 86_400_000)}d ago`;
}

// ─── Page Component ──────────────────────────────────────────────────────

export default function AdminAutonomyPage() {
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [data, setData] = useState<AutonomyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"levels" | "overrides" | "escalations">("levels");

  // Override form
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideScope, setOverrideScope] = useState<"org" | "category" | "task">("org");
  const [overrideScopeValue, setOverrideScopeValue] = useState("");
  const [overrideLevel, setOverrideLevel] = useState<AutonomyLevel>("suggest");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideExpiry, setOverrideExpiry] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch organizations list
  useEffect(() => {
    async function fetchOrgs() {
      try {
        const res = await fetch("/api/console/admin/organizations");
        if (!res.ok) return;
        const json = await res.json();
        setOrgs(
          (json.organizations ?? json.data ?? []).map((o: Record<string, unknown>) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
            tier: o.tier,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch orgs:", err);
      }
    }
    fetchOrgs();
  }, []);

  // Fetch autonomy data for selected org
  const fetchAutonomyData = useCallback(async () => {
    if (!selectedOrg) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        org_id: selectedOrg,
        include_escalations: "true",
        include_overrides: "true",
      });
      const res = await fetch(`/api/console/admin/autonomy?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json as AutonomyData);
    } catch (err) {
      console.error("Failed to fetch autonomy data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedOrg]);

  useEffect(() => {
    fetchAutonomyData();
  }, [fetchAutonomyData]);

  // Create override
  async function handleCreateOverride(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrg || !overrideReason) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/console/admin/autonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: selectedOrg,
          scope: overrideScope,
          scope_value: overrideScope !== "org" ? overrideScopeValue : null,
          max_autonomy_level: overrideLevel,
          reason: overrideReason,
          expires_at: overrideExpiry || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create override");
      }

      setShowOverrideForm(false);
      setOverrideReason("");
      setOverrideScopeValue("");
      setOverrideExpiry("");
      await fetchAutonomyData();
    } catch (err) {
      console.error("Failed to create override:", err);
      alert(err instanceof Error ? err.message : "Failed to create override");
    } finally {
      setSubmitting(false);
    }
  }

  // Deactivate override
  async function handleDeactivateOverride(overrideId: string) {
    try {
      const res = await fetch("/api/console/admin/autonomy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          override_id: overrideId,
          action: "deactivate",
        }),
      });
      if (!res.ok) throw new Error("Failed to deactivate");
      await fetchAutonomyData();
    } catch (err) {
      console.error("Failed to deactivate override:", err);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Autonomy Engine
          </h1>
          <p className="text-muted text-sm mt-1">
            Tier-based autonomy levels, overrides, and escalation history
          </p>
        </div>
      </div>

      {/* Org selector */}
      <div className="mb-6">
        <select
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
          className="bg-dark border border-dark-border text-foreground text-sm px-4 py-2.5 rounded-lg w-full max-w-md"
        >
          <option value="">Select organization...</option>
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name} ({org.tier})
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="text-muted text-sm py-8 text-center">Loading...</div>
      )}

      {!loading && data && (
        <>
          {/* Org summary bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-dark rounded-lg border border-dark-border p-3">
              <p className="text-muted text-xs mb-1">Organization</p>
              <p className="text-foreground font-semibold">{data.org.name}</p>
            </div>
            <div className="bg-dark rounded-lg border border-dark-border p-3">
              <p className="text-muted text-xs mb-1">Tier</p>
              <p className="text-foreground font-semibold capitalize">
                {data.org.tier}
              </p>
            </div>
            <div className="bg-dark rounded-lg border border-dark-border p-3">
              <p className="text-muted text-xs mb-1">Autopilot</p>
              <p
                className={`font-semibold ${
                  (data.policy as Record<string, unknown>)?.autopilot_enabled
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {(data.policy as Record<string, unknown>)?.autopilot_enabled
                  ? "Enabled"
                  : "Disabled"}
              </p>
            </div>
            <div className="bg-dark rounded-lg border border-dark-border p-3">
              <p className="text-muted text-xs mb-1">Active Overrides</p>
              <p
                className={`font-semibold ${
                  data.overrides.filter((o) => o.active).length > 0
                    ? "text-amber-400"
                    : "text-foreground"
                }`}
              >
                {data.overrides.filter((o) => o.active).length}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-dark-border">
            {(
              [
                { key: "levels", label: "Autonomy Levels" },
                { key: "overrides", label: "Overrides" },
                { key: "escalations", label: "Escalation History" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === key
                    ? "border-orange text-orange"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {label}
                {key === "escalations" && data.escalations.total > 0 && (
                  <span className="ml-1.5 bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded">
                    {data.escalations.total}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Autonomy Levels Tab */}
          {tab === "levels" && data.autonomyLevels && (
            <div className="bg-dark rounded-lg border border-dark-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border text-muted text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Category</th>
                    <th className="text-left px-4 py-3">Autonomy Level</th>
                    <th className="text-left px-4 py-3">Confidence</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {CATEGORIES.map((cat) => {
                    const levelData = data.autonomyLevels?.[cat];
                    if (!levelData) return null;

                    const confidencePct = Math.round(levelData.confidence * 100);
                    const autopilotCats = (
                      (data.policy as Record<string, unknown>)
                        ?.autopilot_categories as string[] | undefined
                    ) ?? [];
                    const isAutopilot = autopilotCats.includes(cat);

                    return (
                      <tr
                        key={cat}
                        className="hover:bg-dark-border/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="text-foreground font-medium capitalize">
                            {cat.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              AUTONOMY_LEVEL_COLORS[levelData.level]
                            }`}
                          >
                            {AUTONOMY_LEVEL_LABELS[levelData.level]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-dark-border rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  confidencePct >= 70
                                    ? "bg-emerald-400"
                                    : confidencePct >= 40
                                    ? "bg-amber-400"
                                    : "bg-red-400"
                                }`}
                                style={{ width: `${confidencePct}%` }}
                              />
                            </div>
                            <span className="text-muted text-xs">
                              {confidencePct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isAutopilot ? (
                            <span className="text-emerald-400 text-xs">
                              Autopilot
                            </span>
                          ) : (
                            <span className="text-muted text-xs">Manual</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === "levels" && !data.autonomyLevels && (
            <div className="bg-dark rounded-lg border border-dark-border p-8 text-center text-muted text-sm">
              No policy configured for this organization. Autonomy levels
              cannot be computed.
            </div>
          )}

          {/* Overrides Tab */}
          {tab === "overrides" && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowOverrideForm(!showOverrideForm)}
                  className="bg-orange text-white text-sm px-4 py-2 rounded-lg hover:bg-orange/90 transition-colors"
                >
                  {showOverrideForm ? "Cancel" : "New Override"}
                </button>
              </div>

              {/* Override creation form */}
              {showOverrideForm && (
                <form
                  onSubmit={handleCreateOverride}
                  className="bg-dark rounded-lg border border-dark-border p-4 mb-4 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-muted text-xs mb-1">
                        Scope
                      </label>
                      <select
                        value={overrideScope}
                        onChange={(e) =>
                          setOverrideScope(
                            e.target.value as "org" | "category" | "task"
                          )
                        }
                        className="bg-dark border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg w-full"
                      >
                        <option value="org">Organization</option>
                        <option value="category">Category</option>
                        <option value="task">Task</option>
                      </select>
                    </div>

                    {overrideScope !== "org" && (
                      <div>
                        <label className="block text-muted text-xs mb-1">
                          {overrideScope === "category"
                            ? "Category"
                            : "Task ID"}
                        </label>
                        {overrideScope === "category" ? (
                          <select
                            value={overrideScopeValue}
                            onChange={(e) =>
                              setOverrideScopeValue(e.target.value)
                            }
                            className="bg-dark border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg w-full"
                          >
                            <option value="">Select category...</option>
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={overrideScopeValue}
                            onChange={(e) =>
                              setOverrideScopeValue(e.target.value)
                            }
                            placeholder="Task UUID"
                            className="bg-dark border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg w-full"
                          />
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-muted text-xs mb-1">
                        Max Autonomy Level
                      </label>
                      <select
                        value={overrideLevel}
                        onChange={(e) =>
                          setOverrideLevel(e.target.value as AutonomyLevel)
                        }
                        className="bg-dark border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg w-full"
                      >
                        {AUTONOMY_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {AUTONOMY_LEVEL_LABELS[level]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-muted text-xs mb-1">
                        Expires At (optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={overrideExpiry}
                        onChange={(e) => setOverrideExpiry(e.target.value)}
                        className="bg-dark border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-muted text-xs mb-1">
                      Reason
                    </label>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      rows={2}
                      placeholder="Why is this override needed?"
                      required
                      className="bg-dark border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg w-full resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting || !overrideReason}
                      className="bg-orange text-white text-sm px-4 py-2 rounded-lg hover:bg-orange/90 transition-colors disabled:opacity-50"
                    >
                      {submitting ? "Creating..." : "Create Override"}
                    </button>
                  </div>
                </form>
              )}

              {/* Overrides table */}
              <div className="bg-dark rounded-lg border border-dark-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-border text-muted text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3">Scope</th>
                      <th className="text-left px-4 py-3">Max Level</th>
                      <th className="text-left px-4 py-3">Reason</th>
                      <th className="text-left px-4 py-3">Expires</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {data.overrides.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-muted"
                        >
                          No overrides configured
                        </td>
                      </tr>
                    ) : (
                      data.overrides.map((override) => (
                        <tr
                          key={override.id}
                          className={`hover:bg-dark-border/30 transition-colors ${
                            !override.active ? "opacity-50" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span className="text-foreground font-medium capitalize">
                              {override.scope}
                            </span>
                            {override.scope_value && (
                              <p className="text-muted text-xs mt-0.5">
                                {override.scope_value.replace(/_/g, " ")}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                AUTONOMY_LEVEL_COLORS[
                                  override.max_autonomy_level
                                ]
                              }`}
                            >
                              {
                                AUTONOMY_LEVEL_LABELS[
                                  override.max_autonomy_level
                                ]
                              }
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-foreground text-sm truncate max-w-[200px]">
                              {override.reason}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-muted text-xs">
                            {override.expires_at
                              ? new Date(
                                  override.expires_at
                                ).toLocaleDateString()
                              : "Never"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                override.active
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-gray-500/20 text-gray-400"
                              }`}
                            >
                              {override.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {override.active && (
                              <button
                                onClick={() =>
                                  handleDeactivateOverride(override.id)
                                }
                                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                              >
                                Deactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Escalation History Tab */}
          {tab === "escalations" && (
            <div className="bg-dark rounded-lg border border-dark-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border text-muted text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Trigger</th>
                    <th className="text-left px-4 py-3">From</th>
                    <th className="text-left px-4 py-3">To</th>
                    <th className="text-left px-4 py-3">Details</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {data.escalations.events.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-muted"
                      >
                        No escalation events
                      </td>
                    </tr>
                  ) : (
                    data.escalations.events.map((event) => (
                      <tr
                        key={event.id}
                        className="hover:bg-dark-border/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`text-sm font-medium ${
                              TRIGGER_COLORS[event.trigger] ?? "text-foreground"
                            }`}
                          >
                            {event.trigger.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              AUTONOMY_LEVEL_COLORS[event.previous_level]
                            }`}
                          >
                            {AUTONOMY_LEVEL_LABELS[event.previous_level]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              AUTONOMY_LEVEL_COLORS[event.new_level]
                            }`}
                          >
                            {AUTONOMY_LEVEL_LABELS[event.new_level]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-foreground text-sm truncate max-w-[250px]">
                            {event.details}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              event.resolved
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {event.resolved ? "Resolved" : "Open"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                          {timeAgo(event.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!loading && !data && selectedOrg && (
        <div className="text-muted text-sm py-8 text-center">
          Failed to load autonomy data for this organization.
        </div>
      )}

      {!selectedOrg && !loading && (
        <div className="text-muted text-sm py-8 text-center">
          Select an organization to view autonomy configuration.
        </div>
      )}
    </div>
  );
}
