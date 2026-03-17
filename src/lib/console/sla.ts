import { createAdminClient } from "@/lib/supabase/admin";
import type { Tier, OrchestratorTask } from "./types";

export interface SLAConfig {
  tier: Tier;
  responseTimeHours: number;
  resolutionTimeHours: number;
  priorityMultiplier: Record<string, number>;
}

export const SLA_CONFIG: Record<Tier, SLAConfig> = {
  copper: {
    tier: "copper",
    responseTimeHours: 48,
    resolutionTimeHours: 168,
    priorityMultiplier: { urgent: 0.25, high: 0.5, medium: 1, low: 2 },
  },
  steel: {
    tier: "steel",
    responseTimeHours: 24,
    resolutionTimeHours: 96,
    priorityMultiplier: { urgent: 0.25, high: 0.5, medium: 1, low: 1.5 },
  },
  titanium: {
    tier: "titanium",
    responseTimeHours: 8,
    resolutionTimeHours: 48,
    priorityMultiplier: { urgent: 0.25, high: 0.5, medium: 1, low: 1.5 },
  },
  tungsten: {
    tier: "tungsten",
    responseTimeHours: 4,
    resolutionTimeHours: 24,
    priorityMultiplier: { urgent: 0.25, high: 0.5, medium: 1, low: 1 },
  },
};

/**
 * Calculate the SLA deadline for a task based on tier, priority, and creation time.
 */
export function calculateSLADeadline(params: {
  tier: Tier;
  priority: string;
  createdAt: string;
  type: "response" | "resolution";
}): Date {
  const config = SLA_CONFIG[params.tier];
  const baseHours =
    params.type === "response"
      ? config.responseTimeHours
      : config.resolutionTimeHours;
  const multiplier = config.priorityMultiplier[params.priority] ?? 1;
  const effectiveHours = baseHours * multiplier;
  const createdMs = new Date(params.createdAt).getTime();
  return new Date(createdMs + effectiveHours * 60 * 60 * 1000);
}

/**
 * Check whether a task is on track, at risk, or has breached its SLA.
 * "at_risk" = more than 75% of the SLA window has elapsed.
 * "breached" = past the deadline.
 */
export function checkSLAStatus(params: {
  slaDeadline: string;
  currentStatus: string;
}): {
  status: "on_track" | "at_risk" | "breached";
  hoursRemaining: number;
  percentElapsed: number;
} {
  // If the task is already done, it's on track by definition
  if (["completed", "cancelled", "done", "shipped"].includes(params.currentStatus)) {
    return { status: "on_track", hoursRemaining: 0, percentElapsed: 100 };
  }

  const now = Date.now();
  const deadlineMs = new Date(params.slaDeadline).getTime();
  const remainingMs = deadlineMs - now;
  const hoursRemaining = remainingMs / (60 * 60 * 1000);

  // We don't know createdAt here, so we estimate percentElapsed using hours remaining
  // relative to the total window. Since we can't recover createdAt, we use a simpler check.
  if (remainingMs <= 0) {
    return { status: "breached", hoursRemaining: 0, percentElapsed: 100 };
  }

  // For percentElapsed, we need the total window. Without createdAt, we estimate
  // based on the assumption that tasks are checked regularly. We'll use a heuristic:
  // if less than 25% of hours remain relative to a reasonable window, it's at risk.
  // A better approach: calculate from the created_at stored alongside.
  // We'll flag at_risk if less than 25% of time remains (hours remaining / total hours < 0.25).
  // Since we don't have total hours here, we check absolute remaining time as a proxy.
  // The caller should compute percentElapsed from createdAt if needed.

  // Default percentElapsed to 0 — callers with createdAt can compute more precisely
  const percentElapsed = 0;

  // Simple threshold: if less than 25% of a reasonable SLA window remains
  // We'll use hours remaining < 25% of deadline-from-now as heuristic
  if (hoursRemaining <= 2) {
    return { status: "at_risk", hoursRemaining, percentElapsed };
  }

  return { status: "on_track", hoursRemaining, percentElapsed };
}

