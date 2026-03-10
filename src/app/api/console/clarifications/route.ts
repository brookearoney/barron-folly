import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Clarification } from "@/lib/console/types";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: allClarifications, error } = await supabase
      .from("clarifications")
      .select("*, request:requests(id, title, linear_issue_key)")
      .eq("organization_id", profile.organization_id)
      .order("asked_at", { ascending: false });

    if (error) throw error;

    // Build threaded structure: group replies under their parent
    const flat = (allClarifications || []) as (Clarification & {
      request?: { id: string; title: string; linear_issue_key: string | null };
    })[];

    const parentMap = new Map<string, typeof flat>();
    const roots: typeof flat = [];

    for (const c of flat) {
      if (c.parent_id) {
        const siblings = parentMap.get(c.parent_id) || [];
        siblings.push(c);
        parentMap.set(c.parent_id, siblings);
      } else {
        roots.push(c);
      }
    }

    // Attach replies to parents
    const threaded = roots.map((root) => ({
      ...root,
      replies: parentMap.get(root.id) || [],
    }));

    return NextResponse.json({ clarifications: threaded });
  } catch (error) {
    console.error("List clarifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clarifications" },
      { status: 500 }
    );
  }
}
