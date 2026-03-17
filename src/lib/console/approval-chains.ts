import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchNotification } from "./notification-dispatcher";
import type { Approval, ApprovalType, RiskLevel } from "./types";

interface CreateChainParams {
  requestId: string;
  organizationId: string;
  steps: Array<{
    title: string;
    summary: string;
    type: ApprovalType;
    riskLevel: RiskLevel;
    impact?: string;
    artifactsUrl?: string;
    rollbackPlan?: string;
    autoApproveAfterHours?: number;
  }>;
}

/**
 * Create a multi-step approval chain.
 * Each step is stored as an approval record with step_number, total_steps,
 * and parent_approval_id linking back to the first step.
 */
export async function createApprovalChain(params: CreateChainParams): Promise<Approval[]> {
  const supabase = createAdminClient();
  const { requestId, organizationId, steps } = params;
  const totalSteps = steps.length;
  const approvals: Approval[] = [];
  let parentId: string | null = null;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const now = new Date();
    const autoApproveAt = step.autoApproveAfterHours
      ? new Date(now.getTime() + step.autoApproveAfterHours * 60 * 60 * 1000).toISOString()
      : null;

    const result = await supabase
      .from("approvals")
      .insert({
        request_id: requestId,
        organization_id: organizationId,
        title: step.title,
        summary: step.summary,
        impact: step.impact || null,
        artifacts_url: step.artifactsUrl || null,
        risk_level: step.riskLevel,
        rollback_plan: step.rollbackPlan || null,
        step_number: i + 1,
        total_steps: totalSteps,
        parent_approval_id: parentId,
        approval_type: step.type,
        auto_approve_at: i === 0 ? autoApproveAt : null, // Only first step starts with auto-approve timer
      })
      .select()
      .single();

    if (result.error) throw result.error;

    const row = result.data as Approval;
    if (i === 0) {
      parentId = row.id;
    }

    approvals.push(row);
  }

  // Send notification for the first step
  if (approvals.length > 0) {
    const first = approvals[0];
    await dispatchNotification({
      organizationId,
      type: "approval",
      title: first.title,
      body: `Step 1 of ${totalSteps}: ${first.summary}`,
      requestId,
      referenceId: first.id,
    });
  }

  return approvals;
}

/**
 * Get the status of an approval chain for a given request.
 * Returns all steps with their current state and whether they can be acted upon.
 */
export async function getApprovalChainStatus(requestId: string): Promise<{
  steps: Array<Approval & { isActive: boolean; canApprove: boolean }>;
  currentStep: number;
  totalSteps: number;
  allApproved: boolean;
  blocked: boolean;
  blockReason?: string;
}> {
  const supabase = createAdminClient();

  const { data: approvals, error } = await supabase
    .from("approvals")
    .select("*")
    .eq("request_id", requestId)
    .order("step_number", { ascending: true });

  if (error) throw error;

  const steps = approvals || [];
  if (steps.length === 0) {
    return {
      steps: [],
      currentStep: 0,
      totalSteps: 0,
      allApproved: false,
      blocked: false,
    };
  }

  const totalSteps = steps[0].total_steps || steps.length;
  let currentStep = 1;
  let blocked = false;
  let blockReason: string | undefined;
  let allApproved = true;

  // Find the first step without a decision (or denied)
  for (const step of steps) {
    if (step.decision === "denied") {
      blocked = true;
      blockReason = `Step ${step.step_number} was denied: ${step.decision_notes || "No reason given"}`;
      allApproved = false;
      break;
    }
    if (!step.decision || step.decision === "revision_requested") {
      currentStep = step.step_number || 1;
      allApproved = false;
      break;
    }
  }

  if (!blocked && allApproved) {
    currentStep = totalSteps;
  }

  const enrichedSteps = steps.map((step) => ({
    ...step,
    isActive: !blocked && (step.step_number === currentStep) && !step.decision,
    canApprove: !blocked && (step.step_number === currentStep) && !step.decision,
  })) as Array<Approval & { isActive: boolean; canApprove: boolean }>;

  return {
    steps: enrichedSteps,
    currentStep,
    totalSteps,
    allApproved,
    blocked,
    blockReason,
  };
}

/**
 * Advance the approval chain after a step has been approved.
 * Activates the next step and sends notifications.
 */
