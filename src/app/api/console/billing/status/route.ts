import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getEntitlementStatus } from "@/lib/console/entitlements";
import { getSubscriptionDetails } from "@/lib/stripe/subscriptions";

export async function GET(request: NextRequest) {
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
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Allow admins to query by orgId
    const { searchParams } = request.nextUrl;
    const queryOrgId = searchParams.get("orgId");

    let orgId = profile.organization_id;

    if (queryOrgId && profile.role === "admin") {
      orgId = queryOrgId;
    } else if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const [entitlements, subscription] = await Promise.all([
      getEntitlementStatus(orgId),
      getSubscriptionDetails(orgId).catch(() => null),
    ]);

    return NextResponse.json({ entitlements, subscription });
  } catch (error) {
    console.error("Billing status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing status" },
      { status: 500 }
    );
  }
}
