"use client";

import { useState, useEffect, useCallback } from "react";
import type { Tier } from "@/lib/console/types";
import type { TierEntitlements } from "@/lib/stripe/tiers";

interface EntitlementStatus {
  tier: Tier;
  entitlements: TierEntitlements;
  usage: {
    monthlyRequests: number;
    activeParallelTasks: number;
    totalRequests: number;
  };
  limits: {
    monthlyRequestsRemaining: number | null;
    parallelTasksRemaining: number;
  };
}

interface SubscriptionDetails {
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  tier: Tier;
  price: number;
}

interface UsageRecord {
  id: string;
  period_start: string;
  period_end: string;
  requests_count: number;
  tasks_completed: number;
  agent_minutes: number;
  tokens_used: number;
}

const TIER_COLORS: Record<Tier, string> = {
  copper: "from-amber-700 to-amber-500",
  steel: "from-gray-500 to-gray-300",
  titanium: "from-cyan-600 to-cyan-400",
  tungsten: "from-orange to-yellow-400",
};

const TIER_ORDER: Tier[] = ["copper", "steel", "titanium", "tungsten"];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-emerald-500/10 text-emerald-400" },
  trialing: { label: "Trial", color: "bg-blue-500/10 text-blue-400" },
  past_due: { label: "Past Due", color: "bg-red-500/10 text-red-400" },
  canceled: { label: "Cancelled", color: "bg-red-500/10 text-red-400" },
  unpaid: { label: "Unpaid", color: "bg-red-500/10 text-red-400" },
};

