import { createServerClient } from "@/lib/supabase/server";
import type { Profile, Organization } from "./types";

export type ConsoleContext = {
  user: { id: string; email?: string };
  profile: Profile;
  organization: Organization;
  pendingCounts: { clarifications: number; approvals: number };
};

export type PartialConsoleContext = {
  user: { id: string; email?: string };
  profile: Profile;
  organization: null;
  pendingCounts: { clarifications: number; approvals: number };
};

/**
 * Returns full context (user + profile + org) or partial context
 * (user + profile but no org) or null (not authenticated).
 */
export async function getConsoleContext(): Promise<
  ConsoleContext | PartialConsoleContext | null
> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  // User exists but has no org assigned yet
  if (!profile.organization_id) {
    return {
      user,
      profile: profile as Profile,
      organization: null,
      pendingCounts: { clarifications: 0, approvals: 0 },
    };
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.organization_id)
    .single();

  if (!organization) {
    return {
      user,
      profile: profile as Profile,
      organization: null,
      pendingCounts: { clarifications: 0, approvals: 0 },
    };
  }

  // Get pending counts
  const [{ count: clarifications }, { count: approvals }] = await Promise.all([
    supabase
      .from("clarifications")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("status", "pending"),
    supabase
      .from("approvals")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .is("decision", null),
  ]);

  return {
    user,
    profile: profile as Profile,
    organization: organization as Organization,
    pendingCounts: {
      clarifications: clarifications ?? 0,
      approvals: approvals ?? 0,
    },
  };
}
