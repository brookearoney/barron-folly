"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import EmptyState from "@/components/console/EmptyState";
import { RISK_COLORS } from "@/lib/console/constants";
import type {
  Approval,
  ApprovalType,
  Request as RequestType,
  Deployment,
  RevisionRequest,
} from "@/lib/console/types";

type ApprovalDetail = Approval & {
  request?: Pick<RequestType, "id" | "title" | "linear_issue_key" | "linear_issue_id">;
};

const TYPE_LABELS: Record<ApprovalType, string> = {
  standard: "Standard",
  client_preview: "Client Preview",
  architecture: "Architecture",
  production_deploy: "Production Deploy",
  revision: "Revision",
};

export default function PreviewApprovalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [approval, setApproval] = useState<ApprovalDetail | null>(null);
  const [chainSteps, setChainSteps] = useState<ApprovalDetail[]>([]);
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [revisions, setRevisions] = useState<RevisionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [approvalRes, revisionsRes] = await Promise.all([
        fetch(`/api/console/approvals/${id}`),
        fetch(`/api/console/revisions?approval_id=${id}`),
      ]);

      const approvalData = await approvalRes.json();
      const revisionsData = await revisionsRes.json();

      const a = approvalData.approval as ApprovalDetail | null;
      setApproval(a);
      setRevisions(revisionsData.revisions || []);

      // Load chain steps if this is part of a chain
      if (a?.request_id) {
        const chainRes = await fetch(`/api/console/approvals?request_id=${a.request_id}`);
        const chainData = await chainRes.json();
        const allApprovals = (chainData.approvals || []) as ApprovalDetail[];
        const chainFiltered = allApprovals
          .filter((ap: ApprovalDetail) => ap.request_id === a.request_id && (ap.total_steps || 1) > 1)
          .sort((x: ApprovalDetail, y: ApprovalDetail) => (x.step_number || 1) - (y.step_number || 1));
        setChainSteps(chainFiltered);
      }

      // Load deployment if linked
      if (a?.artifacts_url) {
        // Check if there's a vercel deployment URL in the artifacts
        const urls = a.artifacts_url.split(/[,\n]+/).map((s: string) => s.trim());
        const vercelUrl = urls.find((u: string) => u.includes("vercel"));
        if (vercelUrl) {
          setDeployment({
            vercel_deployment_url: vercelUrl,
          } as Deployment);
        }
      }
    } catch (err) {
      console.error("Failed to fetch preview data:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-approve countdown
  useEffect(() => {
    if (!approval?.auto_approve_at) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const autoAt = new Date(approval.auto_approve_at!).getTime();
      const diff = autoAt - now;

      if (diff <= 0) {
        setTimeRemaining("Auto-approving...");
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s remaining`);
      } else {
        setTimeRemaining(`${seconds}s remaining`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [approval?.auto_approve_at]);

  async function handleApprove() {
    setSubmitting(true);
    const res = await fetch(`/api/console/approvals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approved", decision_notes: "" }),
    });
    if (res.ok) {
      router.push("/console/approvals");
    }
    setSubmitting(false);
  }

  async function handleRequestChanges() {
    if (!revisionNotes.trim()) return;
    setSubmitting(true);

    const res = await fetch("/api/console/revisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approval_id: id,
        revision_notes: revisionNotes,
      }),
    });

    if (res.ok) {
      router.push("/console/approvals");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!approval) {
    return (
      <EmptyState
        title="Approval not found"
        description="This approval doesn't exist or you don't have access."
        action={
          <Link href="/console/approvals" className="text-orange hover:underline text-sm">
            Back to approvals
          </Link>
        }
      />
    );
  }

  const alreadyDecided = !!approval.decision;
  const previewUrl = deployment?.vercel_deployment_url || null;
  const approvalType = approval.approval_type || "standard";

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/console/approvals" className="hover:text-foreground transition-colors">
          Approvals
        </Link>
        <span>/</span>
        <Link href={`/console/approvals/${id}`} className="hover:text-foreground transition-colors">
          {approval.title}
        </Link>
        <span>/</span>
        <span className="text-foreground">Preview</span>
      </div>

      {/* Chain Progress */}
      {chainSteps.length > 1 && (
        <div className="mb-6 bg-dark rounded-lg border border-dark-border p-4">
          <h3 className="text-xs font-medium text-muted mb-3 uppercase tracking-wide">
            Approval Progress
          </h3>
          <div className="flex items-center gap-2">
            {chainSteps.map((step, i) => {
              const isCompleted = step.decision === "approved";
              const isActive = step.id === id;
              const isDenied = step.decision === "denied";
              const isRevision = step.decision === "revision_requested";

              return (
                <div key={step.id} className="flex items-center gap-2">
                  {i > 0 && (
                    <div className={`w-8 h-px ${isCompleted || isActive ? "bg-orange" : "bg-dark-border"}`} />
                  )}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
                        isCompleted
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : isDenied
                          ? "bg-red-500/20 border-red-500 text-red-400"
                          : isRevision
                          ? "bg-orange/20 border-orange text-orange"
                          : isActive
                          ? "bg-orange/10 border-orange text-orange"
                          : "bg-dark-border border-dark-border text-muted"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isDenied ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        step.step_number || i + 1
                      )}
                    </div>
                    <span className={`text-[10px] max-w-[80px] text-center truncate ${
                      isActive ? "text-foreground" : "text-muted"
                    }`}>
                      {TYPE_LABELS[step.approval_type as ApprovalType] || "Standard"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-semibold text-foreground">
                {approval.title}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                {TYPE_LABELS[approvalType]}
              </span>
            </div>
            {approval.request && (
              <Link
                href={`/console/requests/${approval.request.id}`}
                className="text-muted text-sm hover:text-foreground transition-colors"
              >
                {approval.request.linear_issue_key || approval.request.title} &rarr;
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            {timeRemaining && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400">
                {timeRemaining}
              </span>
            )}
            <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${RISK_COLORS[approval.risk_level]}`}>
              {approval.risk_level} risk
            </span>
          </div>
        </div>

        {/* Preview iframe or link */}
        {previewUrl && (
          <div className="bg-dark rounded-lg border border-dark-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-dark-border">
              <span className="text-xs text-muted">Preview</span>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange hover:underline flex items-center gap-1"
              >
                Open in new tab
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <iframe
              src={previewUrl}
              className="w-full h-[500px] bg-white"
              title="Preview deployment"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        )}

        {/* What changed */}
        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <h2 className="text-foreground font-medium mb-2">What Changed</h2>
          <p className="text-muted-light text-sm whitespace-pre-wrap">
            {approval.summary}
          </p>
        </div>

        {approval.impact && (
          <div className="bg-dark rounded-lg border border-dark-border p-5">
            <h2 className="text-foreground font-medium mb-2">Impact</h2>
            <p className="text-muted-light text-sm whitespace-pre-wrap">
              {approval.impact}
            </p>
          </div>
        )}

        {/* Revision history */}
        {revisions.length > 0 && (
          <div className="bg-dark rounded-lg border border-dark-border p-5">
            <h2 className="text-foreground font-medium mb-3">Revision History</h2>
            <div className="space-y-3">
              {revisions.map((rev) => (
                <div key={rev.id} className="border-l-2 border-orange/30 pl-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      rev.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : rev.status === "in_progress"
                        ? "bg-blue-500/10 text-blue-400"
                        : rev.status === "cancelled"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-yellow-500/10 text-yellow-400"
                    }`}>
                      {rev.status}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(rev.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-light">{rev.revision_notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decision area */}
        {alreadyDecided ? (
          <div className="bg-dark rounded-lg border border-dark-border p-5">
            <h2 className="text-foreground font-medium mb-2">Decision</h2>
            <p className={`text-sm font-medium ${
              approval.decision === "approved" ? "text-emerald-400" :
              approval.decision === "denied" ? "text-red-400" : "text-orange"
            }`}>
              {approval.decision === "revision_requested"
                ? "Revisions Requested"
                : approval.decision === "approved"
                ? "Approved"
                : "Denied"}
            </p>
            {approval.decision_notes && (
              <p className="text-muted-light text-sm mt-2">{approval.decision_notes}</p>
            )}
          </div>
        ) : (
          <div className="bg-dark rounded-lg border border-orange/20 p-5">
            <h2 className="text-foreground font-medium mb-4">Your Decision</h2>

            {showRevisionForm ? (
              <div className="space-y-4">
                <textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  rows={4}
                  placeholder="Describe what changes you'd like..."
                  className="w-full px-3 py-2 bg-background border border-dark-border rounded-lg text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-orange transition-colors resize-y"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleRequestChanges}
                    disabled={!revisionNotes.trim() || submitting}
                    className="bg-orange hover:bg-orange-dark text-dark font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting..." : "Submit Revision Request"}
                  </button>
                  <button
                    onClick={() => {
                      setShowRevisionForm(false);
                      setRevisionNotes("");
                    }}
                    className="text-muted hover:text-foreground text-sm px-4 py-2.5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Approving..." : "Approve"}
                </button>
                <button
                  onClick={() => setShowRevisionForm(true)}
                  className="bg-dark-border text-muted-light hover:text-foreground font-medium text-sm px-6 py-2.5 rounded-lg transition-colors"
                >
                  Request Changes
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
