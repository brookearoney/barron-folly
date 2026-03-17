"use client";

import { useState, useEffect, useCallback } from "react";
import type { HealthCheck, SystemHealth } from "@/lib/console/types";

interface Anomaly {
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  details: Record<string, unknown>;
}

interface LatencyPercentiles {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

const HEALTH_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  healthy: { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-500" },
  degraded: { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-500" },
  unhealthy: { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-500" },
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function AdminHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [percentiles, setPercentiles] = useState<LatencyPercentiles | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Org filter for anomaly detection
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("");

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedOrg) params.set("org_id", selectedOrg);

      const res = await fetch(`/api/console/admin/health?${params}`);
      const data = await res.json();
      setHealth(data.health ?? null);
      setPercentiles(data.percentiles ?? null);
      setAnomalies(data.anomalies ?? []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to fetch health:", err);
    }
    setLoading(false);
  }, [selectedOrg]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchHealth, 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

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
    if (ms < 1) return "<1ms";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  function timeAgo(dateStr: string): string {
    const ms = Date.now() - new Date(dateStr).getTime();
    if (ms < 60_000) return "just now";
    if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
    return `${Math.round(ms / 3_600_000)}h ago`;
  }

  const overallStatus = health?.overall ?? "healthy";
  const overallColors = HEALTH_COLORS[overallStatus] ?? HEALTH_COLORS.healthy;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">System Health</h1>
          <p className="text-muted text-sm mt-1">
            Real-time health monitoring and anomaly detection
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted text-xs">
            Updated {timeAgo(lastRefresh.toISOString())}
          </span>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="bg-dark border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg hover:bg-dark-border/50 transition-colors disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {loading && !health ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Overall Status Banner */}
          <div
            className={`rounded-lg border p-5 mb-6 ${
              overallStatus === "healthy"
                ? "border-emerald-500/30 bg-emerald-500/5"
                : overallStatus === "degraded"
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-red-500/30 bg-red-500/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${overallColors.dot} animate-pulse`} />
              <div>
                <p className={`text-lg font-semibold capitalize ${overallColors.text}`}>
                  System {overallStatus}
                </p>
                <p className="text-muted text-sm mt-0.5">
                  {health?.services.filter((s) => s.status === "healthy").length ?? 0}/
                  {health?.services.length ?? 0} services healthy
                </p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          {health && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-dark rounded-lg border border-dark-border p-4">
                <p className="text-muted text-xs uppercase tracking-wider mb-1">Active Traces</p>
                <p className="text-foreground text-xl font-semibold">{health.activeTraces}</p>
              </div>
              <div className="bg-dark rounded-lg border border-dark-border p-4">
                <p className="text-muted text-xs uppercase tracking-wider mb-1">Queue Depth</p>
                <p
                  className={`text-xl font-semibold ${
                    health.queueDepth > 20 ? "text-amber-400" : "text-foreground"
                  }`}
                >
                  {health.queueDepth}
                </p>
              </div>
              <div className="bg-dark rounded-lg border border-dark-border p-4">
                <p className="text-muted text-xs uppercase tracking-wider mb-1">Error Rate</p>
                <p
                  className={`text-xl font-semibold ${
                    health.errorRate > 10 ? "text-red-400" : health.errorRate > 5 ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {health.errorRate}/hr
                </p>
              </div>
              <div className="bg-dark rounded-lg border border-dark-border p-4">
                <p className="text-muted text-xs uppercase tracking-wider mb-1">Avg Latency</p>
                <p className="text-foreground text-xl font-semibold">
                  {formatDuration(health.avgLatency_ms)}
                </p>
              </div>
            </div>
          )}

          {/* Service Health Cards */}
          <h2 className="text-lg font-semibold text-foreground mb-3">Service Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {(health?.services ?? []).map((svc) => {
              const colors = HEALTH_COLORS[svc.status] ?? HEALTH_COLORS.healthy;
              return (
                <div
                  key={svc.service}
                  className={`rounded-lg border p-4 ${colors.bg} border-current/20`}
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-foreground text-sm font-medium">{svc.service}</p>
                    <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                  </div>
                  <p className={`text-xs font-medium capitalize ${colors.text}`}>
                    {svc.status}
                  </p>
                  <p className="text-muted text-xs mt-1">
                    Latency: {formatDuration(svc.latency_ms)}
                  </p>
                  {svc.details && Object.keys(svc.details).length > 0 && (
                    <div className="mt-2 text-xs text-muted">
                      {Object.entries(svc.details).map(([k, v]) => (
                        <span key={k} className="mr-3">
                          {k}: {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Latency Percentiles */}
          {percentiles && (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                Latency Percentiles (24h)
              </h2>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {(["p50", "p90", "p95", "p99"] as const).map((key) => (
                  <div key={key} className="bg-dark rounded-lg border border-dark-border p-4">
                    <p className="text-muted text-xs uppercase tracking-wider mb-1">{key.toUpperCase()}</p>
                    <p className="text-foreground text-xl font-semibold">
                      {formatDuration(percentiles[key])}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Anomalies */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Active Anomalies</h2>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
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

          {anomalies.length === 0 ? (
            <div className="bg-dark rounded-lg border border-dark-border p-8 text-center mb-6">
              <div className="inline-flex items-center gap-2 text-emerald-400">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <p className="text-sm font-medium">No anomalies detected</p>
              </div>
              <p className="text-muted text-xs mt-1">
                {selectedOrg
                  ? "All metrics within normal ranges for this organization."
                  : "Select an organization to check for anomalies."}
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {anomalies.map((anomaly, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-4 ${SEVERITY_COLORS[anomaly.severity]}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold uppercase">
                          {anomaly.severity}
                        </span>
                        <span className="text-xs opacity-70">{anomaly.type}</span>
                      </div>
                      <p className="text-sm">{anomaly.message}</p>
                    </div>
                  </div>
                  {Object.keys(anomaly.details).length > 0 && (
                    <div className="mt-2 text-xs opacity-70 font-mono">
                      {Object.entries(anomaly.details).map(([k, v]) => (
                        <span key={k} className="mr-3">
                          {k}={String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
