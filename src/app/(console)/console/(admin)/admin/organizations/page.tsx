import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/console/admin-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { TIER_CONFIG } from "@/lib/console/constants";
import type { Organization, Tier } from "@/lib/console/types";
import EmptyState from "@/components/console/EmptyState";

export const metadata = { title: "Organizations" };

const TIER_COLORS: Record<Tier, string> = {
  copper: "text-amber-600",
  steel: "text-[#9E9E98]",
  titanium: "text-cyan-400",
  tungsten: "text-orange",
};

export default async function OrganizationsPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/console/dashboard");

  const admin = createAdminClient();

  const { data: organizations } = await admin
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  const orgs = (organizations || []) as Organization[];

  // Get counts
  const orgIds = orgs.map((o) => o.id);
  const [{ data: allProfiles }, { data: allRequests }] = await Promise.all([
    admin.from("profiles").select("organization_id").in("organization_id", orgIds),
    admin.from("requests").select("organization_id").in("organization_id", orgIds),
  ]);

  const memberCount = (orgId: string) =>
    (allProfiles || []).filter((p) => p.organization_id === orgId).length;
  const requestCount = (orgId: string) =>
    (allRequests || []).filter((r) => r.organization_id === orgId).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Organizations</h1>
          <p className="text-muted text-sm mt-1">{orgs.length} total</p>
        </div>
        <Link
          href="/console/admin/organizations/new"
          className="bg-orange hover:bg-orange-dark text-dark font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          New organization
        </Link>
      </div>

      {orgs.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          title="No organizations yet"
          description="Create your first client organization to get started."
          action={
            <Link href="/console/admin/organizations/new" className="bg-orange hover:bg-orange-dark text-dark font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
              New organization
            </Link>
          }
        />
      ) : (
        <div className="bg-dark rounded-lg border border-dark-border">
          <div className="divide-y divide-dark-border">
            {orgs.map((org) => (
              <Link
                key={org.id}
                href={`/console/admin/organizations/${org.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-dark-border/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-foreground text-sm font-medium">{org.name}</span>
                    <span className="text-muted text-xs">/{org.slug}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span>{memberCount(org.id)} members</span>
                    <span>{requestCount(org.id)} requests</span>
                    <span>{new Date(org.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`text-sm font-medium capitalize ${TIER_COLORS[org.tier]}`}>
                  {TIER_CONFIG[org.tier].label}
                </span>
                <span className="text-muted text-sm">{TIER_CONFIG[org.tier].price}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
