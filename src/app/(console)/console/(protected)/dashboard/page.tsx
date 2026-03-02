import Link from "next/link";
import { redirect } from "next/navigation";
import { getConsoleContext } from "@/lib/console/helpers";
import { createServerClient } from "@/lib/supabase/server";
import StatusBadge from "@/components/console/StatusBadge";
import PriorityBadge from "@/components/console/PriorityBadge";
import EmptyState from "@/components/console/EmptyState";
import { CATEGORY_LABELS } from "@/lib/console/constants";
import type { Request, RequestStatus } from "@/lib/console/types";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await getConsoleContext();
  if (!ctx) redirect("/console/login");

  const supabase = await createServerClient();

  // Fetch requests
  const { data: requests } = await supabase
    .from("requests")
    .select("*")
    .eq("organization_id", ctx.organization.id)
    .order("created_at", { ascending: false });

  const allRequests = (requests || []) as Request[];

  // Stats
  const activeStatuses: RequestStatus[] = ["submitted", "backlog", "todo", "in_progress", "in_review"];
  const activeRequests = allRequests.filter((r) => activeStatuses.includes(r.status));
  const completedRequests = allRequests.filter((r) => r.status === "done" || r.status === "shipped");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted text-sm mt-1">
            Track and manage your requests
          </p>
        </div>
        <Link
          href="/console/requests/new"
          className="bg-orange hover:bg-orange-dark text-dark font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          New request
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <p className="text-muted text-sm mb-1">Active requests</p>
          <p className="text-2xl font-semibold text-foreground">
            {activeRequests.length}
            <span className="text-muted text-sm font-normal ml-1">
              / {ctx.organization.max_concurrent_requests} max
            </span>
          </p>
        </div>
        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <p className="text-muted text-sm mb-1">Pending clarifications</p>
          <p className="text-2xl font-semibold text-orange">
            {ctx.pendingCounts.clarifications}
          </p>
        </div>
        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <p className="text-muted text-sm mb-1">Pending approvals</p>
          <p className="text-2xl font-semibold text-orange">
            {ctx.pendingCounts.approvals}
          </p>
        </div>
      </div>

      {/* Request list */}
      <div className="bg-dark rounded-lg border border-dark-border">
        <div className="px-5 py-4 border-b border-dark-border">
          <h2 className="text-foreground font-medium">All requests</h2>
        </div>

        {allRequests.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="No requests yet"
            description="Submit your first request to get started."
            action={
              <Link
                href="/console/requests/new"
                className="bg-orange hover:bg-orange-dark text-dark font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
              >
                New request
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-dark-border">
            {allRequests.map((req) => (
              <Link
                key={req.id}
                href={`/console/requests/${req.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-dark-border/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {req.linear_issue_key && (
                      <span className="text-muted text-xs font-mono">
                        {req.linear_issue_key}
                      </span>
                    )}
                    <span className="text-foreground text-sm font-medium truncate">
                      {req.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span>{CATEGORY_LABELS[req.category]}</span>
                    <span>
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <PriorityBadge priority={req.priority} />
                <StatusBadge status={req.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
