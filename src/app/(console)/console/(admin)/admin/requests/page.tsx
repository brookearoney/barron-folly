"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/console/StatusBadge";
import PriorityBadge from "@/components/console/PriorityBadge";
import EmptyState from "@/components/console/EmptyState";
import { STATUS_LABELS, CATEGORY_LABELS } from "@/lib/console/constants";
import type {
  Request as Req,
  RequestStatus,
  Organization,
  Tier,
} from "@/lib/console/types";

type RequestWithOrg = Req & {
  organization?: Pick<Organization, "id" | "name" | "slug" | "tier">;
};

const TIER_COLORS: Record<Tier, string> = {
  copper: "text-amber-600",
  steel: "text-[#9E9E98]",
  titanium: "text-cyan-400",
  tungsten: "text-orange",
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<RequestWithOrg[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchOrgs();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, orgFilter]);

  async function fetchOrgs() {
    const res = await fetch("/api/console/admin/organizations");
    const data = await res.json();
    setOrgs((data.organizations || []).map((o: { id: string; name: string }) => ({ id: o.id, name: o.name })));
  }

  async function fetchRequests() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (orgFilter) params.set("org_id", orgFilter);
    params.set("limit", "50");

    const res = await fetch(`/api/console/admin/requests?${params}`);
    const data = await res.json();
    setRequests(data.requests || []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">All Requests</h1>
          <p className="text-muted text-sm mt-1">{total} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-dark border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={orgFilter}
          onChange={(e) => setOrgFilter(e.target.value)}
          className="px-3 py-2 bg-dark border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
        >
          <option value="">All organizations</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          title="No requests found"
          description={statusFilter || orgFilter ? "Try adjusting your filters." : "No requests have been submitted yet."}
        />
      ) : (
        <div className="bg-dark rounded-lg border border-dark-border divide-y divide-dark-border">
          {requests.map((req) => (
            <Link
              key={req.id}
              href={`/console/requests/${req.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-dark-border/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {req.linear_issue_key && (
                    <span className="text-muted text-xs font-mono">{req.linear_issue_key}</span>
                  )}
                  <span className="text-foreground text-sm font-medium truncate">{req.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  {req.organization && (
                    <span className={TIER_COLORS[req.organization.tier as Tier] || "text-muted"}>
                      {req.organization.name}
                    </span>
                  )}
                  <span>{CATEGORY_LABELS[req.category]}</span>
                  <span>{new Date(req.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <PriorityBadge priority={req.priority} />
              <StatusBadge status={req.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
