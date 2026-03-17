import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/console/admin-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getDashboardSummary,
  getThroughput,
  getAIMetrics,
  getApprovalMetrics,
  getQueueHealth,
  getTimeToFirstResponse,
  getCycleTime,
  getValueDelivered,
} from "@/lib/console/metrics";
import type { Organization, Tier } from "@/lib/console/types";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

const TIER_COLORS: Record<Tier, string> = {
  copper: "text-amber-600",
  steel: "text-[#9E9E98]",
  titanium: "text-cyan-400",
  tungsten: "text-orange",
};

function TrendArrow({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted text-xs ml-1">--</span>;
  const isPositive = value > 0;
  return (
    <span className={`text-xs ml-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
      {isPositive ? "+" : ""}
      {value}%
    </span>
  );
}

function StatCard({
  label,
  value,
  trend,
  suffix,
  invertTrend,
}: {
  label: string;
  value: string | number;
  trend?: number;
  suffix?: string;
  invertTrend?: boolean;
}) {
  // For metrics where lower is better (like response time), invert the trend color
  const adjustedTrend = invertTrend && trend !== undefined ? -trend : trend;
  return (
    <div className="bg-dark rounded-lg border border-dark-border p-4">
      <p className="text-muted text-xs uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-foreground text-xl font-semibold">{value}</span>
        {suffix && <span className="text-muted text-sm">{suffix}</span>}
        {trend !== undefined && <TrendArrow value={adjustedTrend ?? 0} />}
      </div>
    </div>
  );
}

function BarChart({
  data,
  maxHeight = 120,
}: {
  data: Array<{ label: string; value: number; color?: string }>;
  maxHeight?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1" style={{ height: maxHeight }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-muted text-[10px]">{d.value || ""}</span>
          <div
            className={`w-full rounded-sm ${d.color || "bg-orange"}`}
            style={{ height: Math.max(2, (d.value / max) * (maxHeight - 20)) }}
          />
          <span className="text-muted text-[9px] truncate max-w-full">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function HorizontalBar({
  items,
}: {
  items: Array<{ label: string; value: number; color?: string }>;
}) {
  const max = Math.max(...items.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-muted text-xs w-28 truncate">{item.label}</span>
          <div className="flex-1 bg-dark-border/50 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full ${item.color || "bg-orange"}`}
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </div>
          <span className="text-foreground text-xs font-medium w-8 text-right">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; orgId?: string }>;
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/console/dashboard");

  const params = await searchParams;
  const periodDays = parseInt(params.period || "30", 10);
  const orgId = params.orgId || undefined;

  const admin = createAdminClient();

  // Fetch all data in parallel
  const [
    summary,
    throughput,
    aiMetrics,
    approvalMetrics,
    queueHealth,
    { data: organizations },
  ] = await Promise.all([
    getDashboardSummary({ orgId, periodDays }),
    getThroughput({ orgId, periodDays, groupBy: periodDays > 60 ? "week" : "day" }),
    getAIMetrics({ orgId, periodDays }),
    getApprovalMetrics({ orgId, periodDays }),
    getQueueHealth({ orgId }),
    admin.from("organizations").select("id, name, tier").order("name"),
  ]);

  const orgs = (organizations || []) as Pick<Organization, "id" | "name" | "tier">[];

  // Per-org breakdown (only when not filtered to single org)
  let orgBreakdown: Array<{
    id: string;
    name: string;
    tier: Tier;
    requests: number;
    completed: number;
    avgCycleHours: number;
    ttfrHours: number;
    valueTasks: number;
  }> = [];

  if (!orgId && orgs.length > 0) {
    orgBreakdown = await Promise.all(
      orgs.slice(0, 20).map(async (org) => {
        const [ttfr, cycle, value] = await Promise.all([
          getTimeToFirstResponse({ orgId: org.id, periodDays }),
          getCycleTime({ orgId: org.id, periodDays }),
          getValueDelivered({ orgId: org.id, periodDays }),
        ]);
        return {
          id: org.id,
          name: org.name,
          tier: org.tier,
          requests: value.totalRequests,
          completed: value.completedRequests,
          avgCycleHours: cycle.avgHours,
          ttfrHours: ttfr.avgHours,
          valueTasks: value.completedTasks,
        };
      }),
    );
  }

  // Throughput chart data (last N entries)
  const chartData = throughput.slice(-14).map((t) => ({
    label: t.period.slice(-5),
    value: t.completed,
  }));

  // Category breakdown from requests
  const { data: catData } = await admin
    .from("requests")
    .select("category")
    .gte("created_at", new Date(Date.now() - periodDays * 86_400_000).toISOString())
    .then((res) => res);

  const catCounts: Record<string, number> = {};
  for (const r of catData || []) {
    catCounts[r.category] = (catCounts[r.category] || 0) + 1;
  }
  const categoryItems = Object.entries(catCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([label, value]) => ({ label: label.replace(/_/g, " "), value }));

  // Risk level breakdown for approvals
  const riskItems = Object.entries(approvalMetrics.byRiskLevel)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([level, data]) => ({
      level,
      count: data.count,
      approvedRate: data.approvedRate,
    }));

  // Queue health by agent group
  const agentGroupItems = Object.entries(queueHealth.byAgentGroup)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, data]) => ({
      group,
      ...data,
    }));

  // AI flows table
  const flowItems = Object.entries(aiMetrics.byFlow)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([flow, data]) => ({
      flow,
      ...data,
    }));

  const periodOptions = [
    { label: "7 days", value: "7" },
    { label: "30 days", value: "30" },
    { label: "90 days", value: "90" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          <p className="text-muted text-sm mt-1">Performance metrics and analytics</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex bg-dark rounded-lg border border-dark-border overflow-hidden">
            {periodOptions.map((opt) => (
              <a
                key={opt.value}
                href={`/console/admin/reports?period=${opt.value}${orgId ? `&orgId=${orgId}` : ""}`}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  String(periodDays) === opt.value
                    ? "bg-orange text-dark"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {opt.label}
              </a>
            ))}
          </div>

          <select
            className="bg-dark border border-dark-border text-foreground text-xs rounded-lg px-3 py-1.5"
            defaultValue={orgId || ""}
          >
            <option value="">All organizations</option>
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>

          <a
            href={`/api/console/admin/reports/export?periodDays=${periodDays}${orgId ? `&orgId=${orgId}` : ""}`}
            className="bg-dark-border/50 hover:bg-dark-border text-foreground text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            Export JSON
          </a>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatCard
          label="Avg TTFR"
          value={summary.ttfr.avgHours}
          suffix="hrs"
          trend={summary.ttfr.trend}
          invertTrend
        />
        <StatCard
          label="Avg Cycle Time"
          value={summary.cycleTime.avgHours}
          suffix="hrs"
          trend={summary.cycleTime.trend}
          invertTrend
        />
        <StatCard
          label="Throughput"
          value={summary.throughput.current}
          suffix="tasks"
          trend={summary.throughput.trend}
        />
        <StatCard
          label="Success Rate"
          value={`${summary.successRate.current}%`}
          trend={summary.successRate.trend}
        />
        <StatCard label="Active Requests" value={summary.activeRequests} />
        <StatCard label="Queue Depth" value={summary.queueDepth} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Throughput Chart */}
        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <h3 className="text-foreground text-sm font-medium mb-4">Throughput Over Time</h3>
          {chartData.length > 0 ? (
            <BarChart data={chartData} />
          ) : (
            <p className="text-muted text-sm">No data available</p>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <h3 className="text-foreground text-sm font-medium mb-4">Requests by Category</h3>
          {categoryItems.length > 0 ? (
            <HorizontalBar items={categoryItems} />
          ) : (
            <p className="text-muted text-sm">No data available</p>
          )}
        </div>
      </div>

      {/* AI Performance */}
      <div className="bg-dark rounded-lg border border-dark-border p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-foreground text-sm font-medium">AI Performance by Flow</h3>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span>Total runs: {aiMetrics.totalRuns}</span>
            <span>Total tokens: {aiMetrics.totalTokens.toLocaleString()}</span>
            <span>Est. cost: ${aiMetrics.costEstimate}</span>
          </div>
        </div>
        {flowItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs uppercase tracking-wider border-b border-dark-border">
                  <th className="pb-2 pr-4">Flow</th>
                  <th className="pb-2 pr-4">Runs</th>
                  <th className="pb-2 pr-4">Success Rate</th>
                  <th className="pb-2">Avg Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/50">
                {flowItems.map((f) => (
                  <tr key={f.flow}>
                    <td className="py-2 pr-4 text-foreground font-medium">{f.flow}</td>
                    <td className="py-2 pr-4 text-muted">{f.count}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          f.successRate >= 90
                            ? "text-green-400"
                            : f.successRate >= 70
                              ? "text-yellow-400"
                              : "text-red-400"
                        }
                      >
                        {f.successRate}%
                      </span>
                    </td>
                    <td className="py-2 text-muted">
                      {f.avgDurationMs > 60_000
                        ? `${(f.avgDurationMs / 60_000).toFixed(1)}m`
                        : `${(f.avgDurationMs / 1000).toFixed(1)}s`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted text-sm">No AI run data available</p>
        )}
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Approval Metrics */}
        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <h3 className="text-foreground text-sm font-medium mb-4">Approval Metrics</h3>
          <div className="grid grid-cols-4 gap-3 mb-4 text-center">
            <div>
              <p className="text-foreground text-lg font-semibold">{approvalMetrics.totalApprovals}</p>
              <p className="text-muted text-xs">Total</p>
            </div>
            <div>
              <p className="text-green-400 text-lg font-semibold">{approvalMetrics.approved}</p>
              <p className="text-muted text-xs">Approved</p>
            </div>
            <div>
              <p className="text-red-400 text-lg font-semibold">{approvalMetrics.denied}</p>
              <p className="text-muted text-xs">Denied</p>
            </div>
            <div>
              <p className="text-yellow-400 text-lg font-semibold">{approvalMetrics.revisionRequested}</p>
              <p className="text-muted text-xs">Revision</p>
            </div>
          </div>
          <p className="text-muted text-xs mb-3">
            Avg decision time: {approvalMetrics.avgDecisionTimeHours} hrs
          </p>
          {riskItems.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs uppercase tracking-wider border-b border-dark-border">
                  <th className="pb-2">Risk Level</th>
                  <th className="pb-2">Count</th>
                  <th className="pb-2">Approved %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/50">
                {riskItems.map((r) => (
                  <tr key={r.level}>
                    <td className="py-2 text-foreground capitalize">{r.level}</td>
                    <td className="py-2 text-muted">{r.count}</td>
                    <td className="py-2 text-muted">{r.approvedRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Queue Health */}
        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <h3 className="text-foreground text-sm font-medium mb-4">Queue Health</h3>
          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <div>
              <p className="text-foreground text-lg font-semibold">{queueHealth.queueDepth}</p>
              <p className="text-muted text-xs">Queued</p>
            </div>
            <div>
              <p className="text-yellow-400 text-lg font-semibold">{queueHealth.blockedCount}</p>
              <p className="text-muted text-xs">Blocked</p>
            </div>
            <div>
              <p className={`text-lg font-semibold ${queueHealth.failureRate > 20 ? "text-red-400" : "text-foreground"}`}>
                {queueHealth.failureRate}%
              </p>
              <p className="text-muted text-xs">Failure Rate</p>
            </div>
          </div>
          <p className="text-muted text-xs mb-3">
            Avg wait: {queueHealth.avgWaitTimeHours} hrs | Avg process: {queueHealth.avgProcessTimeHours} hrs
          </p>
          {agentGroupItems.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs uppercase tracking-wider border-b border-dark-border">
                  <th className="pb-2">Agent Group</th>
                  <th className="pb-2">Queued</th>
                  <th className="pb-2">Running</th>
                  <th className="pb-2">Done</th>
                  <th className="pb-2">Failed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/50">
                {agentGroupItems.map((g) => (
                  <tr key={g.group}>
                    <td className="py-2 text-foreground">{g.group}</td>
                    <td className="py-2 text-muted">{g.queued}</td>
                    <td className="py-2 text-muted">{g.running}</td>
                    <td className="py-2 text-green-400">{g.completed}</td>
                    <td className="py-2 text-red-400">{g.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Per-Org Breakdown */}
      {orgBreakdown.length > 0 && (
        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <h3 className="text-foreground text-sm font-medium mb-4">Per-Organization Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs uppercase tracking-wider border-b border-dark-border">
                  <th className="pb-2 pr-4">Organization</th>
                  <th className="pb-2 pr-4">Tier</th>
                  <th className="pb-2 pr-4">Requests</th>
                  <th className="pb-2 pr-4">Completed</th>
                  <th className="pb-2 pr-4">Avg Cycle</th>
                  <th className="pb-2 pr-4">TTFR</th>
                  <th className="pb-2">Tasks Done</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/50">
                {orgBreakdown.map((org) => (
                  <tr key={org.id}>
                    <td className="py-2 pr-4 text-foreground font-medium">{org.name}</td>
                    <td className={`py-2 pr-4 capitalize ${TIER_COLORS[org.tier]}`}>{org.tier}</td>
                    <td className="py-2 pr-4 text-muted">{org.requests}</td>
                    <td className="py-2 pr-4 text-muted">{org.completed}</td>
                    <td className="py-2 pr-4 text-muted">{org.avgCycleHours}h</td>
                    <td className="py-2 pr-4 text-muted">{org.ttfrHours}h</td>
                    <td className="py-2 text-muted">{org.valueTasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
