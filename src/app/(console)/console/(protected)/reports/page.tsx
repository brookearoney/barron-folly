import { redirect } from "next/navigation";
import { getConsoleContext } from "@/lib/console/helpers";
import { createServerClient } from "@/lib/supabase/server";
import { getValueDelivered } from "@/lib/console/metrics";
import StatusBadge from "@/components/console/StatusBadge";
import type { Request, RequestStatus } from "@/lib/console/types";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  web_platform: "Web Platform",
  automation: "Automation",
  design_system: "Design System",
  integration: "Integration",
  internal_tool: "Internal Tool",
  seo: "SEO",
  content: "Content",
  brand: "Brand",
  ai_agent: "AI Agent",
  other: "Other",
};

function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

export default async function ClientReportsPage() {
  const ctx = await getConsoleContext();
  if (!ctx || !ctx.organization) redirect("/console/login");

  const supabase = await createServerClient();
  const orgId = ctx.organization.id;

  // Fetch data
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    value,
    valueAllTime,
    { data: recentRequests },
    { count: submittedThisMonth },
    { count: completedThisMonth },
    { count: activeCount },
    { data: completedReqs },
  ] = await Promise.all([
    getValueDelivered({ orgId, periodDays: 30 }),
    getValueDelivered({ orgId, periodDays: 365 * 5 }), // "all time"
    supabase
      .from("requests")
      .select("id, title, category, status, created_at, updated_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("created_at", monthStart),
    supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("status", ["shipped", "done"])
      .gte("updated_at", monthStart),
    supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("status", ["submitted", "backlog", "todo", "in_progress", "in_review"] as RequestStatus[]),
    supabase
      .from("requests")
      .select("created_at, updated_at")
      .eq("organization_id", orgId)
      .in("status", ["shipped", "done"])
      .gte("updated_at", monthStart),
  ]);

  // Avg turnaround
  let avgTurnaroundHours = 0;
  if (completedReqs?.length) {
    const totalHours = completedReqs.reduce((sum, r) => {
      return (
        sum +
        Math.abs(new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / 3_600_000
      );
    }, 0);
    avgTurnaroundHours = Math.round((totalHours / completedReqs.length) * 100) / 100;
  }

  const requests = (recentRequests || []) as Request[];

  // Category breakdown for all-time value
  const categoryItems = Object.entries(valueAllTime.categories)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, count]) => ({
      label: CATEGORY_LABELS[cat] || cat,
      count,
    }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
        <p className="text-muted text-sm mt-1">Your project analytics and history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="bg-dark rounded-lg border border-dark-border p-4">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">Submitted This Month</p>
          <p className="text-foreground text-2xl font-semibold">{submittedThisMonth ?? 0}</p>
        </div>
        <div className="bg-dark rounded-lg border border-dark-border p-4">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">Completed This Month</p>
          <p className="text-foreground text-2xl font-semibold">{completedThisMonth ?? 0}</p>
        </div>
        <div className="bg-dark rounded-lg border border-dark-border p-4">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">Avg Turnaround</p>
          <p className="text-foreground text-2xl font-semibold">
            {avgTurnaroundHours > 0 ? formatDuration(avgTurnaroundHours) : "--"}
          </p>
        </div>
        <div className="bg-dark rounded-lg border border-dark-border p-4">
          <p className="text-muted text-xs uppercase tracking-wider mb-1">Active Requests</p>
          <p className="text-foreground text-2xl font-semibold">{activeCount ?? 0}</p>
        </div>
      </div>

      {/* Recent History */}
      <div className="bg-dark rounded-lg border border-dark-border p-5 mb-8">
        <h2 className="text-foreground text-sm font-medium mb-4">Recent Requests</h2>
        {requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs uppercase tracking-wider border-b border-dark-border">
                  <th className="pb-2 pr-4">Title</th>
                  <th className="pb-2 pr-4">Category</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Submitted</th>
                  <th className="pb-2 pr-4">Updated</th>
                  <th className="pb-2">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/50">
                {requests.map((req) => {
                  const durationHours =
                    Math.abs(
                      new Date(req.updated_at).getTime() - new Date(req.created_at).getTime(),
                    ) / 3_600_000;
                  const isDone = req.status === "shipped" || req.status === "done";
                  return (
                    <tr key={req.id}>
                      <td className="py-2 pr-4 text-foreground font-medium max-w-[200px] truncate">
                        {req.title}
                      </td>
                      <td className="py-2 pr-4 text-muted">
                        {CATEGORY_LABELS[req.category] || req.category}
                      </td>
                      <td className="py-2 pr-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-2 pr-4 text-muted">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-4 text-muted">
                        {new Date(req.updated_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 text-muted">
                        {isDone ? formatDuration(durationHours) : "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted text-sm">No requests yet</p>
        )}
      </div>

      {/* Value Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <h2 className="text-foreground text-sm font-medium mb-4">All-Time Value</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted text-xs uppercase tracking-wider mb-1">Requests Completed</p>
              <p className="text-foreground text-xl font-semibold">{valueAllTime.completedRequests}</p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wider mb-1">Tasks Completed</p>
              <p className="text-foreground text-xl font-semibold">{valueAllTime.completedTasks}</p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wider mb-1">Est. Hours Saved</p>
              <p className="text-green-400 text-xl font-semibold">{valueAllTime.estimatedHoursSaved}</p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase tracking-wider mb-1">Agent Minutes</p>
              <p className="text-foreground text-xl font-semibold">{valueAllTime.totalAgentMinutes}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <h2 className="text-foreground text-sm font-medium mb-4">By Category</h2>
          {categoryItems.length > 0 ? (
            <div className="space-y-2">
              {categoryItems.map((item) => {
                const max = Math.max(...categoryItems.map((c) => c.count), 1);
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-muted text-xs w-28 truncate">{item.label}</span>
                    <div className="flex-1 bg-dark-border/50 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-orange"
                        style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }}
                      />
                    </div>
                    <span className="text-foreground text-xs font-medium w-6 text-right">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted text-sm">No data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
