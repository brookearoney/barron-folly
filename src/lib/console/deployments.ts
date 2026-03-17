import { createAdminClient } from "@/lib/supabase/admin";
import {
  isVercelConfigured,
  getCurrentProductionDeployment,
  promoteToProduction as vercelPromote,
  rollbackTo as vercelRollback,
} from "@/lib/vercel/client";
import type {
  Deployment,
  DeployEnvironment,
  DeployStatus,
  QAStatus,
} from "./types";

function getSupabase() {
  return createAdminClient();
}

/** Create a deployment record when a PR is merged or preview is created */
export async function createDeploymentRecord(params: {
  organizationId: string;
  requestId?: string;
  approvalId?: string;
  environment: DeployEnvironment;
  gitBranch?: string;
  gitCommitSha?: string;
  gitPrUrl?: string;
  gitPrNumber?: number;
  vercelDeploymentId?: string;
  vercelDeploymentUrl?: string;
}): Promise<Deployment> {
  const supabase = getSupabase();

  // If deploying to production, store current production deployment for rollback
  let rollbackDeploymentId: string | null = null;
  if (params.environment === "production" && isVercelConfigured()) {
    try {
      const projectId = process.env.VERCEL_PROJECT_ID;
      if (projectId) {
        const currentProd = await getCurrentProductionDeployment(projectId);
        if (currentProd) {
          rollbackDeploymentId = currentProd.uid as string;
        }
      }
    } catch (err) {
      console.warn("Could not fetch current production deployment for rollback reference:", err);
    }
  }

  const { data, error } = await supabase
    .from("deployments")
    .insert({
      organization_id: params.organizationId,
      request_id: params.requestId || null,
      approval_id: params.approvalId || null,
      environment: params.environment,
      git_branch: params.gitBranch || null,
      git_commit_sha: params.gitCommitSha || null,
      git_pr_url: params.gitPrUrl || null,
      git_pr_number: params.gitPrNumber || null,
      vercel_deployment_id: params.vercelDeploymentId || null,
      vercel_deployment_url: params.vercelDeploymentUrl || null,
      vercel_project_id: process.env.VERCEL_PROJECT_ID || null,
      rollback_deployment_id: rollbackDeploymentId,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create deployment record: ${error?.message}`);
  }

  return data as Deployment;
}

/** Update deployment status */
export async function updateDeploymentStatus(
  id: string,
  status: DeployStatus,
  details?: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabase();

  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (details) {
    // Merge details into metadata
    const { data: existing } = await supabase
      .from("deployments")
      .select("metadata")
      .eq("id", id)
      .single();

    update.metadata = {
      ...((existing?.metadata as Record<string, unknown>) || {}),
      ...details,
    };
  }

  const { error } = await supabase
    .from("deployments")
    .update(update)
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update deployment status: ${error.message}`);
  }
}

/** Record QA result */
export async function updateQAStatus(
  id: string,
  qaStatus: QAStatus,
  notes?: string
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from("deployments")
    .update({
      qa_status: qaStatus,
      qa_notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update QA status: ${error.message}`);
  }
}

/** Record client approval */
export async function approveDeployment(
  id: string,
  approvedBy: string
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from("deployments")
    .update({
      client_approved: true,
      client_approved_at: new Date().toISOString(),
      client_approved_by: approvedBy,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to approve deployment: ${error.message}`);
  }
}

