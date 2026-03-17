"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TIER_CONFIG, STATUS_LABELS, STATUS_COLORS, AI_ONBOARDING_LABELS, AI_ONBOARDING_COLORS } from "@/lib/console/constants";
import type { Organization, Profile, Request as Req, Tier } from "@/lib/console/types";

const TIERS = Object.entries(TIER_CONFIG) as [Tier, typeof TIER_CONFIG[Tier]][];

interface OrgDetail {
  organization: Organization;
  members: Profile[];
  requests: Req[];
}

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [showDossier, setShowDossier] = useState(false);
  const [showStyleGuide, setShowStyleGuide] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; title: string; description: string; category: string; estimated_effort: string; status: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetch(`/api/console/admin/organizations/${id}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch(`/api/console/admin/organizations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        slug: form.get("slug"),
        tier: form.get("tier"),
        max_concurrent_requests: parseInt(form.get("max_concurrent_requests") as string),
      }),
    });

    if (res.ok) {
      const { organization } = await res.json();
      setData((prev) => prev ? { ...prev, organization } : prev);
    }
    setSaving(false);
  }

  async function handleAiOnboard() {
    const url = prompt("Enter client website URL:");
    if (!url) return;
    setAiLoading(true);
    setAiError("");

    try {
      const res = await fetch(`/api/console/admin/organizations/${id}/ai-onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "AI analysis failed");
      }

      // Refresh data
      const refreshRes = await fetch(`/api/console/admin/organizations/${id}`);
      const refreshData = await refreshRes.json();
      setData(refreshData);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleGenerateSuggestions() {
    setSuggestionsLoading(true);
    try {
      const res = await fetch(`/api/console/admin/organizations/${id}/suggestions`, {
        method: "POST",
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to generate suggestions");
      }
      const { suggestions: newSuggestions } = await res.json();
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to generate suggestions");
    } finally {
      setSuggestionsLoading(false);
    }
  }

  async function loadSuggestions() {
    const res = await fetch(`/api/console/admin/organizations/${id}/suggestions`);
    if (res.ok) {
      const { suggestions: existing } = await res.json();
      setSuggestions(existing);
    }
  }

  useEffect(() => {
    if (data?.organization?.business_dossier) {
      loadSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.organization?.business_dossier]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMsg("");

    const res = await fetch("/api/console/admin/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        organization_id: id,
      }),
    });

    const result = await res.json();
    if (res.ok) {
      setInviteMsg(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
      // Refresh data
      const refreshRes = await fetch(`/api/console/admin/organizations/${id}`);
      const refreshData = await refreshRes.json();
      setData(refreshData);
    } else {
      setInviteMsg(result.error || "Failed to invite");
    }
    setInviting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.organization) {
    return (
      <div className="text-center py-20">
        <p className="text-foreground font-medium">Organization not found</p>
        <Link href="/console/admin/organizations" className="text-orange text-sm hover:underline mt-2 inline-block">
          Back to organizations
        </Link>
      </div>
    );
  }

  const { organization: org, members, requests } = data;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/console/admin/organizations" className="hover:text-foreground transition-colors">
          Organizations
        </Link>
        <span>/</span>
        <span className="text-foreground">{org.name}</span>
      </div>

      <div className="space-y-8">
        {/* Quick links */}
        <div className="flex gap-3">
          <Link
            href={`/console/admin/organizations/${id}/policies`}
            className="bg-dark hover:bg-dark-border text-foreground text-sm px-4 py-2.5 rounded-lg border border-dark-border transition-colors"
          >
            Edit Policy & Risk Rules
          </Link>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="bg-dark rounded-lg border border-dark-border p-6 space-y-5">
          <h2 className="text-foreground font-medium">Organization Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-light mb-1.5">Name</label>
              <input name="name" defaultValue={org.name} required className="w-full px-3 py-2.5 bg-background border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors" />
            </div>
            <div>
              <label className="block text-sm text-muted-light mb-1.5">Slug</label>
              <input name="slug" defaultValue={org.slug} required className="w-full px-3 py-2.5 bg-background border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-light mb-1.5">Tier</label>
              <select name="tier" defaultValue={org.tier} className="w-full px-3 py-2.5 bg-background border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors">
                {TIERS.map(([key, config]) => (
                  <option key={key} value={key}>{config.label} ({config.price})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-light mb-1.5">Max Concurrent</label>
              <input name="max_concurrent_requests" type="number" min={1} defaultValue={org.max_concurrent_requests} className="w-full px-3 py-2.5 bg-background border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-light mb-1.5">Linear Team</label>
              {org.linear_team_id ? (
                <p className="px-3 py-2.5 bg-background border border-dark-border rounded-lg text-foreground text-sm font-mono truncate">
                  {org.linear_team_id}
                </p>
              ) : (
                <p className="px-3 py-2.5 text-muted text-sm italic">Not linked</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-muted-light mb-1.5">Linear Project</label>
              {org.linear_project_id ? (
                <p className="px-3 py-2.5 bg-background border border-dark-border rounded-lg text-foreground text-sm font-mono truncate">
                  {org.linear_project_id}
                </p>
              ) : (
                <p className="px-3 py-2.5 text-muted text-sm italic">Not linked</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-orange hover:bg-orange-dark text-dark font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>

        {/* AI Intelligence */}
        <div className="bg-dark rounded-lg border border-dark-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground font-medium">AI Intelligence</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full ${AI_ONBOARDING_COLORS[org.ai_onboarding_status]}`}>
              {AI_ONBOARDING_LABELS[org.ai_onboarding_status]}
            </span>
          </div>

          {org.website_url && (
            <p className="text-muted text-sm">
              Source: <span className="text-foreground">{org.website_url}</span>
            </p>
          )}

          {org.ai_onboarding_status !== "completed" && (
            <div>
              <button
                onClick={handleAiOnboard}
                disabled={aiLoading}
                className="bg-orange hover:bg-orange-dark text-dark font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {aiLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                    Analyzing website...
                  </span>
                ) : org.ai_onboarding_status === "failed" ? (
                  "Retry AI Analysis"
                ) : (
                  "Run AI Analysis"
                )}
              </button>
              {aiError && <p className="text-red-400 text-xs mt-2">{aiError}</p>}
            </div>
          )}

          {org.business_dossier && (
            <div>
              <button
                onClick={() => setShowDossier(!showDossier)}
                className="text-sm text-orange hover:underline"
              >
                {showDossier ? "Hide" : "Show"} Business Dossier
              </button>
              {showDossier && (
                <div className="mt-3 space-y-3 bg-background rounded-lg p-4 border border-dark-border">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted">Industry:</span>{" "}
                      <span className="text-foreground">{org.business_dossier.industry}</span>
                    </div>
                    <div>
                      <span className="text-muted">Model:</span>{" "}
                      <span className="text-foreground">{org.business_dossier.business_model}</span>
                    </div>
                    <div>
                      <span className="text-muted">Size:</span>{" "}
                      <span className="text-foreground">{org.business_dossier.company_size}</span>
                    </div>
                    <div>
                      <span className="text-muted">Tagline:</span>{" "}
                      <span className="text-foreground">{org.business_dossier.tagline}</span>
                    </div>
                  </div>
                  {org.business_dossier.tech_stack.length > 0 && (
                    <div>
                      <p className="text-muted text-xs mb-1">Tech Stack</p>
                      <div className="flex flex-wrap gap-1.5">
                        {org.business_dossier.tech_stack.map((t) => (
                          <span key={t} className="bg-dark-border text-foreground text-xs px-2 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {org.business_dossier.likely_software_needs.length > 0 && (
                    <div>
                      <p className="text-muted text-xs mb-1">Likely Software Needs</p>
                      <ul className="text-foreground text-sm space-y-1">
                        {org.business_dossier.likely_software_needs.map((n, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-orange mt-0.5">-</span> {n}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p className="text-muted text-xs mb-1">Full Dossier</p>
                    <p className="text-foreground text-sm whitespace-pre-wrap">{org.business_dossier.dossier}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {org.style_guide && (
            <div>
              <button
                onClick={() => setShowStyleGuide(!showStyleGuide)}
                className="text-sm text-orange hover:underline"
              >
                {showStyleGuide ? "Hide" : "Show"} Style Guide
              </button>
              {showStyleGuide && (
                <div className="mt-3 space-y-3 bg-background rounded-lg p-4 border border-dark-border">
                  <div>
                    <p className="text-muted text-xs mb-1.5">Colors</p>
                    <div className="flex gap-2">
                      {Object.entries(org.style_guide.colors)
                        .filter(([k]) => k !== "notes")
                        .map(([key, val]) => (
                          <div key={key} className="text-center">
                            <div
                              className="w-8 h-8 rounded border border-dark-border"
                              style={{ backgroundColor: val.startsWith("#") ? val : undefined }}
                            />
                            <p className="text-muted text-[10px] mt-1 capitalize">{key}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted">Heading Font:</span>{" "}
                      <span className="text-foreground">{org.style_guide.typography.heading_font}</span>
                    </div>
                    <div>
                      <span className="text-muted">Body Font:</span>{" "}
                      <span className="text-foreground">{org.style_guide.typography.body_font}</span>
                    </div>
                    <div>
                      <span className="text-muted">Tone:</span>{" "}
                      <span className="text-foreground">{org.style_guide.brand_voice.tone}</span>
                    </div>
                    <div>
                      <span className="text-muted">Layout:</span>{" "}
                      <span className="text-foreground">{org.style_guide.ui_patterns.layout}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted text-xs mb-1">Design Directive</p>
                    <p className="text-foreground text-sm whitespace-pre-wrap">{org.style_guide.design_directive}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {org.memory_log && org.memory_log.length > 0 && (
            <div>
              <button
                onClick={() => setShowMemory(!showMemory)}
                className="text-sm text-orange hover:underline"
              >
                {showMemory ? "Hide" : "Show"} Memory Log ({org.memory_log.length} sessions)
              </button>
              {showMemory && (
                <div className="mt-3 space-y-2">
                  {org.memory_log.slice(-10).reverse().map((entry, i) => (
                    <div key={i} className="bg-background rounded-lg p-3 border border-dark-border">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-foreground text-sm font-medium">{entry.request_title}</p>
                        <p className="text-muted text-xs">{new Date(entry.timestamp).toLocaleDateString()}</p>
                      </div>
                      <p className="text-muted-light text-xs">{entry.summary}</p>
                      {entry.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {entry.tags.map((tag) => (
                            <span key={tag} className="bg-dark-border text-muted-light text-[10px] px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {org.business_dossier && (
            <div className="border-t border-dark-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-foreground text-sm font-medium">
                  AI Suggestions {suggestions.length > 0 && `(${suggestions.length})`}
                </h3>
                <button
                  onClick={handleGenerateSuggestions}
                  disabled={suggestionsLoading}
                  className="text-xs text-orange hover:underline disabled:opacity-50"
                >
                  {suggestionsLoading ? "Generating..." : "Generate suggestions"}
                </button>
              </div>
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  {suggestions.slice(0, showSuggestions ? undefined : 3).map((s) => (
                    <div key={s.id} className="bg-background rounded-lg p-3 border border-dark-border">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-foreground text-sm font-medium">{s.title}</p>
                        <span className="text-muted text-[10px] uppercase bg-dark-border px-1.5 py-0.5 rounded">
                          {s.category}
                        </span>
                      </div>
                      <p className="text-muted-light text-xs line-clamp-2">{s.description}</p>
                      {s.estimated_effort && (
                        <p className="text-muted text-[10px] mt-1">Est. {s.estimated_effort}</p>
                      )}
                    </div>
                  ))}
                  {suggestions.length > 3 && (
                    <button
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      className="text-xs text-orange hover:underline"
                    >
                      {showSuggestions ? "Show less" : `Show all ${suggestions.length} suggestions`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Members */}
        <div className="bg-dark rounded-lg border border-dark-border">
          <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between">
            <h2 className="text-foreground font-medium">Members ({members.length})</h2>
          </div>

          {/* Invite */}
          <form onSubmit={handleInvite} className="px-5 py-3 border-b border-dark-border flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Invite by email..."
              className="flex-1 px-3 py-2 bg-background border border-dark-border rounded-lg text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-orange transition-colors"
            />
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="bg-orange hover:bg-orange-dark text-dark font-semibold text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {inviting ? "..." : "Invite"}
            </button>
          </form>

          {inviteMsg && (
            <p className={`px-5 py-2 text-xs ${inviteMsg.startsWith("Invite sent") ? "text-emerald-400" : "text-red-400"}`}>
              {inviteMsg}
            </p>
          )}

          {members.length === 0 ? (
            <p className="text-muted text-sm p-5">No members yet. Invite someone above.</p>
          ) : (
            <div className="divide-y divide-dark-border">
              {members.map((member) => (
                <div key={member.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-dark-border flex items-center justify-center text-foreground text-xs font-semibold">
                    {member.full_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm truncate">{member.full_name}</p>
                    <p className="text-muted text-xs truncate">{member.email}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    member.role === "admin"
                      ? "bg-orange/10 text-orange"
                      : "bg-dark-border text-muted-light"
                  }`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent requests */}
        <div className="bg-dark rounded-lg border border-dark-border">
          <div className="px-5 py-4 border-b border-dark-border">
            <h2 className="text-foreground font-medium">Recent Requests ({requests.length})</h2>
          </div>
          {requests.length === 0 ? (
            <p className="text-muted text-sm p-5">No requests yet.</p>
          ) : (
            <div className="divide-y divide-dark-border">
              {requests.slice(0, 10).map((req) => (
                <div key={req.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm truncate">{req.title}</p>
                    <p className="text-muted text-xs">
                      {req.linear_issue_key || `#${req.request_number}`} &middot;{" "}
                      {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[req.status]}`}>
                    {STATUS_LABELS[req.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
