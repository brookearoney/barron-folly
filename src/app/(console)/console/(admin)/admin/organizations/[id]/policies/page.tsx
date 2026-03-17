"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABELS, RISK_COLORS, TIER_CONFIG } from "@/lib/console/constants";
import type { ClientPolicy, RequestCategory, RiskLevel, Tier } from "@/lib/console/types";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as RequestCategory[];
const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high"];
const ENVIRONMENTS = ["staging", "preview", "production"];

export default function PolicyEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [policy, setPolicy] = useState<ClientPolicy | null>(null);
  const [tier, setTier] = useState<Tier>("copper");
  const [defaults, setDefaults] = useState<Partial<ClientPolicy> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [newDoNotDo, setNewDoNotDo] = useState("");

  useEffect(() => {
    fetch(`/api/console/admin/organizations/${id}/policies`)
      .then((res) => res.json())
      .then((data) => {
        setPolicy(data.policy);
        setTier(data.tier);
        setDefaults(data.defaults);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    if (!policy) return;
    setSaving(true);
    setSaveMsg("");

    try {
      const res = await fetch(`/api/console/admin/organizations/${id}/policies`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowed_categories: policy.allowed_categories,
          blocked_categories: policy.blocked_categories,
          allowed_environments: policy.allowed_environments,
          risk_level: policy.risk_level,
          regulated: policy.regulated,
          requires_human_approval_above: policy.requires_human_approval_above,
          auto_approve_categories: policy.auto_approve_categories,
          max_concurrent_agent_tasks: policy.max_concurrent_agent_tasks,
          autopilot_enabled: policy.autopilot_enabled,
          autopilot_categories: policy.autopilot_categories,
          code_conventions: policy.code_conventions,
          do_not_do: policy.do_not_do,
          prod_change_blackout_hours: policy.prod_change_blackout_hours,
        }),
      });

      if (res.ok) {
        const { policy: updated } = await res.json();
        setPolicy(updated);
        setSaveMsg("Policy saved successfully.");
      } else {
        const err = await res.json();
        setSaveMsg(err.error || "Failed to save.");
      }
    } catch {
      setSaveMsg("Failed to save policy.");
    } finally {
      setSaving(false);
    }
  }

  function toggleArrayItem<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  }

  function updatePolicy(updates: Partial<ClientPolicy>) {
    setPolicy((prev) => (prev ? { ...prev, ...updates } : prev));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="text-center py-20">
        <p className="text-foreground font-medium">Policy not found</p>
        <Link href={`/console/admin/organizations/${id}`} className="text-orange text-sm hover:underline mt-2 inline-block">
          Back to organization
        </Link>
      </div>
    );
  }

  const tierConfig = TIER_CONFIG[tier];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/console/admin/organizations" className="hover:text-foreground transition-colors">
          Organizations
        </Link>
        <span>/</span>
        <Link href={`/console/admin/organizations/${id}`} className="hover:text-foreground transition-colors">
          Detail
        </Link>
        <span>/</span>
        <span className="text-foreground">Policy</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground text-lg font-semibold">Client Policy</h1>
          <p className="text-muted text-sm mt-1">
            Tier: <span className="text-foreground font-medium">{tierConfig.label}</span> ({tierConfig.price})
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange hover:bg-orange-dark text-dark font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save policy"}
        </button>
      </div>

      {saveMsg && (
        <p className={`text-sm mb-4 ${saveMsg.includes("success") ? "text-emerald-400" : "text-red-400"}`}>
          {saveMsg}
        </p>
      )}

      <div className="space-y-6">
        {/* Access Boundaries */}
        <section className="bg-dark rounded-lg border border-dark-border p-6 space-y-5">
          <h2 className="text-foreground font-medium">Access Boundaries</h2>

          <div>
            <label className="block text-sm text-muted-light mb-2">Allowed Categories (whitelist, empty = all allowed)</label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    updatePolicy({
                      allowed_categories: toggleArrayItem(policy.allowed_categories, cat),
                    })
                  }
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    policy.allowed_categories.includes(cat)
                      ? "bg-orange/10 border-orange text-orange"
                      : "bg-background border-dark-border text-muted hover:text-foreground"
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted-light mb-2">Blocked Categories</label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    updatePolicy({
                      blocked_categories: toggleArrayItem(policy.blocked_categories, cat),
                    })
                  }
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    policy.blocked_categories.includes(cat)
                      ? "bg-red-500/10 border-red-500 text-red-400"
                      : "bg-background border-dark-border text-muted hover:text-foreground"
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted-light mb-2">Allowed Environments</label>
            <div className="flex gap-3">
              {ENVIRONMENTS.map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() =>
                    updatePolicy({
                      allowed_environments: toggleArrayItem(policy.allowed_environments, env),
                    })
                  }
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    policy.allowed_environments.includes(env)
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                      : "bg-background border-dark-border text-muted hover:text-foreground"
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Risk & Approval Rules */}
        <section className="bg-dark rounded-lg border border-dark-border p-6 space-y-5">
          <h2 className="text-foreground font-medium">Risk & Approval Rules</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-light mb-1.5">Org Risk Level</label>
              <select
                value={policy.risk_level}
                onChange={(e) => updatePolicy({ risk_level: e.target.value as RiskLevel })}
                className="w-full px-3 py-2.5 bg-background border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
              >
                {RISK_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-light mb-1.5">Require Approval Above</label>
              <select
                value={policy.requires_human_approval_above}
                onChange={(e) =>
                  updatePolicy({ requires_human_approval_above: e.target.value as RiskLevel })
                }
                className="w-full px-3 py-2.5 bg-background border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
              >
                {RISK_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={policy.regulated}
                onChange={(e) => updatePolicy({ regulated: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-dark-border rounded-full peer peer-checked:bg-orange transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm text-muted-light">Regulated industry (adds risk weight)</span>
          </div>

          <div>
            <label className="block text-sm text-muted-light mb-2">Auto-Approve Categories (skip approval even if above threshold)</label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    updatePolicy({
                      auto_approve_categories: toggleArrayItem(policy.auto_approve_categories, cat),
                    })
                  }
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    policy.auto_approve_categories.includes(cat)
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                      : "bg-background border-dark-border text-muted hover:text-foreground"
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Risk level preview */}
          <div className="bg-background rounded-lg p-3 border border-dark-border">
            <p className="text-muted text-xs mb-2">Current risk config</p>
            <div className="flex items-center gap-4 text-sm">
              <span className={`px-2 py-0.5 rounded-full text-xs ${RISK_COLORS[policy.risk_level]}`}>
                Org: {policy.risk_level}
              </span>
              <span className="text-muted">|</span>
              <span className="text-muted-light">
                Approval required at:{" "}
                <span className="text-foreground">{policy.requires_human_approval_above}+</span>
              </span>
              <span className="text-muted">|</span>
              <span className="text-muted-light">
                Regulated: <span className="text-foreground">{policy.regulated ? "Yes" : "No"}</span>
              </span>
            </div>
          </div>
        </section>

        {/* Autonomy Settings */}
        <section className="bg-dark rounded-lg border border-dark-border p-6 space-y-5">
          <h2 className="text-foreground font-medium">Autonomy Settings</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-light mb-1.5">Max Concurrent Agent Tasks</label>
              <input
                type="number"
                min={1}
                max={20}
                value={policy.max_concurrent_agent_tasks}
                onChange={(e) =>
                  updatePolicy({ max_concurrent_agent_tasks: parseInt(e.target.value) || 2 })
                }
                className="w-full px-3 py-2.5 bg-background border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
              />
            </div>
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.autopilot_enabled}
                  onChange={(e) => updatePolicy({ autopilot_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-dark-border rounded-full peer peer-checked:bg-orange transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
              <span className="text-sm text-muted-light ml-3">Autopilot Enabled</span>
            </div>
          </div>

          {policy.autopilot_enabled && (
            <div>
              <label className="block text-sm text-muted-light mb-2">Autopilot Categories (agent works autonomously)</label>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      updatePolicy({
                        autopilot_categories: toggleArrayItem(policy.autopilot_categories, cat),
                      })
                    }
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      policy.autopilot_categories.includes(cat)
                        ? "bg-purple-500/10 border-purple-500 text-purple-400"
                        : "bg-background border-dark-border text-muted hover:text-foreground"
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Guardrails */}
        <section className="bg-dark rounded-lg border border-dark-border p-6 space-y-5">
          <h2 className="text-foreground font-medium">Guardrails</h2>

          <div>
            <label className="block text-sm text-muted-light mb-2">Do Not Do (rules the agent must never violate)</label>
            {policy.do_not_do.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {policy.do_not_do.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border border-dark-border">
                    <span className="text-red-400 text-xs">x</span>
                    <span className="text-foreground text-sm flex-1">{rule}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updatePolicy({
                          do_not_do: policy.do_not_do.filter((_, idx) => idx !== i),
                        })
                      }
                      className="text-muted hover:text-red-400 text-xs transition-colors"
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newDoNotDo}
                onChange={(e) => setNewDoNotDo(e.target.value)}
                placeholder="Add a rule..."
                className="flex-1 px-3 py-2 bg-background border border-dark-border rounded-lg text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-orange transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newDoNotDo.trim()) {
                    updatePolicy({
                      do_not_do: [...policy.do_not_do, newDoNotDo.trim()],
                    });
                    setNewDoNotDo("");
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newDoNotDo.trim()) {
                    updatePolicy({
                      do_not_do: [...policy.do_not_do, newDoNotDo.trim()],
                    });
                    setNewDoNotDo("");
                  }
                }}
                className="bg-dark-border hover:bg-dark-border/80 text-foreground text-xs px-3 py-2 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted-light mb-2">Production Blackout Hours (UTC)</label>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.prod_change_blackout_hours !== null}
                  onChange={(e) =>
                    updatePolicy({
                      prod_change_blackout_hours: e.target.checked
                        ? { start: 22, end: 6 }
                        : null,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-dark-border rounded-full peer peer-checked:bg-orange transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
              <span className="text-sm text-muted-light">Enable blackout window</span>
            </div>
            {policy.prod_change_blackout_hours && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs text-muted mb-1">Start Hour (UTC)</label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={policy.prod_change_blackout_hours.start}
                    onChange={(e) =>
                      updatePolicy({
                        prod_change_blackout_hours: {
                          ...policy.prod_change_blackout_hours!,
                          start: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">End Hour (UTC)</label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={policy.prod_change_blackout_hours.end}
                    onChange={(e) =>
                      updatePolicy({
                        prod_change_blackout_hours: {
                          ...policy.prod_change_blackout_hours!,
                          end: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-muted-light mb-1.5">Code Conventions (JSON)</label>
            <textarea
              value={JSON.stringify(policy.code_conventions, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updatePolicy({ code_conventions: parsed });
                } catch {
                  // Allow invalid JSON while typing
                }
              }}
              rows={4}
              className="w-full px-3 py-2.5 bg-background border border-dark-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:border-orange transition-colors resize-none"
            />
          </div>
        </section>

        {/* Tier Defaults Reference */}
        {defaults && (
          <section className="bg-dark rounded-lg border border-dark-border p-6 space-y-3">
            <h2 className="text-foreground font-medium">Tier Defaults ({tierConfig.label})</h2>
            <p className="text-muted text-xs">Reference values for this tier. Saving overrides these.</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted">Max Concurrent:</span>{" "}
                <span className="text-foreground">{defaults.max_concurrent_agent_tasks}</span>
              </div>
              <div>
                <span className="text-muted">Approval Above:</span>{" "}
                <span className="text-foreground">{defaults.requires_human_approval_above}</span>
              </div>
              <div>
                <span className="text-muted">Autopilot:</span>{" "}
                <span className="text-foreground">{defaults.autopilot_enabled ? "Yes" : "No"}</span>
              </div>
              <div>
                <span className="text-muted">Autopilot Cats:</span>{" "}
                <span className="text-foreground">
                  {defaults.autopilot_categories?.map((c) => CATEGORY_LABELS[c]).join(", ") || "None"}
                </span>
              </div>
              <div>
                <span className="text-muted">Environments:</span>{" "}
                <span className="text-foreground">{defaults.allowed_environments?.join(", ")}</span>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
