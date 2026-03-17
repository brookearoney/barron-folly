import { createAdminClient } from "@/lib/supabase/admin";
import { updateTaskStatus } from "@/lib/console/orchestrator";
import { dispatchNotification } from "@/lib/console/notification-dispatcher";
import type {
  AutonomyLevel,
  EscalationTrigger,
  EscalationEvent,
} from "@/lib/console/types";

// ─── Autonomy Level Ordering ─────────────────────────────────────────────

const AUTONOMY_ORDER: Record<AutonomyLevel, number> = {
  suggest: 0,
  auto_draft: 1,
  auto_execute: 2,
  full_auto: 3,
};

const AUTONOMY_LEVELS: AutonomyLevel[] = [
  "suggest",
  "auto_draft",
  "auto_execute",
  "full_auto",
];

// ─── Escalation Severity ─────────────────────────────────────────────────

const TRIGGER_SEVERITY: Record<EscalationTrigger, number> = {
  confidence_drop: 1,
  timeout: 1,
  resource_limit: 1,
  dependency_blocked: 1,
  error_threshold: 2,
  anomaly_detected: 2,
  client_escalation: 2,
  policy_violation: 3,
};

// ─── Escalate ────────────────────────────────────────────────────────────

export async function escalate(params: {
  taskId: string;
  orgId: string;
  trigger: EscalationTrigger;
  currentLevel: AutonomyLevel;
  details: string;
}): Promise<EscalationEvent> {
  const admin = createAdminClient();
  const { taskId, orgId, trigger, currentLevel, details } = params;

  // 1. Reduce autonomy level
  const severity = TRIGGER_SEVERITY[trigger];
  const currentIndex = AUTONOMY_ORDER[currentLevel];
  const newIndex = Math.max(0, currentIndex - severity);
  const newLevel = AUTONOMY_LEVELS[newIndex];

  // 2. Insert escalation event
  const { data: event, error: insertError } = await admin
    .from("escalation_events")
    .insert({
      task_id: taskId,
      organization_id: orgId,
      trigger,
      previous_level: currentLevel,
      new_level: newLevel,
      details,
      resolved: false,
      resolved_by: null,
      resolved_at: null,
    })
    .select()
    .single();

  if (insertError || !event) {
    throw new Error(`Failed to create escalation event: ${insertError?.message}`);
  }

  // 3. Pause the task in orchestrator (set to 'blocked')
  try {
    await updateTaskStatus(taskId, "blocked", {
      blockedReason: `Escalation: ${trigger} - ${details}`,
    });
  } catch (err) {
    // Task may not exist in queue yet; log but don't fail
    console.error("Failed to block task during escalation:", err);
  }

  // 4. Notify via notification dispatcher
  const triggerLabel = trigger.replace(/_/g, " ");
  await dispatchNotification({
    organizationId: orgId,
    type: "approval",
    title: `Escalation: ${triggerLabel}`,
    body: `Task escalated from ${currentLevel} to ${newLevel}. ${details}`,
    referenceId: event.id,
  });

  // 5. Return the escalation event
  return event as EscalationEvent;
}

// ─── Resolve Escalation ──────────────────────────────────────────────────

export async function resolveEscalation(
  escalationId: string,
  resolvedBy: string
): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin
    .from("escalation_events")
    .update({
      resolved: true,
      resolved_by: resolvedBy,
      resolved_at: now,
    })
    .eq("id", escalationId);

  if (error) {
    throw new Error(`Failed to resolve escalation: ${error.message}`);
  }
}

// ─── Get Escalation History ──────────────────────────────────────────────

export async function getEscalationHistory(params: {
  orgId?: string;
  taskId?: string;
  resolved?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ events: EscalationEvent[]; total: number }> {
  const admin = createAdminClient();
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  let query = admin
    .from("escalation_events")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.orgId) query = query.eq("organization_id", params.orgId);
  if (params.taskId) query = query.eq("task_id", params.taskId);
  if (params.resolved !== undefined) query = query.eq("resolved", params.resolved);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch escalation history: ${error.message}`);
  }

  return {
    events: (data ?? []) as EscalationEvent[],
    total: count ?? 0,
  };
}

// ─── Get Unresolved Escalation Count ─────────────────────────────────────

export async function getUnresolvedEscalationCount(orgId?: string): Promise<number> {
  const admin = createAdminClient();

  let query = admin
    .from("escalation_events")
    .select("*", { count: "exact", head: true })
    .eq("resolved", false);

  if (orgId) query = query.eq("organization_id", orgId);

  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to count unresolved escalations: ${error.message}`);
  }

  return count ?? 0;
}
