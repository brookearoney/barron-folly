"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import EmptyState from "@/components/console/EmptyState";
import { RISK_COLORS } from "@/lib/console/constants";
import type {
  Approval,
  ApprovalDecision,
  ApprovalType,
  Request as RequestType,
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

const TYPE_COLORS: Record<ApprovalType, string> = {
  standard: "bg-blue-500/10 text-blue-400",
  client_preview: "bg-purple-500/10 text-purple-400",
  architecture: "bg-yellow-500/10 text-yellow-400",
  production_deploy: "bg-red-500/10 text-red-400",
  revision: "bg-orange/10 text-orange",
};

export default function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [approval, setApproval] = useState<ApprovalDetail | null>(null);
  const [chainSteps, setChainSteps] = useState<ApprovalDetail[]>([]);
  const [revisions, setRevisions] = useState<RevisionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<ApprovalDecision | "">("");
  const [notes, setNotes] = useState("");
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
      if (a?.request_id && (a.total_steps || 1) > 1) {
        const chainRes = await fetch("/api/console/approvals");
        const chainData = await chainRes.json();
        const allApprovals = (chainData.approvals || []) as ApprovalDetail[];
        const chainFiltered = allApprovals
          .filter((ap: ApprovalDetail) => ap.request_id === a.request_id)
          .sort((x: ApprovalDetail, y: ApprovalDetail) => (x.step_number || 1) - (y.step_number || 1));
        setChainSteps(chainFiltered);
      }
    } catch (err) {
      console.error("Failed to fetch approval:", err);
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

      if (hours > 0) {
        setTimeRemaining(`Auto-approves in ${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`Auto-approves in ${minutes}m`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [approval?.auto_approve_at]);

  async function handleSubmit() {
    if (!decision) return;
    setSubmitting(true);

    const res = await fetch(`/api/console/approvals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, decision_notes: notes }),
    });

    if (res.ok) {
      router.push("/console/approvals");
    }
    setSubmitting(false);
  }

  async function handleRevisionRequest() {
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
  const approvalType = (approval.approval_type || "standard") as ApprovalType;
  const isPartOfChain = chainSteps.length > 1;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/console/approvals" className="hover:text-foreground transition-colors">
          Approvals
        </Link>
        <span>/</span>
        <span className="text-foreground">{approval.title}</span>
      </div>

      <div className="space-y-6">
        {/* Chain progress indicator */}
        {isPartOfChain && (
          <div className="bg-dark rounded-lg border border-dark-border p-4">
            <h3 className="text-xs font-medium text-muted mb-3 uppercase tracking-wide">
              Approval Chain &mdash; Step {approval.step_number} of {approval.total_steps}
            </h3>
            <div className="flex items-center gap-1">
              {chainSteps.map((step, i) => {
                const isCompleted = step.decision === "approved";
                const isCurrent = step.id === id;
                const isDenied = step.decision === "denied";
                const isRevision = step.decision === "revision_requested";

                return (
                  <div key={step.id} className="flex items-center gap-1 flex-1">
                    {i > 0 && (
                      <div className={`flex-1 h-px max-w-8 ${
                        isCompleted ? "bg-emerald-500" : "bg-dark-border"
                      }`} />
                    )}
                    <Link
                      href={`/console/approvals/${step.id}`}
                      className="group flex flex-col items-center gap-1"
                      title={step.title}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium border-2 transition-colors ${
                          isCompleted
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                            : isDenied
                            ? "bg-red-500/20 border-red-500 text-red-400"
                            : isRevision
                            ? "bg-orange/20 border-orange text-orange"
                            : isCurrent
                            ? "bg-orange/10 border-orange text-orange ring-2 ring-orange/20"
                            : "bg-dark-border border-dark-border text-muted group-hover:border-muted"
                        }`}
                      >
                        {isCompleted ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : isDenied ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          step.step_number || i + 1
                        )}
                      </div>
                      <span className={`text-[9px] max-w-[70px] text-center truncate ${
                        isCurrent ? "text-foreground font-medium" : "text-muted"
                      }`}>
                        {TYPE_LABELS[step.approval_type as ApprovalType] || "Standard"}
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Header with type badge */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-semibold text-foreground">
                {approval.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[approvalType]}`}>
                {TYPE_LABELS[approvalType]}
              </span>
              {approval.request && (
                <Link
                  href={`/console/requests/${approval.request.id}`}
                  className="text-muted text-sm hover:text-foreground transition-colors"
                >
                  {approval.request.linear_issue_key || approval.request.title} &rarr;
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {timeRemaining && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 shrink-0">
                {timeRemaining}
              </span>
            )}
            <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${RISK_COLORS[approval.risk_level]}`}>
              {approval.risk_level} risk
            </span>
          </div>
        </div>

        {/* Preview link for client_preview type */}
        {approvalType === "client_preview" && !alreadyDecided && (
          <Link
            href={`/console/approvals/${id}/preview`}
            className="block bg-dark rounded-lg border border-purple-500/20 hover:border-purple-500/40 p-4 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <p className="text-foreground text-sm font-medium">Open Preview Approval</p>
                <p className="text-muted text-xs">Review the deployment preview with an interactive view</p>
              </div>
              <svg className="w-4 h-4 text-muted ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        )}

        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <h2 className="text-foreground font-medium mb-2">Summary</h2>
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

        {approval.artifacts_url && (
          <div className="bg-dark rounded-lg border border-dark-border p-5">
            <h2 className="text-foreground font-medium mb-3">Artifacts</h2>
            <div className="space-y-2">
              {parseArtifactUrls(approval.artifacts_url).map((artifact, i) => (
                <a
                  key={i}
                  href={artifact.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dark-border hover:border-orange/30 transition-colors group"
                >
                  <span className="text-muted group-hover:text-orange transition-colors shrink-0">
                    {artifact.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm font-medium truncate">
                      {artifact.label}
                    </p>
                    <p className="text-muted text-xs truncate">{artifact.domain}{artifact.path}</p>
                  </div>
                  <svg className="w-4 h-4 text-muted group-hover:text-orange transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {approval.rollback_plan && (
          <div className="bg-dark rounded-lg border border-dark-border p-5">
            <h2 className="text-foreground font-medium mb-2">Rollback Plan</h2>
            <p className="text-muted-light text-sm whitespace-pre-wrap">
              {approval.rollback_plan}
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

        {/* Decision */}
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
          <div className="bg-dark rounded-lg border border-dark-border p-5">
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
                    onClick={handleRevisionRequest}
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
              <>
                <div className="flex gap-3 mb-4">
                  {(
                    [
                      { value: "approved", label: "Approve", color: "bg-emerald-600 hover:bg-emerald-700" },
                      { value: "denied", label: "Deny", color: "bg-red-600 hover:bg-red-700" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDecision(opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        decision === opt.value
                          ? `${opt.color} text-white ring-2 ring-offset-2 ring-offset-dark`
                          : "bg-dark-border text-muted-light hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowRevisionForm(true)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-dark-border text-muted-light hover:text-foreground transition-colors"
                  >
                    Request Changes
                  </button>
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes (optional)..."
                  className="w-full px-3 py-2 bg-background border border-dark-border rounded-lg text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-orange transition-colors resize-y mb-4"
                />

                <button
                  onClick={handleSubmit}
                  disabled={!decision || submitting}
                  className="bg-orange hover:bg-orange-dark text-dark font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit decision"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ParsedArtifact {
  url: string;
  label: string;
  domain: string;
  path: string;
  icon: React.ReactNode;
}

function parseArtifactUrls(raw: string): ParsedArtifact[] {
  const urls = raw
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return urls.map((url) => {
    let parsed: URL;
    try {
      parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return { url, label: url, domain: "", path: "", icon: linkIcon() };
    }

    const domain = parsed.hostname;
    const path = parsed.pathname;

    if (domain.includes("github.com")) {
      const prMatch = path.match(/\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
      if (prMatch) {
        return { url: parsed.href, label: `${prMatch[1]}/${prMatch[2]} #${prMatch[3]}`, domain, path, icon: githubIcon() };
      }
      return { url: parsed.href, label: path.replace(/^\//, ""), domain, path, icon: githubIcon() };
    }

    if (domain.includes("vercel.app") || domain.includes("vercel.com")) {
      return { url: parsed.href, label: domain.replace(".vercel.app", ""), domain, path, icon: vercelIcon() };
    }

    if (domain.includes("figma.com")) {
      return { url: parsed.href, label: "Figma design", domain, path, icon: figmaIcon() };
    }

    if (domain.includes("linear.app")) {
      return { url: parsed.href, label: "Linear issue", domain, path, icon: linearIcon() };
    }

    return { url: parsed.href, label: domain + (path !== "/" ? path : ""), domain, path, icon: linkIcon() };
  });
}

function githubIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function vercelIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L24 22H0L12 1z" />
    </svg>
  );
}

function figmaIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 24c2.208 0 4-1.792 4-4v-4H8c-2.208 0-4 1.792-4 4s1.792 4 4 4zm0-20C5.792 4 4 5.792 4 8s1.792 4 4 4h4V4H8zm0 0h4v8H8c-2.208 0-4-1.792-4-4s1.792-4 4-4zm8 0c-2.208 0-4 1.792-4 4s1.792 4 4 4 4-1.792 4-4-1.792-4-4-4zm-4 8h4c2.208 0 4 1.792 4 4s-1.792 4-4 4-4-1.792-4-4v-4z" />
    </svg>
  );
}

function linearIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.633 10.632a9.339 9.339 0 0010.735 10.735l-10.735-10.735zM1.981 13.117a9.38 9.38 0 008.902 8.902L1.981 13.117zM13.368 21.367A9.339 9.339 0 0021.367 13.368L13.368 21.367zM21.898 10.915a9.381 9.381 0 00-8.813-8.813l8.813 8.813zM10.632 2.633L21.367 13.368a9.339 9.339 0 00-10.735-10.735z" />
    </svg>
  );
}

function linkIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}