export default function BillingPage() {
  const [entitlements, setEntitlements] = useState<EntitlementStatus | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, usageRes] = await Promise.all([
        fetch("/api/console/billing/status"),
        fetch("/api/console/billing/usage"),
      ]);

      const statusData = await statusRes.json();
      const usageData = await usageRes.json();

      if (statusData.entitlements) setEntitlements(statusData.entitlements);
      if (statusData.subscription) setSubscription(statusData.subscription);
      if (usageData.history) setUsageHistory(usageData.history);
    } catch (err) {
      console.error("Failed to load billing data:", err);
      setError("Failed to load billing information");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleUpgrade(tier: Tier) {
    setActionLoading(tier);
    setError("");

    try {
      const res = await fetch("/api/console/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start upgrade");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleManageSubscription() {
    setActionLoading("portal");
    setError("");

    try {
      const res = await fetch("/api/console/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to open billing portal");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open billing portal");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
          <p className="text-muted text-sm mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  if (!entitlements) {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
          <p className="text-muted text-sm mt-1">
            {error || "Billing information is not available."}
          </p>
        </div>
      </div>
    );
  }

  const { tier, entitlements: config, usage, limits } = entitlements;
  const currentTierIndex = TIER_ORDER.indexOf(tier);

  const monthlyRequestsMax = config.maxMonthlyRequests;
  const monthlyRequestsPct = monthlyRequestsMax
    ? Math.min((usage.monthlyRequests / monthlyRequestsMax) * 100, 100)
    : 0;

  const parallelPct = Math.min(
    (usage.activeParallelTasks / config.maxParallelTasks) * 100,
    100
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="text-muted text-sm mt-1">
          Manage your subscription and usage
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Current Plan */}
        <div
          className={`relative overflow-hidden rounded-lg border border-dark-border p-6 bg-gradient-to-br ${TIER_COLORS[tier] || "from-dark to-dark-border"}`}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
                Current Plan
              </p>
              {subscription && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_BADGES[subscription.status]?.color ?? "bg-dark-border text-muted"}`}
                >
                  {STATUS_BADGES[subscription.status]?.label ?? subscription.status}
                </span>
              )}
            </div>
            <h2 className="text-white text-3xl font-bold mb-1">{config.name}</h2>
            {subscription && (
              <p className="text-white/80 text-lg font-medium">
                ${subscription.price}/mo
              </p>
            )}
            {subscription?.cancelAtPeriodEnd && (
              <p className="text-white/60 text-xs mt-2">
                Cancels at end of period:{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
        </div>

        {/* Usage Meters */}
        <div className="bg-dark rounded-lg border border-dark-border p-5 space-y-5">
          <h2 className="text-foreground font-medium">Usage</h2>

          {/* Monthly requests */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-light text-sm">
                Requests this month
              </span>
              <span className="text-foreground text-sm font-medium">
                {usage.monthlyRequests}
                {monthlyRequestsMax !== null
                  ? ` / ${monthlyRequestsMax}`
                  : ""}
                {monthlyRequestsMax === null && (
                  <span className="text-muted text-xs ml-1">(Unlimited)</span>
                )}
              </span>
            </div>
            {monthlyRequestsMax !== null && (
              <div className="w-full h-2 bg-dark-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${monthlyRequestsPct >= 90 ? "bg-red-400" : "bg-orange"}`}
                  style={{ width: `${monthlyRequestsPct}%` }}
                />
              </div>
            )}
            {limits.monthlyRequestsRemaining !== null && (
              <p className="text-muted text-xs mt-1">
                {limits.monthlyRequestsRemaining} remaining
              </p>
            )}
          </div>

          {/* Parallel tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-light text-sm">
                Active parallel tasks
              </span>
              <span className="text-foreground text-sm font-medium">
                {usage.activeParallelTasks} / {config.maxParallelTasks}
              </span>
            </div>
            <div className="w-full h-2 bg-dark-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${parallelPct >= 90 ? "bg-red-400" : "bg-orange"}`}
                style={{ width: `${parallelPct}%` }}
              />
            </div>
            <p className="text-muted text-xs mt-1">
              {limits.parallelTasksRemaining} slots available
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <h2 className="text-foreground font-medium mb-3">
            What&apos;s included
          </h2>
          <ul className="space-y-2">
            {config.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <svg
                  className="w-4 h-4 text-orange mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-muted-light">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Subscription Actions */}
        <div className="bg-dark rounded-lg border border-dark-border p-5 space-y-4">
          <h2 className="text-foreground font-medium">Manage Subscription</h2>

          {/* Upgrade options */}
          {currentTierIndex < TIER_ORDER.length - 1 && (
            <div>
              <p className="text-muted text-xs mb-3">
                Upgrade to unlock more capacity and features.
              </p>
              <div className="flex flex-wrap gap-2">
                {TIER_ORDER.slice(currentTierIndex + 1).map((upgradeTier) => (
                  <button
                    key={upgradeTier}
                    onClick={() => handleUpgrade(upgradeTier)}
                    disabled={actionLoading !== null}
                    className="bg-orange hover:bg-orange/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === upgradeTier ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Redirecting...
                      </span>
                    ) : (
                      `Upgrade to ${upgradeTier.charAt(0).toUpperCase() + upgradeTier.slice(1)}`
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manage existing subscription */}
          {subscription && (
            <button
              onClick={handleManageSubscription}
              disabled={actionLoading !== null}
              className="bg-dark-border hover:bg-dark-border/80 text-foreground text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {actionLoading === "portal" ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                  Opening portal...
                </span>
              ) : (
                "Manage Subscription"
              )}
            </button>
          )}
        </div>

        {/* Usage History */}
        {usageHistory.length > 0 && (
          <div className="bg-dark rounded-lg border border-dark-border p-5">
            <h2 className="text-foreground font-medium mb-4">Usage History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border">
                    <th className="text-left text-muted py-2 pr-4 font-medium">
                      Period
                    </th>
                    <th className="text-right text-muted py-2 px-3 font-medium">
                      Requests
                    </th>
                    <th className="text-right text-muted py-2 px-3 font-medium">
                      Tasks
                    </th>
                    <th className="text-right text-muted py-2 pl-3 font-medium">
                      Tokens
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usageHistory.map((record) => {
                    const start = new Date(record.period_start);
                    const label = start.toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    });
                    return (
                      <tr
                        key={record.id}
                        className="border-b border-dark-border/50"
                      >
                        <td className="text-muted-light py-2.5 pr-4">
                          {label}
                        </td>
                        <td className="text-foreground py-2.5 px-3 text-right">
                          {record.requests_count}
                        </td>
                        <td className="text-foreground py-2.5 px-3 text-right">
                          {record.tasks_completed}
                        </td>
                        <td className="text-foreground py-2.5 pl-3 text-right">
                          {record.tokens_used > 0
                            ? (record.tokens_used / 1000).toFixed(1) + "k"
                            : "0"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
