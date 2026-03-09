"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { OrgSuggestion } from "@/lib/console/types";

const CATEGORY_ICONS: Record<string, string> = {
  infrastructure: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
  feature: "M13 10V3L4 14h7v7l9-11h-7z",
  integration: "M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M10 11V3m4 8V3M7 7h10",
  debt: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  security: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
};

export default function SuggestionsSection() {
  const [suggestions, setSuggestions] = useState<OrgSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/console/suggestions")
      .then((res) => res.json())
      .then((data) => setSuggestions(data.suggestions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDismiss(id: string) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/console/suggestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dismissed" }),
    });
  }

  if (loading) return null;
  if (suggestions.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-orange"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h2 className="text-foreground font-medium">Recommended for you</h2>
        </div>
        <span className="text-muted text-xs">AI-generated</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((s) => (
          <div
            key={s.id}
            className="bg-dark rounded-lg border border-dark-border p-4 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-orange"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d={
                        CATEGORY_ICONS[s.category || "feature"] ||
                        CATEGORY_ICONS.feature
                      }
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">
                    {s.title}
                  </p>
                  <p className="text-muted text-xs mt-1 line-clamp-2">
                    {s.description}
                  </p>
                  {s.estimated_effort && (
                    <span className="text-muted text-xs mt-1.5 inline-block">
                      Est. {s.estimated_effort}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDismiss(s.id)}
                className="text-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-all shrink-0"
                title="Dismiss"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-dark-border">
              <Link
                href={`/console/requests/new?title=${encodeURIComponent(s.title)}&description=${encodeURIComponent(s.description || "")}&category=${encodeURIComponent(s.category || "other")}`}
                className="text-orange text-xs font-medium hover:underline"
              >
                Request this →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
