import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientPolicy } from "@/lib/console/policies";
import { assessRisk } from "@/lib/console/risk-scoring";
import type { Organization, Request as Req, AiClarificationData } from "@/lib/console/types";

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { request_id } = await req.json();
    if (!request_id) {
      return NextResponse.json(
        { error: "request_id is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch request
    const { data: request, error: reqError } = await admin
      .from("requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (reqError || !request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    const typedRequest = request as unknown as Req;

    // Fetch org
    const { data: org } = await admin
      .from("organizations")
      .select("id, tier")
      .eq("id", typedRequest.organization_id)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const typedOrg = org as Pick<Organization, "id" | "tier">;

    // Fetch policy
    const policy = await getClientPolicy(typedRequest.organization_id);

    // Determine complexity from AI clarification data
    const clarData = typedRequest.ai_clarification_data as AiClarificationData | null;
    const complexity = clarData?.complexity || "moderate";

    // Run risk assessment
    const riskAssessment = assessRisk(
      {
        category: typedRequest.category,
        complexity,
        description: typedRequest.description,
      },
      {
        tier: typedOrg.tier,
        risk_level: policy?.risk_level,
      },
      policy
    );

    return NextResponse.json({ risk_assessment: riskAssessment });
  } catch (error) {
    console.error("Risk assessment error:", error);
    return NextResponse.json(
      { error: "Failed to assess risk" },
      { status: 500 }
    );
  }
}
