import type { RequestCategory, Tier, RiskLevel, RiskAssessment, ClientPolicy } from "./types";

// ─── Category Risk Weights ───────────────────────────────────────────────

const CATEGORY_RISK_WEIGHTS: Record<RequestCategory, number> = {
  web_platform: 40,
  automation: 50,
  design_system: 25,
  integration: 55,
  internal_tool: 45,
  seo: 15,
  content: 10,
  brand: 20,
  ai_agent: 60,
  other: 35,
};

const HIGH_RISK_CATEGORIES: RequestCategory[] = ["integration", "ai_agent", "automation"];
const LOW_RISK_CATEGORIES: RequestCategory[] = ["content", "seo", "brand"];

// ─── Complexity Multipliers ──────────────────────────────────────────────

const COMPLEXITY_MULTIPLIERS: Record<string, number> = {
  simple: 0.7,
  moderate: 1.0,
  complex: 1.4,
};

// ─── Tier Risk Adjustments ───────────────────────────────────────────────

const TIER_ADJUSTMENTS: Record<Tier, number> = {
  copper: 0,
  steel: -5,
  titanium: 5,
  tungsten: 10,
};

// ─── Prod-touching keyword detection ─────────────────────────────────────

const PROD_KEYWORDS = [
  "production",
  "deploy",
  "migration",
  "database",
  "schema",
  "auth",
  "payment",
  "billing",
  "security",
  "credentials",
  "api key",
  "secret",
  "delete",
  "drop",
  "rollback",
  "infrastructure",
  "dns",
  "ssl",
  "certificate",
];

const DEPENDENCY_KEYWORDS = [
  "depends on",
  "blocking",
  "prerequisite",
  "after",
  "requires",
  "third-party",
  "external api",
  "vendor",
];

// ─── Main Risk Assessment ────────────────────────────────────────────────

export function assessRisk(
  request: {
    category: RequestCategory;
    complexity: string;
    description: string;
  },
  org: {
    tier: Tier;
    risk_level?: RiskLevel;
  },
  policy: ClientPolicy | null
): RiskAssessment {
  const factors: string[] = [];
  let score = 0;

  // 1. Category base risk
  const categoryWeight = CATEGORY_RISK_WEIGHTS[request.category] || 35;
  score += categoryWeight;
  if (HIGH_RISK_CATEGORIES.includes(request.category)) {
    factors.push(`High-risk category: ${request.category}`);
  } else if (LOW_RISK_CATEGORIES.includes(request.category)) {
    factors.push(`Low-risk category: ${request.category}`);
  }

  // 2. Complexity multiplier
  const multiplier = COMPLEXITY_MULTIPLIERS[request.complexity] || 1.0;
  score = Math.round(score * multiplier);
  if (request.complexity === "complex") {
    factors.push("Complex task with higher risk surface");
  }

  // 3. Tier adjustment
  const tierAdj = TIER_ADJUSTMENTS[org.tier];
  if (tierAdj !== 0) {
    score += tierAdj;
    if (tierAdj > 0) {
      factors.push(`Higher-tier client (${org.tier}) requires more careful oversight`);
    }
  }

  // 4. Org-level risk override
  if (org.risk_level === "high") {
    score += 15;
    factors.push("Organization marked as high-risk");
  } else if (org.risk_level === "low") {
    score -= 10;
  }

  // 5. Regulated flag from policy
  if (policy?.regulated) {
    score += 20;
    factors.push("Organization operates in a regulated industry");
  }

  // 6. Prod-touching keywords in description
  const descLower = request.description.toLowerCase();
  const matchedProdKeywords = PROD_KEYWORDS.filter((kw) => descLower.includes(kw));
  if (matchedProdKeywords.length > 0) {
    const prodBoost = Math.min(matchedProdKeywords.length * 5, 20);
    score += prodBoost;
    factors.push(`Production-sensitive keywords detected: ${matchedProdKeywords.slice(0, 3).join(", ")}`);
  }

  // 7. Dependency keywords
  const matchedDepKeywords = DEPENDENCY_KEYWORDS.filter((kw) => descLower.includes(kw));
  if (matchedDepKeywords.length > 0) {
    score += 10;
    factors.push("External dependencies detected");
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine risk level
  let level: RiskLevel;
  if (score >= 65) {
    level = "high";
  } else if (score >= 35) {
    level = "medium";
  } else {
    level = "low";
  }

  // Determine if approval is required
  let requires_approval = false;
  let blocked = false;
  let block_reason: string | undefined;

  if (policy) {
    const RISK_ORDER: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 };
    const actionLevel = RISK_ORDER[level];
    const threshold = RISK_ORDER[policy.requires_human_approval_above];
    requires_approval = actionLevel >= threshold;

    // Check if category is blocked
    if (policy.blocked_categories.includes(request.category)) {
      blocked = true;
      block_reason = `Category "${request.category}" is blocked by client policy.`;
    }

    // Auto-approve override
    if (policy.auto_approve_categories.includes(request.category) && !blocked) {
      requires_approval = false;
    }
  } else {
    // No policy: require approval for medium+ risk
    requires_approval = level !== "low";
  }

  return {
    score,
    level,
    factors,
    requires_approval,
    blocked,
    block_reason,
  };
}
