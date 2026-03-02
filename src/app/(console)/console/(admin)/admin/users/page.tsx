"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EmptyState from "@/components/console/EmptyState";
import type { Profile, Organization, Tier } from "@/lib/console/types";

type UserWithOrg = Profile & {
  organization?: Pick<Organization, "id" | "name" | "slug" | "tier"> | null;
};

const TIER_COLORS: Record<Tier, string> = {
  copper: "text-amber-600",
  steel: "text-[#9E9E98]",
  titanium: "text-cyan-400",
  tungsten: "text-orange",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteOrgId, setInviteOrgId] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("client");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchOrgs();
  }, []);

  async function fetchUsers() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/console/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  async function fetchOrgs() {
    const res = await fetch("/api/console/admin/organizations");
    const data = await res.json();
    setOrgs((data.organizations || []).map((o: { id: string; name: string }) => ({ id: o.id, name: o.name })));
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteMsg("");

    const res = await fetch("/api/console/admin/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        organization_id: inviteOrgId,
        full_name: inviteName || undefined,
        role: inviteRole,
      }),
    });

    const result = await res.json();
    if (res.ok) {
      setInviteMsg(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteName("");
      setShowInvite(false);
      fetchUsers();
    } else {
      setInviteMsg(result.error || "Failed");
    }
    setInviting(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Users</h1>
          <p className="text-muted text-sm mt-1">{users.length} total</p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="bg-orange hover:bg-orange-dark text-dark font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          Invite user
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <form onSubmit={handleInvite} className="bg-dark rounded-lg border border-orange/20 p-5 mb-6 space-y-4">
          <h3 className="text-foreground font-medium text-sm">Invite a user</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email address"
              className="px-3 py-2.5 bg-background border border-dark-border rounded-lg text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-orange transition-colors"
            />
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Full name (optional)"
              className="px-3 py-2.5 bg-background border border-dark-border rounded-lg text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-orange transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select
              required
              value={inviteOrgId}
              onChange={(e) => setInviteOrgId(e.target.value)}
              className="px-3 py-2.5 bg-background border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
            >
              <option value="">Select organization...</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-3 py-2.5 bg-background border border-dark-border rounded-lg text-foreground text-sm focus:outline-none focus:border-orange transition-colors"
            >
              <option value="client">Client</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 items-center">
            <button
              type="submit"
              disabled={inviting || !inviteEmail || !inviteOrgId}
              className="bg-orange hover:bg-orange-dark text-dark font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {inviting ? "Sending..." : "Send invite"}
            </button>
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="text-muted text-xs hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            {inviteMsg && <span className="text-xs text-emerald-400">{inviteMsg}</span>}
          </div>
        </form>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full max-w-sm px-4 py-2.5 bg-dark border border-dark-border rounded-lg text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-orange transition-colors"
        />
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          title="No users found"
          description={search ? "Try a different search." : "Invite your first user above."}
        />
      ) : (
        <div className="bg-dark rounded-lg border border-dark-border divide-y divide-dark-border">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-4 px-5 py-3">
              <div className="w-8 h-8 rounded-full bg-dark-border flex items-center justify-center text-foreground text-xs font-semibold">
                {user.full_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-medium truncate">{user.full_name}</p>
                <p className="text-muted text-xs truncate">{user.email}</p>
              </div>
              {user.organization ? (
                <Link
                  href={`/console/admin/organizations/${user.organization.id}`}
                  className="text-sm hover:text-foreground transition-colors truncate max-w-[160px]"
                >
                  <span className={TIER_COLORS[user.organization.tier as Tier] || "text-muted"}>
                    {user.organization.name}
                  </span>
                </Link>
              ) : (
                <span className="text-muted text-xs">No org</span>
              )}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                user.role === "admin"
                  ? "bg-orange/10 text-orange"
                  : "bg-dark-border text-muted-light"
              }`}>
                {user.role}
              </span>
              <span className="text-muted text-xs">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
