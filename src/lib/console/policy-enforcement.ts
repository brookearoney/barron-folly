import { createAdminClient } from "@/lib/supabase/admin";
import { getClientPolicy } from "./policies";
import { assessRisk } from "./risk-scoring";
import type {
  ClientPolicy,
  RequestCategory,
  RiskLevel,
  RiskAssessment,
  Organization,
} from "./types";

interface EnforcementAction {
  category: RequestCategory;
  riskLevel: RiskLevel;
  environment?: string;
  description?: string;
  complexity?: string;
}

interface EnforcementResult {
  proceed: boolean;
  requiresApproval: boolean;
  riskAssessment: RiskAssessment;
  policy: ClientPolicy | null;
}

export async function enforcePolicy(
  orgId: string,
  action: EnforcementAction
): Promise<EnforcementResult> {
  const admin = createAdminClient();

  // Fetch org and policy in parallel
  const [{ data: org }, policy] = await Promise.all([
    admin.from("organizations").select("tier").eq("id", orgId).single(),
    getClientPolicy(orgId),
  ]);

  const typedOrg = org as Pick<Organization, "tier"> | null;

  // Run risk assessment
  const riskAssessment = assessRisk(
    {
      category: action.category,
      complexity: action.complexity || "moderate",
      description: action.description || "",
    },
    {
      tier: typedOrg?.tier || "copper",
      risk_level: policy?.risk_level,
    },
    policy
  );

  // If blocked by risk assessment
  if (riskAssessment.blocked) {
    return {
      proceed: false,
      requiresApproval: false,
      riskAssessment,
      policy,
    };
  }

  // If no policy, fall back to risk assessment alone
  if (!policy) {
    return {
      proceed: true,
      requiresApproval: riskAssessment.requires_approval,
      riskAssessment,
      policy: null,
    };
  }

  const environment = action.environment || "staging";

  // Check blocked categories
  if (policy.blocked_categories.includes(action.category)) {
    return {
      proceed: false,
      requiresApproval: false,
      riskAssessment: {
        ...riskAssessment,
        blocked: true,
        block_reason: `Category "${action.category}" is blocked by client policy.`,
      },
      policy,
    };
  }

  // Check allowed categories (whitelist)
  if (
    policy.allowed_categories.length > 0 &&
    !policy.allowed_categories.includes(action.category)
  ) {
    return {
      proceed: false,
      requiresApproval: false,
      riskAssessment: {
        ...riskAssessment,
        blocked: true,
        block_reason: `Category "${action.category}" is not in the allowed list.`,
      },
      policy,
    };
  }

  // Check allowed environments
  if (!policy.allowed_environments.includes(environment)) {
    return {
      proceed: false,
      requiresApproval: false,
      riskAssessment: {
        ...riskAssessment,
        blocked: true,
        block_reason: `Environment "${environment}" is not allowed.`,
      },
      policy,
    };
  }

  // Check blackout hours for production
  if (policy.prod_change_blackout_hours && environment === "production") {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const { start, end } = policy.prod_change_blackout_hours;

    const inBlackout =
      start <= end
        ? currentHour >= start && currentHour < end
        : currentHour >= start || currentHour < end;

    if (inBlackout) {
      return {
        proceed: false,
        requiresApproval: false,
        riskAssessment: {
          ...riskAssessment,
          blocked: true,
          block_reason: `Production changes blocked during blackout hours (${start}:00 - ${end}:00 UTC).`,
        },
        policy,
      };
    }
  }

  return {
    proceed: true,
    requiresApproval: riskAssessment.requires_approval,
    riskAssessment,
    policy,
  };
}
