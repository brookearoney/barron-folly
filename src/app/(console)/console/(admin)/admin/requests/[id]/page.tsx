"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/console/StatusBadge";
import PriorityBadge from "@/components/console/PriorityBadge";
import AiPhaseBadge from "@/components/console/AiPhaseBadge";
import EmptyState from "@/components/console/EmptyState";
import { CATEGORY_LABELS, RISK_COLORS } from "@/lib/console/constants";
import type {
  Request,
  RequestAttachment,
  Clarification,
  Approval,
  ActivityLog,
  AiClarificationData,
  Organization,
  Tier,
} from "@/lib/console/types";

interface RequestDetail {
  request: Request & {
    organization?: Pick<Organization, "id" | "name" | "slug" | "tier">;
  };
  attachments: RequestAttachment[];
  clarifications: Clarification[];
  approvals: Approval[];
  activity: (ActivityLog & { profile?: { full_name: string; email: string } })[];
}

const TIER_COLORS: Record<Tier, string> = {
  copper: "text-amber-600",
  steel: "text-[#9E9E98]",
  titanium: "text-cyan-400",
  tungsten: "text-orange",
};

const ACTION_LABELS: Record<string, string> = {
  request_created: "Request submitted",
  status_changed: "Status updated",
  clarification_asked: "Clarification requested",
  clarification_answered: "Clarification answered",
  approval_created: "Approval requested",
  approval_decided: "Approval decision made",
  comment_added: "Comment added",
};

export default function AdminRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/console/admin/requests/${id}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.request) {
    return (
      <EmptyState
        title="Request not found"
        description="This request doesn't exist or has been removed."
        action={
          <Link href="/console/admin/requests" className="text-orange hover:underline text-sm">
            Back to requests
          </Link>
        }
      />
    );
  }

  const { request: req, attachments, clarifications, approvals, activity } = data;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/console/admin/requests" className="hover:text-foreground transition-colors">
          All Requests
        </Link>
        <span>/</span>
        <span className="text-foreground">{req.linear_issue_key || `#${req.request_number}`}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              {req.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={req.status} />
              <PriorityBadge priority={req.priority} />
              {req.ai_phase && req.ai_phase !== "none" && (
                <AiPhaseBadge phase={req.ai_phase} />
              )}
              <span className="text-muted text-sm">
                {CATEGORY_LABELS[req.category]}
              </span>
              {req.organization && (
                <Link
                  href={`/console/admin/organizations/${req.organization.id}`}
                  className={`text-sm font-medium hover:underline ${
                    TIER_COLORS[(req.organization.tier as Tier)] || "text-muted"
                  }`}
                >
                  {req.organization.name}
                </Link>
              )}
            </div>
          </div>
          {req.linear_issue_url && (
            <a
              href={req.linear_issue_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-foreground text-sm flex items-center gap-1 shrink-0"
            >
              View in Linear
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-dark rounded-lg border border-dark-border p-5">
            <h2 className="text-foreground font-medium mb-3">Description</h2>
            <div className="text-muted-light text-sm whitespace-pre-wrap leading-relaxed">
              {req.description}
            </div>
          </div>

          {/* AI Clarification Q&A */}
          {req.ai_clarification_data && (
            (() => {
              const aiData = req.ai_clarification_data as AiClarificationData;
              return (
                <div className="bg-dark rounded-lg border border-dark-border p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-foreground font-medium">AI Clarification</h2>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        aiData.complexity === "simple"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : aiData.complexity === "moderate"
                          ? "bg-orange/10 text-orange"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        {aiData.complexity}
                      </span>
                      <span className="text-muted text-xs">
                        ~{aiData.estimated_tasks} tasks
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-light text-sm mb-4">
                    {aiData.request_summary}
                  </p>
                  <div className="space-y-3">
                    {aiData.questions.map((q, i) => (
                      <div key={q.id} className="border-l-2 border-orange/30 pl-4">
                        <p className="text-foreground text-sm font-medium">
                          Q{i + 1}: {q.question}
                        </p>
                        {q.answer ? (
                          <p className="text-muted-light text-sm mt-1">
                            A: {q.answer}
                          </p>
                        ) : (
                          <p className="text-muted text-sm mt-1 italic">
                            Not answered yet
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {aiData.answered_at && (
                    <p className="text-muted text-xs mt-3">
                      Answered {new Date(aiData.answered_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })()
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="bg-dark rounded-lg border border-dark-border p-5">
              <h2 className="text-foreground font-medium mb-3">Attachments</h2>
              <div className="space-y-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 text-sm text-muted-light"
                  >
                    <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span>{att.file_name}</span>
                    <span className="text-muted text-xs">
                      {(att.file_size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clarifications */}
          {clarifications.length > 0 && (
            <div className="bg-dark rounded-lg border border-dark-border p-5">
              <h2 className="text-foreground font-medium mb-3">Clarifications</h2>
              <div className="space-y-4">
                {clarifications.map((c) => (
                  <div key={c.id} className="border-l-2 border-dark-border pl-4">
                    <p className="text-foreground text-sm font-medium mb-1">
                      Q: {c.question}
                    </p>
                    {c.answer ? (
                      <p className="text-muted-light text-sm">A: {c.answer}</p>
                    ) : (
                      <p className="text-muted text-sm italic">Awaiting answer</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approvals */}
          {approvals.length > 0 && (
            <div className="bg-dark rounded-lg border border-dark-border p-5">
              <h2 className="text-foreground font-medium mb-3">Approvals</h2>
              <div className="space-y-3">
                {approvals.map((a) => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground text-sm font-medium">
                        {a.title}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${RISK_COLORS[a.risk_level]}`}>
                        {a.risk_level} risk
                      </span>
                    </div>
                    {a.decision ? (
                      <span className={`text-sm font-medium ${
                        a.decision === "approved" ? "text-emerald-400" :
                        a.decision === "denied" ? "text-red-400" : "text-orange"
                      }`}>
                        {a.decision === "revision_requested" ? "Revision requested" : a.decision}
                      </span>
                    ) : (
                      <span className="text-muted text-sm italic">Pending</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline sidebar */}
        <div>
          <div className="bg-dark rounded-lg border border-dark-border p-5">
            <h2 className="text-foreground font-medium mb-4">Activity</h2>
            {activity.length === 0 ? (
              <p className="text-muted text-sm">No activity yet.</p>
            ) : (
              <div className="space-y-4">
                {activity.map((entry) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-dark-border mt-2 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-foreground text-sm">
                        {ACTION_LABELS[entry.action] || entry.action}
                      </p>
                      {entry.details && typeof entry.details === "object" && (
                        <>
                          {(entry.details as Record<string, unknown>).from && (
                            <p className="text-muted text-xs">
                              {String((entry.details as Record<string, unknown>).from)} &rarr; {String((entry.details as Record<string, unknown>).to)}
                            </p>
                          )}
                        </>
                      )}
                      <p className="text-muted text-xs mt-0.5">
                        {entry.profile?.full_name || "System"} &middot;{" "}
                        {new Date(entry.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