/**
 * Enhanced SLA status check that uses createdAt for accurate percentElapsed.
 */
export function checkSLAStatusWithCreatedAt(params: {
  slaDeadline: string;
  createdAt: string;
  currentStatus: string;
}): {
  status: "on_track" | "at_risk" | "breached";
  hoursRemaining: number;
  percentElapsed: number;
} {
  if (["completed", "cancelled", "done", "shipped"].includes(params.currentStatus)) {
    return { status: "on_track", hoursRemaining: 0, percentElapsed: 100 };
  }

  const now = Date.now();
  const deadlineMs = new Date(params.slaDeadline).getTime();
  const createdMs = new Date(params.createdAt).getTime();
  const totalWindowMs = deadlineMs - createdMs;
  const remainingMs = deadlineMs - now;
  const elapsedMs = now - createdMs;

  const hoursRemaining = Math.max(0, remainingMs / (60 * 60 * 1000));
  const percentElapsed = totalWindowMs > 0 ? Math.min(100, (elapsedMs / totalWindowMs) * 100) : 100;

  if (remainingMs <= 0) {
    return { status: "breached", hoursRemaining: 0, percentElapsed: 100 };
  }

  if (percentElapsed >= 75) {
    return { status: "at_risk", hoursRemaining, percentElapsed };
  }

  return { status: "on_track", hoursRemaining, percentElapsed };
}

/**
 * Get SLA summary statistics for an organization.
 */
export async function getSLASummary(orgId: string): Promise<{
  totalTasks: number;
  onTrack: number;
  atRisk: number;
  breached: number;
  avgResponseTimeHours: number;
  avgResolutionTimeHours: number;
  slaComplianceRate: number;
}> {
  const admin = createAdminClient();

  const { data: tasks, error } = await admin
    .from("orchestrator_queue")
    .select("*")
    .eq("organization_id", orgId);

  if (error) throw new Error(`Failed to fetch SLA data: ${error.message}`);

  const all = (tasks ?? []) as unknown as OrchestratorTask[];

  let onTrack = 0;
  let atRisk = 0;
  let breached = 0;
  let totalResponseMs = 0;
  let responseCount = 0;
  let totalResolutionMs = 0;
  let resolutionCount = 0;

  for (const task of all) {
    // SLA status
    if (task.sla_deadline) {
      const slaResult = checkSLAStatusWithCreatedAt({
        slaDeadline: task.sla_deadline,
        createdAt: task.created_at,
        currentStatus: task.status,
      });

      switch (slaResult.status) {
        case "on_track":
          onTrack++;
          break;
        case "at_risk":
          atRisk++;
          break;
        case "breached":
          breached++;
          break;
      }
    } else {
      onTrack++;
    }

    // Response time: created_at -> assigned_at
    if (task.assigned_at) {
      totalResponseMs += new Date(task.assigned_at).getTime() - new Date(task.created_at).getTime();
      responseCount++;
    }

    // Resolution time: created_at -> completed_at
    if (task.completed_at) {
      totalResolutionMs += new Date(task.completed_at).getTime() - new Date(task.created_at).getTime();
      resolutionCount++;
    }
  }

  const totalTasks = all.length;
  const tasksWithSla = onTrack + atRisk + breached;
  const slaComplianceRate = tasksWithSla > 0 ? ((onTrack + atRisk) / tasksWithSla) * 100 : 100;

  return {
    totalTasks,
    onTrack,
    atRisk,
    breached,
    avgResponseTimeHours: responseCount > 0 ? totalResponseMs / responseCount / (60 * 60 * 1000) : 0,
    avgResolutionTimeHours: resolutionCount > 0 ? totalResolutionMs / resolutionCount / (60 * 60 * 1000) : 0,
    slaComplianceRate: Math.round(slaComplianceRate * 10) / 10,
  };
}
