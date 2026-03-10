"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import EmptyState from "@/components/console/EmptyState";
import { NOTIFICATION_LABELS, NOTIFICATION_COLORS } from "@/lib/console/constants";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import type {
  Notification,
  NotificationType,
  Clarification,
  Request as RequestType,
} from "@/lib/console/types";

type ClarificationWithRequest = Clarification & {
  request?: Pick<RequestType, "id" | "title" | "linear_issue_key">;
};

type FilterTab = "all" | "action_required" | "updates" | "read";

export default function InboxPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clarifications, setClarifications] = useState<ClarificationWithRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [answering, setAnswering] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orgId, setOrgId] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [notifRes, clarifRes] = await Promise.all([
        fetch("/api/console/notifications"),
        fetch("/api/console/clarifications"),
      ]);
      const [notifData, clarifData] = await Promise.all([
        notifRes.json(),
        clarifRes.json(),
      ]);
      setNotifications(notifData.notifications || []);
      setClarifications(clarifData.clarifications || []);

      // Extract org ID from first notification for realtime
      if (notifData.notifications?.[0]?.organization_id) {
        setOrgId(notifData.notifications[0].organization_id);
      } else if (clarifData.clarifications?.[0]?.organization_id) {
        setOrgId(clarifData.clarifications[0].organization_id);
      }
    } catch (err) {
      console.error("Failed to fetch inbox:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Subscribe to realtime updates
  useRealtimeNotifications({
    organizationId: orgId,
    onNotification: fetchAll,
    onClarification: fetchAll,
  });

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
      fetchAll();
    }
    setSubmitting(false);
  }

  async function markAsRead(id: string) {
    await fetch(`/api/console/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n))
    );
  }

  async function markAllRead() {
    await fetch("/api/console/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all_read: true }),
    });
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, read_at: n.read_at || new Date().toISOString() }))
    );
  }

  // Pending clarifications: threads with any unanswered question (root or reply)
  const pendingClarifications = clarifications.filter((c) => {
    if (c.status === "pending") return true;
    if (c.replies?.some((r) => r.status === "pending")) return true;
    return false;
  });

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((n) => {
    switch (activeTab) {
      case "action_required":
        return !n.read && (n.type === "clarification" || n.type === "approval");
      case "updates":
        return n.type === "status_change" || n.type === "comment" || n.type === "completion";
      case "read":
        return n.read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const TABS: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "All" },
    { key: "action_required", label: "Needs Response", count: pendingClarifications.length },
    { key: "updates", label: "Updates" },
    { key: "read", label: "Read" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Inbox</h1>
          <p className="text-muted text-sm mt-1">
            Notifications, clarifications, and updates
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-muted hover:text-foreground text-sm transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-dark-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-orange text-orange"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 bg-orange text-dark text-xs font-bold px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Action Required: Pending clarifications */}
      {(activeTab === "all" || activeTab === "action_required") && pendingClarifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-foreground font-medium mb-3">
            Needs your response ({pendingClarifications.length})
          </h2>
          <div className="space-y-3">
            {pendingClarifications.map((c) => {
              // Collect all Q&A items in this thread
              const threadItems: { id: string; question: string; answer: string | null; status: string; asked_at: string }[] = [
                { id: c.id, question: c.question, answer: c.answer, status: c.status, asked_at: c.asked_at },
                ...(c.replies || []).map((r) => ({
                  id: r.id, question: r.question, answer: r.answer, status: r.status, asked_at: r.asked_at,
                })),
              ];

              // Find the latest pending item to answer
              const pendingItem = threadItems.find((t) => t.status === "pending");

              return (
                <div
                  key={c.id}
                  className="bg-dark rounded-lg border border-orange/20 p-5"
                >
                  <div className="flex items-center gap-2 text-xs text-muted mb-3">
                    <span className={NOTIFICATION_COLORS.clarification}>
                      {NOTIFICATION_LABELS.clarification}
                    </span>
                    {c.request && (
                      <>
                        <span>&middot;</span>
                        <Link
                          href={`/console/requests/${c.request.id}`}
                          className="hover:text-foreground transition-colors"
                        >
                          {c.request.linear_issue_key || c.request.title}
                        </Link>
                      </>
                    )}
                    {threadItems.length > 1 && (
                      <>
                        <span>&middot;</span>
                        <span>{threadItems.length} messages</span>
                      </>
                    )}
                  </div>

                  {/* Thread history (answered items) */}
                  {threadItems.filter((t) => t.answer).length > 0 && (
                    <div className="space-y-2 mb-3 pl-3 border-l-2 border-dark-border">
                      {threadItems.filter((t) => t.answer).map((t) => (
                        <div key={t.id} className="text-sm">
                          <p className="text-muted-light font-medium">{t.question}</p>
                          <p className="text-muted">{t.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Current pending question */}
                  {pendingItem && (
                    <>
                      <p className="text-foreground text-sm font-medium mb-3">
                        {pendingItem.question}
                      </p>

                      {answering === pendingItem.id ? (
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
                              onClick={() => submitAnswer(pendingItem.id)}
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
                          onClick={() => setAnswering(pendingItem.id)}
                          className="text-orange hover:underline text-sm"
                        >
                          Answer &rarr;
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notifications feed */}
      {filteredNotifications.length === 0 && pendingClarifications.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          }
          title="Inbox is clear"
          description={
            activeTab === "all"
              ? "No notifications at this time."
              : `No ${activeTab === "action_required" ? "action items" : activeTab === "updates" ? "updates" : "read notifications"}.`
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredNotifications.length > 0 && (
            <>
              {(activeTab === "all" || activeTab === "action_required") && pendingClarifications.length > 0 && (
                <h2 className="text-muted font-medium mb-3 mt-2">Other notifications</h2>
              )}
              {filteredNotifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={markAsRead}
                />
              ))}
            </>
          )}

          {/* Previously answered clarifications */}
          {activeTab === "all" && (
            (() => {
              const answered = clarifications.filter((c) => c.status !== "pending");
              if (answered.length === 0) return null;
              return (
                <div className="mt-6">
                  <h2 className="text-muted font-medium mb-3">
                    Previously answered ({answered.length})
                  </h2>
                  <div className="space-y-2">
                    {answered.map((c) => (
                      <div
                        key={c.id}
                        className="bg-dark rounded-lg border border-dark-border p-4 opacity-70"
                      >
                        <div className="flex items-center gap-2 text-xs text-muted mb-1">
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
              );
            })()
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification: n,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  const typeColor = NOTIFICATION_COLORS[n.type as NotificationType] || "text-muted";
  const typeLabel = NOTIFICATION_LABELS[n.type as NotificationType] || n.type;

  const linkHref =
    n.type === "approval" && n.reference_id
      ? `/console/approvals/${n.reference_id}`
      : n.type === "clarification"
      ? "/console/inbox"
      : n.request_id
      ? `/console/requests/${n.request_id}`
      : null;

  const content = (
    <div
      className={`bg-dark rounded-lg border p-4 transition-colors ${
        n.read
          ? "border-dark-border opacity-60"
          : "border-dark-border hover:border-orange/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs mb-1">
            <span className={typeColor}>{typeLabel}</span>
            {n.request?.linear_issue_key && (
              <>
                <span className="text-muted">&middot;</span>
                <span className="text-muted">{n.request.linear_issue_key}</span>
              </>
            )}
            <span className="text-muted">&middot;</span>
            <span className="text-muted">
              {formatRelativeTime(n.created_at)}
            </span>
          </div>
          <p className={`text-sm ${n.read ? "text-muted-light" : "text-foreground font-medium"}`}>
            {n.title}
          </p>
          {n.body && (
            <p className="text-muted text-sm mt-1 line-clamp-2">{n.body}</p>
          )}
        </div>
        {!n.read && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMarkRead(n.id);
            }}
            className="shrink-0 w-2.5 h-2.5 rounded-full bg-orange mt-1.5"
            title="Mark as read"
          />
        )}
      </div>
    </div>
  );

  if (linkHref) {
    return <Link href={linkHref}>{content}</Link>;
  }
  return content;
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
