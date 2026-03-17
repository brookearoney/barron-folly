const VERCEL_API = "https://api.vercel.com";

async function vercelRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) throw new Error("VERCEL_API_TOKEN not configured");

  const res = await fetch(`${VERCEL_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Vercel API error: ${res.status} ${body}`);
  }
  return res.json();
}

/** Get deployment details by ID */
export async function getDeployment(
  deploymentId: string
): Promise<Record<string, unknown>> {
  return vercelRequest(`/v13/deployments/${deploymentId}`);
}

/** List deployments for a project */
export async function listDeployments(
  projectId: string,
  params?: { limit?: number; target?: string }
): Promise<Record<string, unknown>[]> {
  const searchParams = new URLSearchParams();
  searchParams.set("projectId", projectId);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.target) searchParams.set("target", params.target);

  const result = await vercelRequest<{
    deployments: Record<string, unknown>[];
  }>(`/v6/deployments?${searchParams.toString()}`);
  return result.deployments;
}

/** Get current production deployment (for rollback reference) */
export async function getCurrentProductionDeployment(
  projectId: string
): Promise<Record<string, unknown> | null> {
  const deployments = await listDeployments(projectId, {
    limit: 1,
    target: "production",
  });
  return deployments[0] || null;
}

/** Promote a deployment to production */
export async function promoteToProduction(
  deploymentId: string
): Promise<Record<string, unknown>> {
  // Vercel promotes by creating an alias or using the promote endpoint
  return vercelRequest(`/v10/deployments/${deploymentId}/promote`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/** Rollback: redeploy a previous deployment by creating a new deployment from it */
export async function rollbackTo(
  deploymentId: string
): Promise<Record<string, unknown>> {
  return vercelRequest(`/v10/deployments/${deploymentId}/rollback`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/** Check if Vercel API is configured */
export function isVercelConfigured(): boolean {
  return Boolean(process.env.VERCEL_API_TOKEN);
}