export async function advanceApprovalChain(approvalId: string): Promise<{
  nextStep: Approval | null;
  chainComplete: boolean;
}> {
  const supabase = createAdminClient();

  // Get the current approval
  const { data: current, error: fetchError } = await supabase
    .from("approvals")
    .select("*")
    .eq("id", approvalId)
    .single();

  if (fetchError || !current) {
    throw new Error("Approval not found");
  }

  const stepNumber = current.step_number || 1;
  const totalSteps = current.total_steps || 1;

  // If this is the last step, chain is complete
  if (stepNumber >= totalSteps) {
    return { nextStep: null, chainComplete: true };
  }

  // Find the next step in the chain
  const nextStepNumber = stepNumber + 1;
  const { data: nextSteps } = await supabase
    .from("approvals")
    .select("*")
    .eq("request_id", current.request_id)
    .eq("step_number", nextStepNumber)
    .limit(1);

  const nextStep = nextSteps?.[0] || null;

  if (nextStep) {
    // If the original step had auto_approve_after configured,
    // set it on the next step too (carry forward from chain creation)
    if (current.auto_approve_at) {
      // Calculate the same duration and apply to next step
      const now = new Date();
      const originalDuration = new Date(current.auto_approve_at).getTime() - new Date(current.created_at).getTime();
      const newAutoApproveAt = new Date(now.getTime() + originalDuration).toISOString();

      await supabase
        .from("approvals")
        .update({ auto_approve_at: newAutoApproveAt })
        .eq("id", nextStep.id);
    }

    // Send notification for the next step
    await dispatchNotification({
      organizationId: current.organization_id,
      type: "approval",
      title: nextStep.title,
      body: `Step ${nextStepNumber} of ${totalSteps}: ${nextStep.summary}`,
      requestId: current.request_id,
      referenceId: nextStep.id,
    });
  }

  return { nextStep: nextStep as Approval | null, chainComplete: false };
}

/**
 * Create a standard approval chain based on risk level and deployment presence.
 * - Low risk: single standard approval
 * - Medium risk: standard approval -> client_preview (if deployment)
 * - High risk: architecture review -> standard approval -> client_preview -> production_deploy
 */
export async function createStandardChain(params: {
  requestId: string;
  organizationId: string;
  riskLevel: RiskLevel;
  hasDeployment: boolean;
  title?: string;
  summary?: string;
  impact?: string;
  artifactsUrl?: string;
  rollbackPlan?: string;
  autoApproveAfterHours?: number;
}): Promise<Approval[]> {
  const { requestId, organizationId, riskLevel, hasDeployment, title, summary, impact, artifactsUrl, rollbackPlan, autoApproveAfterHours } = params;
  const baseTitle = title || "Approval Required";
  const baseSummary = summary || "Review and approve this change.";

  const steps: CreateChainParams["steps"] = [];

  if (riskLevel === "low") {
    steps.push({
      title: baseTitle,
      summary: baseSummary,
      type: "standard",
      riskLevel,
      impact,
      artifactsUrl,
      rollbackPlan,
      autoApproveAfterHours,
    });
  } else if (riskLevel === "medium") {
    steps.push({
      title: baseTitle,
      summary: baseSummary,
      type: "standard",
      riskLevel,
      impact,
      artifactsUrl,
      rollbackPlan,
    });

    if (hasDeployment) {
      steps.push({
        title: `Preview: ${baseTitle}`,
        summary: `Review the preview deployment for: ${baseSummary}`,
        type: "client_preview",
        riskLevel,
        impact,
        artifactsUrl,
        autoApproveAfterHours,
      });
    }
  } else {
    // High risk
    steps.push({
      title: `Architecture Review: ${baseTitle}`,
      summary: `Review the architecture and approach for: ${baseSummary}`,
      type: "architecture",
      riskLevel,
      impact,
    });

    steps.push({
      title: baseTitle,
      summary: baseSummary,
      type: "standard",
      riskLevel,
      impact,
      artifactsUrl,
      rollbackPlan,
    });

    if (hasDeployment) {
      steps.push({
        title: `Preview: ${baseTitle}`,
        summary: `Review the preview deployment for: ${baseSummary}`,
        type: "client_preview",
        riskLevel,
        impact,
        artifactsUrl,
      });

      steps.push({
        title: `Production Deploy: ${baseTitle}`,
        summary: `Final approval to deploy to production: ${baseSummary}`,
        type: "production_deploy",
        riskLevel,
        impact,
        artifactsUrl,
        rollbackPlan,
      });
    }
  }

  return createApprovalChain({ requestId, organizationId, steps });
}
