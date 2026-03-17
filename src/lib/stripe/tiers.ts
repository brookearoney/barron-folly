import type { Tier, RequestCategory, RiskLevel } from "@/lib/console/types";

export interface TierEntitlements {
  tier: Tier;
  name: string;
  maxParallelTasks: number;
  slaPriorityWeight: number;
  allowedRequestTypes: RequestCategory[] | "all";
  approvalThreshold: RiskLevel;
  autopilotCategories: RequestCategory[];
  maxMonthlyRequests: number | null;
  strategySessionsIncluded: boolean;
  supportLevel: "standard" | "priority" | "dedicated";
  features: string[];
}

export const TIER_CONFIG: Record<Tier, TierEntitlements> = {
  copper: {
    tier: "copper",
    name: "Copper",
    maxParallelTasks: 2,
    slaPriorityWeight: 20,
    allowedRequestTypes: ["web_platform", "content", "seo", "brand", "other"],
    approvalThreshold: "low",
    autopilotCategories: ["content", "seo"],
    maxMonthlyRequests: 10,
    strategySessionsIncluded: false,
    supportLevel: "standard",
    features: [
      "Up to 10 requests/month",
      "2 parallel tasks",
      "Low-risk autopilot",
      "Standard support",
    ],
  },
  steel: {
    tier: "steel",
    name: "Steel",
    maxParallelTasks: 5,
    slaPriorityWeight: 40,
    allowedRequestTypes: "all",
    approvalThreshold: "medium",
    autopilotCategories: ["content", "seo", "automation", "brand"],
    maxMonthlyRequests: 25,
    strategySessionsIncluded: false,
    supportLevel: "priority",
    features: [
      "Up to 25 requests/month",
      "5 parallel tasks",
      "Medium-risk autopilot",
      "Priority support",
    ],
  },
  titanium: {
    tier: "titanium",
    name: "Titanium",
    maxParallelTasks: 10,
    slaPriorityWeight: 60,
    allowedRequestTypes: "all",
    approvalThreshold: "medium",
    autopilotCategories: ["content", "seo", "automation", "brand", "web_platform"],
    maxMonthlyRequests: null,
    strategySessionsIncluded: true,
    supportLevel: "dedicated",
    features: [
      "Unlimited requests",
      "10 parallel tasks",
      "Extended autopilot",
      "Strategy sessions",
      "Dedicated support",
    ],
  },
  tungsten: {
    tier: "tungsten",
    name: "Tungsten",
    maxParallelTasks: 20,
    slaPriorityWeight: 80,
    allowedRequestTypes: "all",
    approvalThreshold: "high",
    autopilotCategories: [
      "content",
      "seo",
      "automation",
      "brand",
      "web_platform",
      "design_system",
      "integration",
      "internal_tool",
    ],
    maxMonthlyRequests: null,
    strategySessionsIncluded: true,
    supportLevel: "dedicated",
    features: [
      "Unlimited requests",
      "20 parallel tasks",
      "Full autopilot",
      "Strategy sessions",
      "Exec-level change control",
      "Dedicated support",
    ],
  },
};

/** Map Stripe price IDs to tiers */
export function getTierFromPriceId(priceId: string): Tier | null {
  const priceMap: Record<string, Tier> = {};

  if (process.env.STRIPE_PRICE_COPPER) priceMap[process.env.STRIPE_PRICE_COPPER] = "copper";
  if (process.env.STRIPE_PRICE_STEEL) priceMap[process.env.STRIPE_PRICE_STEEL] = "steel";
  if (process.env.STRIPE_PRICE_TITANIUM) priceMap[process.env.STRIPE_PRICE_TITANIUM] = "titanium";
  if (process.env.STRIPE_PRICE_TUNGSTEN) priceMap[process.env.STRIPE_PRICE_TUNGSTEN] = "tungsten";

  return priceMap[priceId] ?? null;
}

/** Get the Stripe price ID for a given tier */
export function getPriceIdForTier(tier: Tier): string | null {
  const envMap: Record<Tier, string | undefined> = {
    copper: process.env.STRIPE_PRICE_COPPER,
    steel: process.env.STRIPE_PRICE_STEEL,
    titanium: process.env.STRIPE_PRICE_TITANIUM,
    tungsten: process.env.STRIPE_PRICE_TUNGSTEN,
  };

  return envMap[tier] ?? null;
}
