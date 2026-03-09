"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TIER_CONFIG } from "@/lib/console/constants";
import type { Tier } from "@/lib/console/types";

const TIERS = Object.entries(TIER_CONFIG) as [Tier, typeof TIER_CONFIG[Tier]][];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function NewOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tier, setTier] = useState<Tier>("copper");
  const [autoSlug, setAutoSlug] = useState(true);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [aiStatus, setAiStatus] = useState<"" | "analyzing" | "done" | "error">("");

  function handleNameChange(value: string) {
    setName(value);
    if (autoSlug) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/console/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          tier,
          tier_price: TIER_CONFIG[tier].price.replace(/[^0-9]/g, ""),
          max_concurrent_requests: parseInt(
            form.get("max_concurrent_requests") as string
          ) || TIER_CONFIG[tier].maxConcurrent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create organization");
      }

      const { organization } = await res.json();

      // Trigger AI onboarding if URL provided
      if (websiteUrl.trim()) {
        setAiStatus("analyzing");
        try {
          const aiRes = await fetch(
            `/api/console/admin/organizations/${organization.id}/ai-onboard`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: websiteUrl }),
            }
          );
          if (aiRes.ok) {
            setAiStatus("done");
          } else {
            setAiStatus("error");
          }
        } catch {
          setAiStatus("error");
        }
      }

      router.push(`/console/admin/organizations/${organization.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">
          New Organization
        </h1>
        <p className="text-muted text-sm mt-1">
          Create a new client organization
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm text-muted-light mb-2">
            Organization Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Acme Corp"
            className="w-full px-4 py-3 bg-dark border border-dark-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-orange transition-colors"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm text-muted-light mb-2">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setAutoSlug(false);
            }}
            placeholder="acme-corp"
            className="w-full px-4 py-3 bg-dark border border-dark-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-orange transition-colors"
          />
        </div>

        <div>
          <label htmlFor="website_url" className="block text-sm text-muted-light mb-2">
            Client Website URL
          </label>
          <input
            id="website_url"
            name="website_url"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3 bg-dark border border-dark-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-orange transition-colors"
          />
          <p className="text-muted text-xs mt-1.5">
            If provided, AI will analyze the site to generate a business dossier and style guide.
          </p>
        </div>

        <div>
          <label className="block text-sm text-muted-light mb-3">Tier</label>
          <div className="grid grid-cols-2 gap-3">
            {TIERS.map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTier(key)}
                className={`text-left p-4 rounded-lg border transition-colors ${
                  tier === key
                    ? "border-orange bg-orange/5"
                    : "border-dark-border bg-dark hover:border-dark-border/80"
                }`}
              >
                <p className="text-foreground text-sm font-medium capitalize">{config.label}</p>
                <p className="text-muted text-xs">{config.price} &middot; {config.maxConcurrent} concurrent</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="max_concurrent_requests" className="block text-sm text-muted-light mb-2">
            Max Concurrent Requests
          </label>
          <input
            id="max_concurrent_requests"
            name="max_concurrent_requests"
            type="number"
            min={1}
            defaultValue={TIER_CONFIG[tier].maxConcurrent}
            className="w-full px-4 py-3 bg-dark border border-dark-border rounded-lg text-foreground focus:outline-none focus:border-orange transition-colors"
          />
        </div>

        <div className="border-t border-dark-border pt-6">
          <div className="flex items-start gap-3 p-4 bg-dark rounded-lg border border-dark-border">
            <svg className="w-5 h-5 text-orange flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <p className="text-foreground text-sm font-medium">
                Linear Integration
              </p>
              <p className="text-muted text-xs mt-1">
                A Linear team and project will be created automatically for this
                organization when you save.
              </p>
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-orange hover:bg-orange-dark text-dark font-semibold text-sm px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? aiStatus === "analyzing"
                ? "Analyzing website..."
                : "Creating..."
              : "Create organization"}
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
