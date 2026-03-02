import { redirect } from "next/navigation";
import { getConsoleContext } from "@/lib/console/helpers";
import { createServerClient } from "@/lib/supabase/server";
import { TIER_CONFIG } from "@/lib/console/constants";
import { tiers as pricingTiers } from "@/data/pricing";
import type { RequestStatus } from "@/lib/console/types";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await getConsoleContext();
  if (!ctx || !ctx.organization) redirect("/console/login");

  const supabase = await createServerClient();

  const tierConfig = TIER_CONFIG[ctx.organization.tier];
  const pricingTier = pricingTiers.find(
    (t) => t.name.toLowerCase() === ctx.organization.tier
  );

  // Count active requests
  const activeStatuses: RequestStatus[] = [
    "submitted", "backlog", "todo", "in_progress", "in_review",
  ];
  const { count: activeCount } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ctx.organization.id)
    .in("status", activeStatuses);

  const tierColors: Record<string, string> = {
    copper: "from-amber-700 to-amber-500",
    steel: "from-gray-500 to-gray-300",
    titanium: "from-cyan-600 to-cyan-400",
    tungsten: "from-orange to-yellow-400",
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted text-sm mt-1">
          Organization and account information
        </p>
      </div>

      <div className="space-y-6">
        {/* Tier card */}
        <div className={`relative overflow-hidden rounded-lg border border-dark-border p-6 bg-gradient-to-br ${tierColors[ctx.organization.tier] || "from-dark to-dark-border"}`}>
          <div className="relative z-10">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">
              Current Plan
            </p>
            <h2 className="text-white text-3xl font-bold mb-1">
              {tierConfig.label}
            </h2>
            <p className="text-white/80 text-lg font-medium">
              {tierConfig.price}
            </p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
        </div>

        {/* Usage */}
        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <h2 className="text-foreground font-medium mb-4">Usage</h2>
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-light text-sm">Active requests</span>
            <span className="text-foreground text-sm font-medium">
              {activeCount ?? 0} / {tierConfig.maxConcurrent}
            </span>
          </div>
          <div className="w-full h-2 bg-dark-border rounded-full overflow-hidden">
            <div
              className="h-full bg-orange rounded-full transition-all"
              style={{
                width: `${Math.min(
                  ((activeCount ?? 0) / tierConfig.maxConcurrent) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Included features */}
        {pricingTier && (
          <div className="bg-dark rounded-lg border border-dark-border p-5">
            <h2 className="text-foreground font-medium mb-3">
              What&apos;s included
            </h2>
            <ul className="space-y-2">
              {pricingTier.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <svg
                    className="w-4 h-4 text-orange mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-muted-light">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Account info */}
        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <h2 className="text-foreground font-medium mb-4">Account</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Organization</span>
              <span className="text-foreground">{ctx.organization.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Name</span>
              <span className="text-foreground">{ctx.profile.full_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Email</span>
              <span className="text-foreground">{ctx.profile.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Role</span>
              <span className="text-foreground capitalize">{ctx.profile.role}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Member since</span>
              <span className="text-foreground">
                {new Date(ctx.profile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
