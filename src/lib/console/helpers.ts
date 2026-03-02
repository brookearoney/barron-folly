import { createServerClient } from "@/lib/supabase/server";
import type { Profile, Organization } from "./types";

export async function getConsoleContext() {
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

  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.organization_id)
    .single();

  if (!organization) return null;

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
