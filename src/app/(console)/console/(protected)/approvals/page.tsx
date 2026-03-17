"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import EmptyState from "@/components/console/EmptyState";
import { RISK_COLORS } from "@/lib/console/constants";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import type { Approval, ApprovalType, Request as RequestType } from "@/lib/console/types";

type ApprovalWithRequest = Approval & {
  request?: Pick<RequestType, "id" | "title" | "linear_issue_key">;
};

const TYPE_LABELS: Record<ApprovalType, string> = {
  standard: "Standard",
  client_preview: "Preview",
  architecture: "Architecture",
  production_deploy: "Production",
  revision: "Revision",
};

const TYPE_COLORS: Record<ApprovalType, string> = {
  standard: "bg-blue-500/10 text-blue-400",
  client_preview: "bg-purple-500/10 text-purple-400",
  architecture: "bg-yellow-500/10 text-yellow-400",
  production_deploy: "bg-red-500/10 text-red-400",
  revision: "bg-orange/10 text-orange",
};

type FilterType = "all" | ApprovalType;

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalWithRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");

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

  // Filter approvals by type
  const filtered = typeFilter === "all"
    ? approvals
    : approvals.filter((a) => (a.approval_type || "standard") === typeFilter);

  const pending = filtered.filter((a) => !a.decision);
  const decided = filtered.filter((a) => a.decision);

  // Group chain approvals together for pending items
  const groupedPending = groupByChain(pending);

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

      {/* Type filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {(
          [
            { value: "all", label: "All" },
            { value: "standard", label: "Standard" },
            { value: "client_preview", label: "Preview" },
            { value: "architecture", label: "Architecture" },
            { value: "production_deploy", label: "Production" },
          ] as { value: FilterType; label: string }[]
        ).map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTypeFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === opt.value
                ? "bg-orange/10 text-orange"
                : "bg-dark text-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
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
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          }
          title="No matching approvals"
          description="No approvals match the selected filter."
        />
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="text-foreground font-medium mb-3">
                Needs your review ({pending.length})
              </h2>
              <div className="space-y-3">
                {groupedPending.map((group) => (
                  <div key={group.chainId} className={group.items.length > 1 ? "bg-dark/50 rounded-lg border border-dark-border p-2 space-y-2" : ""}>
                    {group.items.length > 1 && (
                      <div className="flex items-center gap-2 px-3 pt-1">
                        <span className="text-xs text-muted">Chain</span>
                        <div className="flex items-center gap-1">
                          {group.items.map((a, i) => (
                            <div key={a.id} className="flex items-center gap-1">
                              {i > 0 && <div className="w-3 h-px bg-dark-border" />}
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium ${
                                a.decision === "approved"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : a.decision === "revision_requested"
                                  ? "bg-orange/20 text-orange"
                                  : !a.decision
                                  ? "bg-orange/10 text-orange border border-orange/30"
                                  : "bg-dark-border text-muted"
                              }`}>
                                {a.step_number || i + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {group.items.filter((a) => !a.decision).map((a) => (
                      <ApprovalCard key={a.id} approval={a} />
                    ))}
                  </div>
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
                      <div className="flex items-center gap-2">
                        <p className="text-foreground text-sm font-medium">
                          {a.title}
                        </p>
                        {a.approval_type && a.approval_type !== "standard" && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${TYPE_COLORS[a.approval_type as ApprovalType]}`}>
                            {TYPE_LABELS[a.approval_type as ApprovalType]}
                          </span>
                        )}
                        {(a.total_steps || 1) > 1 && (
                          <span className="text-[10px] text-muted">
                            Step {a.step_number} of {a.total_steps}
                          </span>
                        )}
                      </div>
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

function ApprovalCard({ approval: a }: { approval: ApprovalWithRequest }) {
  const approvalType = (a.approval_type || "standard") as ApprovalType;
  const isPreview = approvalType === "client_preview";

  return (
    <Link
      key={a.id}
      href={isPreview ? `/console/approvals/${a.id}/preview` : `/console/approvals/${a.id}`}
      className={`block bg-dark rounded-lg border p-5 hover:border-orange/40 transition-colors ${
        a.decision === "revision_requested"
          ? "border-orange/30"
          : "border-orange/20"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-muted">
          {a.request && (
            <span>{a.request.linear_issue_key || a.request.title}</span>
          )}
          <span>&middot;</span>
          <span>{formatRelativeTime(a.created_at)}</span>
          {(a.total_steps || 1) > 1 && (
            <>
              <span>&middot;</span>
              <span>Step {a.step_number} of {a.total_steps}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {a.approval_type && a.approval_type !== "standard" && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${TYPE_COLORS[approvalType]}`}>
              {TYPE_LABELS[approvalType]}
            </span>
          )}
          {a.decision === "revision_requested" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange/10 text-orange">
              Needs Revision
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full ${RISK_COLORS[a.risk_level]}`}>
            {a.risk_level} risk
          </span>
        </div>
      </div>
      <p className="text-foreground font-medium text-sm mb-1">
        {a.title}
      </p>
      <p className="text-muted text-sm line-clamp-2">
        {a.summary}
      </p>
    </Link>
  );
}

interface ChainGroup {
  chainId: string;
  items: ApprovalWithRequest[];
}

function groupByChain(approvals: ApprovalWithRequest[]): ChainGroup[] {
  const chains = new Map<string, ApprovalWithRequest[]>();
  const standalone: ApprovalWithRequest[] = [];

  for (const a of approvals) {
    if ((a.total_steps || 1) > 1) {
      const chainId = a.parent_approval_id || a.id;
      if (!chains.has(chainId)) {
        chains.set(chainId, []);
      }
      chains.get(chainId)!.push(a);
    } else {
      standalone.push(a);
    }
  }

  const groups: ChainGroup[] = [];

  for (const [chainId, items] of chains) {
    items.sort((x, y) => (x.step_number || 1) - (y.step_number || 1));
    groups.push({ chainId, items });
  }

  for (const a of standalone) {
    groups.push({ chainId: a.id, items: [a] });
  }

  return groups;
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
