import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe/subscriptions";
import type { Tier } from "@/lib/console/types";

const VALID_TIERS: Tier[] = ["copper", "steel", "titanium", "tungsten"];

export async function POST(req: Request) {
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

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const { tier } = await req.json();

    if (!tier || !VALID_TIERS.includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "";

    const { url } = await createCheckoutSession({
      orgId: profile.organization_id,
      tier,
      successUrl: `${origin}/console/settings/billing?success=true`,
      cancelUrl: `${origin}/console/settings/billing?cancelled=true`,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Checkout session error:", error);
    const message = error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
