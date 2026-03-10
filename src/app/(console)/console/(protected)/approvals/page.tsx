"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import EmptyState from "@/components/console/EmptyState";
import { RISK_COLORS } from "@/lib/console/constants";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import type { Approval, Request as RequestType } from "@/lib/console/types";

type ApprovalWithRequest = Approval & {
  request?: Pick<RequestType, "id" | "title" | "linear_issue_key">;
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalWithRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState("");

  const fetchApprovals = useCallback(async () => {
    try {
      const res = await fetch("/api/console/approvals");
      const data = await res.json();
      const items = data.approvals || [];
      setApprovals(items);
      if (items[0]?.organization_id) {
        setOrgId(items[0].organization_id);
      }
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // Subscribe to realtime updates for new approvals
  useRealtimeNotifications({
    organizationId: orgId,
    onApproval: fetchApprovals,
  });

  const pending = approvals.filter((a) => !a.decision);
  const decided = approvals.filter((a) => a.decision);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Approvals</h1>
        <p className="text-muted text-sm mt-1">
          Review and approve deliverables
        </p>
      </div>

      {approvals.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No approvals"
          description="Nothing to review at this time."
        />
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="text-foreground font-medium mb-3">
                Needs your review ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((a) => (
                  <Link
                    key={a.id}
                    href={`/console/approvals/${a.id}`}
                    className="block bg-dark rounded-lg border border-orange/20 p-5 hover:border-orange/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        {a.request && (
                          <span>{a.request.linear_issue_key || a.request.title}</span>
                        )}
                        <span>&middot;</span>
                        <span>{formatRelativeTime(a.created_at)}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${RISK_COLORS[a.risk_level]}`}>
                        {a.risk_level} risk
                      </span>
                    </div>
                    <p className="text-foreground font-medium text-sm mb-1">
                      {a.title}
                    </p>
                    <p className="text-muted text-sm line-clamp-2">
                      {a.summary}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {decided.length > 0 && (
            <div>
              <h2 className="text-muted font-medium mb-3">
                Previous decisions ({decided.length})
              </h2>
              <div className="space-y-3">
                {decided.map((a) => (
                  <div
                    key={a.id}
                    className="bg-dark rounded-lg border border-dark-border p-5 opacity-70"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-foreground text-sm font-medium">
                        {a.title}
                      </p>
                      <span className={`text-sm font-medium ${
                        a.decision === "approved" ? "text-emerald-400" :
                        a.decision === "denied" ? "text-red-400" : "text-orange"
                      }`}>
                        {a.decision === "revision_requested" ? "Revisions" : a.decision}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString();
}
