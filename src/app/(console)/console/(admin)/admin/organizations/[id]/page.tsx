"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TIER_CONFIG, STATUS_LABELS, STATUS_COLORS } from "@/lib/console/constants";
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
        linear_team_id: form.get("linear_team_id") || null,
        linear_project_id: form.get("linear_project_id") || null,
      }),
    });

    if (res.ok) {
      const { organization } = await res.json();
      setData((prev) => prev ? { ...prev, organization } : prev);
    }
    setSaving(false);
  }

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
              <label className="block text-sm text-muted-light mb-1.5">Linear Team ID</label>
              <input name="linear_team_id" defaultValue={org.linear_team_id || ""} placeholder="UUID" className="w-full px-3 py-2.5 bg-background border border-dark-border rounded-lg text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-orange transition-colors" />
            </div>
            <div>
              <label className="block text-sm text-muted-light mb-1.5">Linear Project ID</label>
              <input name="linear_project_id" defaultValue={org.linear_project_id || ""} placeholder="UUID" className="w-full px-3 py-2.5 bg-background border border-dark-border rounded-lg text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-orange transition-colors" />
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
