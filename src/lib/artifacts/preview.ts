import { createAdminClient } from "@/lib/supabase/admin";
import { getDeployments } from "@/lib/console/deployments";
import type { Artifact } from "./types";
import { getArtifact } from "./manager";

// ─── Request Artifact Preview ───────────────────────────────────────────────

/**
 * Request a preview URL for a code/component artifact.
 * Checks if the artifact is already linked to a deployment;
 * otherwise returns a pending status.
 */
export async function requestArtifactPreview(artifactId: string): Promise<{
  previewUrl: string | null;
  deploymentId: string | null;
  status: "pending" | "building" | "ready" | "failed";
}> {
  const supabase = createAdminClient();

  const artifact = await getArtifact(artifactId);
  if (!artifact) {
    throw new Error(`Artifact not found: ${artifactId}`);
  }

  // If the artifact already has a published_url, return it
  if (artifact.published_url) {
    return {
      previewUrl: artifact.published_url,
      deploymentId: null,
      status: "ready",
    };
  }

  // Check if there is a linked deployment via metadata
  const linkedDeploymentId = artifact.metadata?.deployment_id as string | undefined;

  if (linkedDeploymentId) {
    // Fetch the deployment to check status
    const { data: deployment } = await supabase
      .from("deployments")
      .select("*")
      .eq("id", linkedDeploymentId)
      .single();

    if (deployment) {
      const depStatus = deployment.status as string;
      const statusMap: Record<string, "pending" | "building" | "ready" | "failed"> = {
        pending: "pending",
        building: "building",
        ready: "ready",
        deployed: "ready",
        failed: "failed",
        rolled_back: "failed",
      };

      return {
        previewUrl: deployment.vercel_deployment_url || null,
        deploymentId: deployment.id,
        status: statusMap[depStatus] || "pending",
      };
    }
  }

  // Check if there is a deployment for the same request
  if (artifact.request_id) {
    const deployments = await getDeployments({
      requestId: artifact.request_id,
      environment: "preview",
      limit: 1,
    });

    if (deployments.length > 0) {
      const dep = deployments[0];
      const statusMap: Record<string, "pending" | "building" | "ready" | "failed"> = {
        pending: "pending",
        building: "building",
        ready: "ready",
        deployed: "ready",
        failed: "failed",
        rolled_back: "failed",
      };

      return {
        previewUrl: dep.vercel_deployment_url || null,
        deploymentId: dep.id,
        status: statusMap[dep.status] || "pending",
      };
    }
  }

  // No deployment found
  return {
    previewUrl: null,
    deploymentId: null,
    status: "pending",
  };
}

// ─── Link Artifact to Deployment ────────────────────────────────────────────

/**
 * Link an artifact to a deployment and store the preview URL.
 */
export async function linkArtifactToDeployment(
  artifactId: string,
  deploymentId: string,
  previewUrl: string
): Promise<void> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Update artifact metadata with deployment link
  const { data: existing } = await supabase
    .from("artifacts")
    .select("metadata")
    .eq("id", artifactId)
    .single();

  const currentMetadata = (existing?.metadata as Record<string, unknown>) || {};

  const { error } = await supabase
    .from("artifacts")
    .update({
      published_url: previewUrl,
      metadata: {
        ...currentMetadata,
        deployment_id: deploymentId,
        deployment_linked_at: now,
      },
      updated_at: now,
    })
    .eq("id", artifactId);

  if (error) {
    throw new Error(`Failed to link artifact to deployment: ${error.message}`);
  }
}

// ─── Get Deployment Artifacts ───────────────────────────────────────────────

/**
 * Get all artifacts linked to a specific deployment.
 */
export async function getDeploymentArtifacts(deploymentId: string): Promise<Artifact[]> {
  const supabase = createAdminClient();

  // First try to find artifacts linked via metadata
  const { data: metaLinked } = await supabase
    .from("artifacts")
    .select("*")
    .contains("metadata", { deployment_id: deploymentId })
    .order("created_at", { ascending: false });

  if (metaLinked && metaLinked.length > 0) {
    return metaLinked as Artifact[];
  }

  // Fallback: find artifacts for the same request as the deployment
  const { data: deployment } = await supabase
    .from("deployments")
    .select("request_id")
    .eq("id", deploymentId)
    .single();

  if (!deployment?.request_id) return [];

  const { data: requestLinked } = await supabase
    .from("artifacts")
    .select("*")
    .eq("request_id", deployment.request_id)
    .order("created_at", { ascending: false });

  return (requestLinked || []) as Artifact[];
}
