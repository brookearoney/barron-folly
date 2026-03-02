"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EmptyState from "@/components/console/EmptyState";
import type { Clarification, Request as RequestType } from "@/lib/console/types";

type ClarificationWithRequest = Clarification & {
  request?: Pick<RequestType, "id" | "title" | "linear_issue_key">;
};

export default function InboxPage() {
  const [clarifications, setClarifications] = useState<ClarificationWithRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClarifications();
  }, []);

  async function fetchClarifications() {
    const res = await fetch("/api/console/clarifications");
    const data = await res.json();
    setClarifications(data.clarifications || []);
    setLoading(false);
  }

  async function submitAnswer(id: string) {
    setSubmitting(true);
    const res = await fetch(`/api/console/clarifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: answerText }),
    });

    if (res.ok) {
      setAnswering(null);
      setAnswerText("");
      fetchClarifications();
    }
    setSubmitting(false);
  }

  const pending = clarifications.filter((c) => c.status === "pending");
  const answered = clarifications.filter((c) => c.status !== "pending");

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
        <h1 className="text-2xl font-semibold text-foreground">Inbox</h1>
        <p className="text-muted text-sm mt-1">
          Answer clarification questions from the team
        </p>
      </div>

      {clarifications.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          }
          title="Inbox is clear"
          description="No clarification questions at this time."
        />
      ) : (
        <div className="space-y-6">
          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-foreground font-medium mb-3">
                Needs your response ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((c) => (
                  <div
                    key={c.id}
                    className="bg-dark rounded-lg border border-orange/20 p-5"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted mb-2">
                      {c.request && (
                        <Link
                          href={`/console/requests/${c.request.id}`}
                          className="hover:text-foreground transition-colors"
                        >
                          {c.request.linear_issue_key || c.request.title}
                        </Link>
                      )}
                      <span>&middot;</span>
                      <span>{new Date(c.asked_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-foreground text-sm font-medium mb-3">
                      {c.question}
                    </p>

                    {answering === c.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          rows={3}
                          placeholder="Type your answer..."
                          className="w-full px-3 py-2 bg-background border border-dark-border rounded-lg text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-orange transition-colors resize-y"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitAnswer(c.id)}
                            disabled={!answerText.trim() || submitting}
                            className="bg-orange hover:bg-orange-dark text-dark font-semibold text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {submitting ? "Sending..." : "Send answer"}
                          </button>
                          <button
                            onClick={() => {
                              setAnswering(null);
                              setAnswerText("");
                            }}
                            className="text-muted hover:text-foreground text-xs px-3 py-2 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAnswering(c.id)}
                        className="text-orange hover:underline text-sm"
                      >
                        Answer →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answered */}
          {answered.length > 0 && (
            <div>
              <h2 className="text-muted font-medium mb-3">
                Previously answered ({answered.length})
              </h2>
              <div className="space-y-3">
                {answered.map((c) => (
                  <div
                    key={c.id}
                    className="bg-dark rounded-lg border border-dark-border p-5 opacity-70"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted mb-2">
                      {c.request && (
                        <span>{c.request.linear_issue_key || c.request.title}</span>
                      )}
                    </div>
                    <p className="text-foreground text-sm font-medium mb-1">
                      {c.question}
                    </p>
                    <p className="text-muted-light text-sm">{c.answer}</p>
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
