"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_LABELS } from "@/lib/console/constants";
import type { RequestCategory, RequestPriority } from "@/lib/console/types";

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [RequestCategory, string][];
const PRIORITIES: { value: RequestPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const body = {
      title: form.get("title"),
      description: form.get("description"),
      category: form.get("category"),
      priority: form.get("priority"),
    };

    try {
      const res = await fetch("/api/console/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create request");
      }

      const { request } = await res.json();
      router.push(`/console/requests/${request.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">New Request</h1>
        <p className="text-muted text-sm mt-1">
          Describe what you need and we&apos;ll get started.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm text-muted-light mb-2">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="e.g. Redesign landing page hero section"
            className="w-full px-4 py-3 bg-dark border border-dark-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-orange transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm text-muted-light mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              required
              className="w-full px-4 py-3 bg-dark border border-dark-border rounded-lg text-foreground focus:outline-none focus:border-orange transition-colors"
            >
              <option value="">Select...</option>
              {CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm text-muted-light mb-2">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              className="w-full px-4 py-3 bg-dark border border-dark-border rounded-lg text-foreground focus:outline-none focus:border-orange transition-colors"
            >
              {PRIORITIES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm text-muted-light mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={8}
            placeholder="Describe what you need in detail. Include goals, context, references, and any constraints..."
            className="w-full px-4 py-3 bg-dark border border-dark-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-orange transition-colors resize-y"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-orange hover:bg-orange-dark text-dark font-semibold text-sm px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit request"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-muted hover:text-foreground text-sm py-3 px-4 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
