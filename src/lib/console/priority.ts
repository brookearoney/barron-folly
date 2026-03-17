import type { Tier, RiskLevel } from "./types";

const TIER_BASE_PRIORITY: Record<Tier, number> = {
  tungsten: 80,
  titanium: 60,
  steel: 40,
  copper: 20,
};

/**
 * Calculate task priority (0-100, higher = more urgent).
 *
 * Factors:
 * - Tier base priority (tungsten=80, titanium=60, steel=40, copper=20)
 * - Age bonus: +1 per hour waiting (prevents starvation)
 * - SLA proximity: +20 if within 25% of deadline
 * - Risk adjustment: high=+5, medium=+2, low=+0
 */
export function calculatePriority(params: {
  tier: Tier;
  riskLevel: RiskLevel;
  category?: string;
  createdAt: string;
  slaDeadline?: string;
}): number {
  const { tier, riskLevel, createdAt, slaDeadline } = params;

  // Base priority from tier
  let priority = TIER_BASE_PRIORITY[tier] ?? 20;

  // Age bonus: +1 per hour waiting
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
  priority += ageHours;

  // SLA proximity bonus
  if (slaDeadline) {
    const deadlineMs = new Date(slaDeadline).getTime();
    const totalWindowMs = deadlineMs - new Date(createdAt).getTime();
    const remainingMs = deadlineMs - Date.now();

    if (totalWindowMs > 0 && remainingMs > 0) {
      const remainingRatio = remainingMs / totalWindowMs;
      if (remainingRatio <= 0.25) {
        priority += 20;
      }
    } else if (remainingMs <= 0) {
      // Past deadline — maximum urgency boost
      priority += 20;
    }
  }

  // Risk adjustment
  if (riskLevel === "high") {
    priority += 5;
  } else if (riskLevel === "medium") {
    priority += 2;
  }

  // Cap at 100
  return Math.min(priority, 100);
}
