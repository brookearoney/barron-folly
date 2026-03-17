"use client";

import { useEffect, useState, useCallback } from "react";
import EmptyState from "@/components/console/EmptyState";
import type { OrgSuggestion } from "@/lib/console/types";

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500/10 text-red-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-green-500/10 text-green-400",
};

const SOURCE_LABELS: Record<string, string> = {
  ai: "AI",
  admin: "Admin",
  system: "System",
  trend: "Trend",
};

const CATEGORY_LABELS: Record<string, string> = {
  web_platform: "Web Platform",
  automation: "Automation",
  design_system: "Design System",
  integration: "Integration",
  internal_tool: "Internal Tools",
  seo: "SEO",
  content: "Content",
  brand: "Brand",
  ai_agent: "AI Agent",
  other: "General",
};

type TabFilter = "active" | "dismissed" | "implemented";

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<OrgSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>("active");
  const [converting, setConverting] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState("");

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await fetch("/api/console/suggestions");
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  async function handleConvert(suggestionId: string) {
    setConverting(suggestionId);
    try {
      const res = await fetch(`/api/console/suggestions/${suggestionId}`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to convert");
      }
      await fetchSuggestions();
    } catch (err) {
      console.error("Convert error:", err);
    } finally {
      setConverting(null);
    }
  }

  async function handleDismiss(suggestionId: string, reason?: string) {
    try {
      const res = await fetch(`/api/console/suggestions/${suggestionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "dismissed",
          dismissed_reason: reason || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to dismiss");
      setDismissing(null);
      setDismissReason("");
      await fetchSuggestions();
    } catch (err) {
      console.error("Dismiss error:", err);
    }
  }

  const activeSuggestions = suggestions.filter((s) => s.status === "active");
  const dismissedSuggestions = suggestions.filter(
    (s) => s.status === "dismissed"
  );
  const implementedSuggestions = suggestions.filter(
    (s) => s.status === "requested" || s.status === "implemented"
  );

  const displayed =
    tab === "active"
      ? activeSuggestions
      : tab === "dismissed"
        ? dismissedSuggestions
        : implementedSuggestions;

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
        <h1 className="text-2xl font-semibold text-foreground">Suggestions</h1>
        <p className="text-muted text-sm mt-1">
          Proactive recommendations for your business
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {(
          [
            { value: "active", label: "Active", count: activeSuggestions.length },
            {
              value: "implemented",
              label: "Requested",
              count: implementedSuggestions.length,
            },
            {
              value: "dismissed",
              label: "Dismissed",
              count: dismissedSuggestions.length,
            },
          ] as { value: TabFilter; label: string; count: number }[]
        ).map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.value
                ? "bg-orange/10 text-orange"
                : "bg-dark text-muted hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 opacity-60">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {suggestions.length === 0 ? (
        <EmptyState
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          }
          title="No suggestions yet"
          description="We'll analyze your usage patterns and generate personalized recommendations."
        />
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          }
          title={`No ${tab} suggestions`}
          description={
            tab === "active"
              ? "All caught up! Check back later for new recommendations."
              : tab === "dismissed"
                ? "No dismissed suggestions."
                : "No suggestions have been requested yet."
          }
        />
      ) : (
        <div className="space-y-4">
          {displayed.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              isConverting={converting === suggestion.id}
              isDismissing={dismissing === suggestion.id}
              dismissReason={dismissing === suggestion.id ? dismissReason : ""}
              onConvert={() => handleConvert(suggestion.id)}
              onDismissStart={() => {
                setDismissing(suggestion.id);
                setDismissReason("");
              }}
              onDismissCancel={() => {
                setDismissing(null);
                setDismissReason("");
              }}
              onDismissConfirm={() =>
                handleDismiss(suggestion.id, dismissReason)
              }
              onDismissReasonChange={setDismissReason}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestionCard({
  suggestion,
  isConverting,
  isDismissing,
  dismissReason,
  onConvert,
  onDismissStart,
  onDismissCancel,
  onDismissConfirm,
  onDismissReasonChange,
}: {
  suggestion: OrgSuggestion;
  isConverting: boolean;
  isDismissing: boolean;
  dismissReason: string;
  onConvert: () => void;
  onDismissStart: () => void;
  onDismissCancel: () => void;
  onDismissConfirm: () => void;
  onDismissReasonChange: (reason: string) => void;
}) {
  const isActive = suggestion.status === "active";

  return (
    <div
      className={`bg-dark rounded-lg border p-5 transition-colors ${
        isActive
          ? "border-dark-border hover:border-orange/30"
          : "border-dark-border opacity-70"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              PRIORITY_COLORS[suggestion.priority] || PRIORITY_COLORS.medium
            }`}
          >
            {suggestion.priority}
          </span>
          {suggestion.category && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
              {CATEGORY_LABELS[suggestion.category] || suggestion.category}
            </span>
          )}
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dark-border text-muted">
            {SOURCE_LABELS[suggestion.source] || suggestion.source}
          </span>
          {suggestion.confidence > 0 && (
            <span className="text-[10px] text-muted">
              {Math.round(suggestion.confidence * 100)}% confidence
            </span>
          )}
        </div>
        <span className="text-xs text-muted whitespace-nowrap">
          {formatRelativeTime(suggestion.created_at)}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-foreground font-medium text-sm mb-2">
        {suggestion.title}
      </h3>

      {/* Description */}
      <p className="text-muted text-sm mb-3">{suggestion.description}</p>

      {/* Rationale */}
      {suggestion.rationale && (
        <div className="bg-background/50 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs text-muted">
            <span className="text-foreground/70 font-medium">Why: </span>
            {suggestion.rationale}
          </p>
        </div>
      )}

      {/* Effort + Tags */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {suggestion.estimated_effort && (
          <span className="text-xs text-muted">
            Est. effort:{" "}
            <span className="text-foreground/80">
              {suggestion.estimated_effort}
            </span>
          </span>
        )}
        {suggestion.tags &&
          suggestion.tags.length > 0 &&
          suggestion.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-dark-border text-muted"
            >
              {tag}
            </span>
          ))}
      </div>

      {/* Dismiss reason display */}
      {suggestion.status === "dismissed" && suggestion.dismissed_reason && (
        <p className="text-xs text-muted mb-3 italic">
          Dismissed: {suggestion.dismissed_reason}
        </p>
      )}

      {/* Actions (only for active) */}
      {isActive && !isDismissing && (
        <div className="flex items-center gap-2 pt-2 border-t border-dark-border">
          <button
            onClick={onConvert}
            disabled={isConverting}
            className="bg-orange/10 text-orange text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-orange/20 transition-colors disabled:opacity-50"
          >
            {isConverting ? "Requesting..." : "Request This"}
          </button>
          <button
            onClick={onDismissStart}
            className="text-muted text-xs px-3 py-1.5 rounded-lg hover:bg-dark-border/50 hover:text-foreground transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dismiss with reason */}
      {isActive && isDismissing && (
        <div className="pt-2 border-t border-dark-border space-y-2">
          <input
            type="text"
            placeholder="Reason for dismissing (optional)"
            value={dismissReason}
            onChange={(e) => onDismissReasonChange(e.target.value)}
            className="w-full bg-background border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg placeholder:text-muted/50 focus:outline-none focus:border-orange/40"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={onDismissConfirm}
              className="bg-red-500/10 text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              Confirm Dismiss
            </button>
            <button
              onClick={onDismissCancel}
              className="text-muted text-xs px-3 py-1.5 rounded-lg hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Status for non-active */}
      {suggestion.status === "requested" && (
        <div className="pt-2 border-t border-dark-border">
          <span className="text-xs text-emerald-400">
            Converted to request
          </span>
        </div>
      )}
      {suggestion.status === "implemented" && (
        <div className="pt-2 border-t border-dark-border">
          <span className="text-xs text-green-400">Implemented</span>
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
