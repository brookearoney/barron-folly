import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createDeploymentRecord,
  updateDeploymentStatus,
} from "@/lib/console/deployments";
import type { NotificationType } from "@/lib/console/types";
import crypto from "crypto";

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.VERCEL_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac("sha1", secret);
  hmac.update(body);
  const digest = hmac.digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Extract request/org info from a deployment by matching git branch or PR metadata.
 * Branch naming convention: e.g. "req-<request_id>" or PR title containing request reference.
 */
async function matchDeploymentToRequest(
  supabase: ReturnType<typeof createAdminClient>,
  deploymentData: Record<string, unknown>
): Promise<{
  requestId: string | null;
  organizationId: string | null;
  approvalId: string | null;
}> {
  const gitBranch = (deploymentData.meta as Record<string, unknown>)?.githubCommitRef as string | undefined;
  const prNumber = (deploymentData.meta as Record<string, unknown>)?.githubPrId as number | undefined;

  // Try matching by git branch name pattern: "req-<uuid>"
  if (gitBranch) {
    const branchMatch = gitBranch.match(/req-([a-f0-9-]{36})/);
    if (branchMatch) {
      const requestId = branchMatch[1];
      const { data: request } = await supabase
        .from("requests")
        .select("id, organization_id")
        .eq("id", requestId)
        .single();

      if (request) {
        // Check for associated approval
        const { data: approval } = await supabase
          .from("approvals")
          .select("id")
          .eq("request_id", request.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return {
          requestId: request.id,
          organizationId: request.organization_id,
          approvalId: approval?.id || null,
        };
      }
    }
  }

  // Try matching existing deployment by PR number
  if (prNumber) {
    const { data: existing } = await supabase
      .from("deployments")
      .select("request_id, organization_id, approval_id")
      .eq("git_pr_number", prNumber)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      return {
        requestId: existing.request_id,
        organizationId: existing.organization_id,
        approvalId: existing.approval_id,
      };
    }
  }

  return { requestId: null, organizationId: null, approvalId: null };
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-vercel-signature");

    // Verify signature if secret is configured
    if (process.env.VERCEL_WEBHOOK_SECRET) {
      if (!verifySignature(rawBody, signature)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const { type, payload: deploymentData } = payload;

    if (!deploymentData) {
      return NextResponse.json({ ok: true, skipped: "no payload data" });
    }

    const supabase = createAdminClient();

    const vercelDeploymentId = deploymentData.id || deploymentData.uid;
    const vercelDeploymentUrl = deploymentData.url
      ? `https://${deploymentData.url}`
      : null;
    const meta = (deploymentData.meta || {}) as Record<string, unknown>;
    const gitBranch = (meta.githubCommitRef as string) || null;
    const gitCommitSha = (meta.githubCommitSha as string) || null;
    const gitPrNumber = (meta.githubPrId as number) || null;

    // Determine environment from Vercel target
    const target = deploymentData.target as string | undefined;
    const environment =
      target === "production"
        ? "production"
        : target === "staging"
          ? "staging"
          : "preview";

    // Match to request/org
    const match = await matchDeploymentToRequest(supabase, deploymentData);

    // Handle different event types
    if (type === "deployment.created" || type === "deployment") {
      // Check if we already have a record for this vercel deployment
      const { data: existing } = await supabase
        .from("deployments")
        .select("id")
        .eq("vercel_deployment_id", vercelDeploymentId)
        .single();

      if (existing) {
        await updateDeploymentStatus(existing.id, "building");
      } else if (match.organizationId) {
        await createDeploymentRecord({
          organizationId: match.organizationId,
          requestId: match.requestId || undefined,
          approvalId: match.approvalId || undefined,
          environment: environment as "preview" | "staging" | "production",
          gitBranch: gitBranch || undefined,
          gitCommitSha: gitCommitSha || undefined,
          gitPrNumber: gitPrNumber || undefined,
          vercelDeploymentId,
          vercelDeploymentUrl: vercelDeploymentUrl || undefined,
        });
      }
    } else if (type === "deployment.ready") {
      const { data: existing } = await supabase
        .from("deployments")
        .select("id, request_id, organization_id")
        .eq("vercel_deployment_id", vercelDeploymentId)
        .single();

      if (existing) {
        await updateDeploymentStatus(existing.id, "ready", {
          ready_at: new Date().toISOString(),
        });

        // Update URL if available
        if (vercelDeploymentUrl) {
          await supabase
            .from("deployments")
            .update({ vercel_deployment_url: vercelDeploymentUrl })
            .eq("id", existing.id);
        }

        // Create notification when staging is ready for review
        if (
          (environment === "staging" || environment === "preview") &&
          existing.organization_id
        ) {
          const notifType: NotificationType = "status_change";
          await supabase.from("notifications").insert({
            organization_id: existing.organization_id,
            type: notifType,
            title: `${environment === "staging" ? "Staging" : "Preview"} deployment ready for review`,
            body: vercelDeploymentUrl
              ? `Your deployment is live at ${vercelDeploymentUrl}`
              : "Your deployment is ready for review.",
            request_id: existing.request_id || null,
            reference_id: existing.id,
          });
        }
      }
    } else if (type === "deployment.error") {
      const { data: existing } = await supabase
        .from("deployments")
        .select("id")
        .eq("vercel_deployment_id", vercelDeploymentId)
        .single();

      if (existing) {
        await updateDeploymentStatus(existing.id, "failed", {
          error: deploymentData.error || "Deployment failed",
          failed_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Vercel webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
