import { createServerClient } from "@/lib/supabase/server";
import type { Profile } from "./types";

export async function getAdminContext() {
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

  if (!profile || profile.role !== "admin") return null;

  return {
    user,
    profile: profile as Profile,
  };
}

export async function requireAdmin(): Promise<
  | { user: { id: string; email?: string }; profile: Profile; error?: never; status?: never }
  | { error: string; status: number; user?: never; profile?: never }
> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Admin access required", status: 403 };
  }

  return { user, profile: profile as Profile };
}
