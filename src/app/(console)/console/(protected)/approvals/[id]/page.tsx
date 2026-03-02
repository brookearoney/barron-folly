"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import EmptyState from "@/components/console/EmptyState";
import { RISK_COLORS } from "@/lib/console/constants";
import type { Approval, ApprovalDecision, Request as RequestType } from "@/lib/console/types";

type ApprovalDetail = Approval & {
  request?: Pick<RequestType, "id" | "title" | "linear_issue_key" | "linear_issue_id">;
};

export default function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [approval, setApproval] = useState<ApprovalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<ApprovalDecision | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/console/approvals/${id}`)
      .then((res) => res.json())
      .then((data) => setApproval(data.approval || null))
      .finally(() => setLoading(false));
  }, [id]);

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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              {approval.title}
            </h1>
            {approval.request && (
              <Link
                href={`/console/requests/${approval.request.id}`}
                className="text-muted text-sm hover:text-foreground transition-colors"
              >
                {approval.request.linear_issue_key || approval.request.title} →
              </Link>
            )}
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${RISK_COLORS[approval.risk_level]}`}>
            {approval.risk_level} risk
          </span>
        </div>

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
            <h2 className="text-foreground font-medium mb-2">Artifacts</h2>
            <a
              href={approval.artifacts_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange hover:underline text-sm"
            >
              View artifacts →
            </a>
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

            <div className="flex gap-3 mb-4">
              {(
                [
                  { value: "approved", label: "Approve", color: "bg-emerald-600 hover:bg-emerald-700" },
                  { value: "revision_requested", label: "Request Revisions", color: "bg-orange hover:bg-orange-dark" },
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
          </div>
        )}
      </div>
    </div>
  );
}
