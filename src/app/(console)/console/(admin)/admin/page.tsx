import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/console/admin-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RequestStatus, ActivityLog, Profile } from "@/lib/console/types";

export const metadata = { title: "Admin Overview" };

const ACTION_LABELS: Record<string, string> = {
  request_created: "Request submitted",
  status_changed: "Status updated",
  clarification_asked: "Clarification requested",
  clarification_answered: "Clarification answered",
  approval_created: "Approval requested",
  approval_decided: "Approval decision",
  comment_added: "Comment added",
};

export default async function AdminDashboardPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/console/dashboard");

  const admin = createAdminClient();
  const activeStatuses: RequestStatus[] = [
    "submitted", "backlog", "todo", "in_progress", "in_review",
  ];

  const [
    { count: orgCount },
    { count: userCount },
    { count: activeRequests },
    { count: pendingClarifications },
    { count: pendingApprovals },
    { data: recentActivity },
    { data: recentOrgs },
  ] = await Promise.all([
    admin.from("organizations").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("requests").select("*", { count: "exact", head: true }).in("status", activeStatuses),
    admin.from("clarifications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("approvals").select("*", { count: "exact", head: true }).is("decision", null),
    admin
      .from("activity_log")
      .select("*, profile:profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(15),
    admin.from("organizations").select("id, name, tier, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const activity = (recentActivity || []) as (ActivityLog & { profile?: Pick<Profile, "full_name" | "email"> })[];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Admin Overview</h1>
          <p className="text-muted text-sm mt-1">Cross-organization management</p>
        </div>
        <Link
          href="/console/admin/organizations/new"
          className="bg-orange hover:bg-orange-dark text-dark font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          New organization
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Organizations", value: orgCount ?? 0, href: "/console/admin/organizations" },
          { label: "Users", value: userCount ?? 0, href: "/console/admin/users" },
          { label: "Active requests", value: activeRequests ?? 0, href: "/console/admin/requests" },
          { label: "Pending clarifications", value: pendingClarifications ?? 0, color: (pendingClarifications ?? 0) > 0 ? "text-orange" : undefined },
          { label: "Pending approvals", value: pendingApprovals ?? 0, color: (pendingApprovals ?? 0) > 0 ? "text-orange" : undefined },
        ].map((stat) => (
          <div key={stat.label} className="bg-dark rounded-lg border border-dark-border p-4">
            <p className="text-muted text-xs mb-1">{stat.label}</p>
            {stat.href ? (
              <Link href={stat.href} className="text-xl font-semibold text-foreground hover:text-orange transition-colors">
                {stat.value}
              </Link>
            ) : (
              <p className={`text-xl font-semibold ${stat.color || "text-foreground"}`}>{stat.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-dark rounded-lg border border-dark-border">
          <div className="px-5 py-4 border-b border-dark-border">
            <h2 className="text-foreground font-medium">Recent Activity</h2>
          </div>
          {activity.length === 0 ? (
            <p className="text-muted text-sm p-5">No activity yet.</p>
          ) : (
            <div className="divide-y divide-dark-border">
              {activity.map((entry) => (
                <div key={entry.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-dark-border shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm truncate">
                      {ACTION_LABELS[entry.action] || entry.action}
                    </p>
                    <p className="text-muted text-xs">
                      {entry.profile?.full_name || "System"} &middot;{" "}
                      {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orgs */}
        <div className="bg-dark rounded-lg border border-dark-border">
          <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between">
            <h2 className="text-foreground font-medium">Organizations</h2>
            <Link href="/console/admin/organizations" className="text-orange text-xs hover:underline">
              View all
            </Link>
          </div>
          {(recentOrgs || []).length === 0 ? (
            <p className="text-muted text-sm p-5">No organizations yet.</p>
          ) : (
            <div className="divide-y divide-dark-border">
              {(recentOrgs || []).map((org) => (
                <Link
                  key={org.id}
                  href={`/console/admin/organizations/${org.id}`}
                  className="block px-5 py-3 hover:bg-dark-border/30 transition-colors"
                >
                  <p className="text-foreground text-sm font-medium">{org.name}</p>
                  <p className="text-muted text-xs capitalize">{org.tier} tier</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