/** Promote staging to production (checks all gates) */
export async function promoteToProductionDeployment(
  deploymentId: string
): Promise<{
  success: boolean;
  error?: string;
  deployment?: Deployment;
}> {
  const supabase = getSupabase();

  // Fetch the staging deployment
  const { data: staging, error: fetchError } = await supabase
    .from("deployments")
    .select("*")
    .eq("id", deploymentId)
    .single();

  if (fetchError || !staging) {
    return { success: false, error: "Deployment not found" };
  }

  const deployment = staging as Deployment;

  // Gate checks
  if (deployment.environment !== "staging") {
    return { success: false, error: "Only staging deployments can be promoted to production" };
  }

  if (deployment.status !== "ready" && deployment.status !== "deployed") {
    return { success: false, error: "Deployment must be in 'ready' or 'deployed' status to promote" };
  }

  if (deployment.qa_status !== "passed" && deployment.qa_status !== "skipped") {
    return { success: false, error: "QA must pass or be skipped before promoting to production" };
  }

  // Check if client approval is required (if there's an associated approval with high risk)
  if (deployment.approval_id) {
    const { data: approval } = await supabase
      .from("approvals")
      .select("risk_level, decision")
      .eq("id", deployment.approval_id)
      .single();

    if (approval) {
      if (approval.decision !== "approved") {
        return { success: false, error: "Approval must be granted before promoting to production" };
      }
    }
  }

  if (deployment.client_approved === false) {
    return { success: false, error: "Client approval is required before promoting to production" };
  }

  // Promote via Vercel API
  if (isVercelConfigured() && deployment.vercel_deployment_id) {
    try {
      await vercelPromote(deployment.vercel_deployment_id);
    } catch (err) {
      console.error("Vercel promotion failed:", err);
      return { success: false, error: `Vercel promotion failed: ${err instanceof Error ? err.message : String(err)}` };
    }
  } else if (!isVercelConfigured()) {
    console.warn("VERCEL_API_TOKEN not configured — skipping Vercel promotion");
  }

  // Create production deployment record
  const prodRecord = await createDeploymentRecord({
    organizationId: deployment.organization_id,
    requestId: deployment.request_id || undefined,
    approvalId: deployment.approval_id || undefined,
    environment: "production",
    gitBranch: deployment.git_branch || undefined,
    gitCommitSha: deployment.git_commit_sha || undefined,
    gitPrUrl: deployment.git_pr_url || undefined,
    gitPrNumber: deployment.git_pr_number || undefined,
    vercelDeploymentId: deployment.vercel_deployment_id || undefined,
    vercelDeploymentUrl: deployment.vercel_deployment_url || undefined,
  });

  // Mark production record as deployed
  await updateDeploymentStatus(prodRecord.id, "deployed");

  // Mark staging as deployed (promoted)
  await updateDeploymentStatus(deployment.id, "deployed", {
    promoted_to_production: prodRecord.id,
  });

  return { success: true, deployment: { ...prodRecord, status: "deployed" } };
}

/** Rollback a production deployment */
export async function rollbackDeployment(
  deploymentId: string,
  rolledBackBy: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = getSupabase();

  const { data: deployment, error: fetchError } = await supabase
    .from("deployments")
    .select("*")
    .eq("id", deploymentId)
    .single();

  if (fetchError || !deployment) {
    return { success: false, error: "Deployment not found" };
  }

  if (deployment.environment !== "production") {
    return { success: false, error: "Only production deployments can be rolled back" };
  }

  if (!deployment.rollback_available) {
    return { success: false, error: "Rollback is not available for this deployment" };
  }

  if (!deployment.rollback_deployment_id) {
    return { success: false, error: "No rollback deployment reference found" };
  }

  // Rollback via Vercel API
  if (isVercelConfigured()) {
    try {
      await vercelRollback(deployment.rollback_deployment_id);
    } catch (err) {
      console.error("Vercel rollback failed:", err);
      return { success: false, error: `Vercel rollback failed: ${err instanceof Error ? err.message : String(err)}` };
    }
  } else {
    console.warn("VERCEL_API_TOKEN not configured — skipping Vercel rollback");
  }

  // Update deployment status
  const { error: updateError } = await supabase
    .from("deployments")
    .update({
      status: "rolled_back",
      rolled_back_at: new Date().toISOString(),
      rolled_back_by: rolledBackBy,
      rollback_available: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deploymentId);

  if (updateError) {
    return { success: false, error: `Failed to update deployment: ${updateError.message}` };
  }

  // Log activity
  if (deployment.request_id) {
    await supabase.from("activity_log").insert({
      request_id: deployment.request_id,
      organization_id: deployment.organization_id,
      actor_id: rolledBackBy,
      action: "deployment_rolled_back",
      details: {
        deployment_id: deploymentId,
        rollback_to: deployment.rollback_deployment_id,
      },
    });
  }

  return { success: true };
}

/** Get deployments with filters */
export async function getDeployments(params: {
  requestId?: string;
  orgId?: string;
  environment?: DeployEnvironment;
  status?: DeployStatus;
  limit?: number;
}): Promise<Deployment[]> {
  const supabase = getSupabase();

  let query = supabase
    .from("deployments")
    .select("*")
    .order("created_at", { ascending: false });

  if (params.requestId) query = query.eq("request_id", params.requestId);
  if (params.orgId) query = query.eq("organization_id", params.orgId);
  if (params.environment) query = query.eq("environment", params.environment);
  if (params.status) query = query.eq("status", params.status);
  if (params.limit) query = query.limit(params.limit);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch deployments: ${error.message}`);
  }

  return (data || []) as Deployment[];
}

/** Get the deploy pipeline status for a request */
export async function getDeployPipeline(requestId: string): Promise<{
  preview: Deployment | null;
  staging: Deployment | null;
  production: Deployment | null;
}> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("deployments")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch deploy pipeline: ${error.message}`);
  }

  const deployments = (data || []) as Deployment[];

  // Get the latest deployment for each environment
  const preview = deployments.find((d) => d.environment === "preview") || null;
  const staging = deployments.find((d) => d.environment === "staging") || null;
  const production = deployments.find((d) => d.environment === "production") || null;

  return { preview, staging, production };
}
