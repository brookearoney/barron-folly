"use client";

import { useState, useCallback } from "react";
import type { Deployment, DeployEnvironment, DeployStatus, QAStatus } from "@/lib/console/types";

interface DeploymentPipelineProps {
  requestId: string;
  pipeline: {
    preview: Deployment | null;
    staging: Deployment | null;
    production: Deployment | null;
  };
  onRefresh?: () => void;
}

const STATUS_COLORS: Record<DeployStatus, string> = {
  pending: "bg-gray-100 text-gray-700",
  building: "bg-yellow-100 text-yellow-800",
  ready: "bg-blue-100 text-blue-800",
  deployed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  rolled_back: "bg-orange-100 text-orange-800",
};

const STATUS_LABELS: Record<DeployStatus, string> = {
  pending: "Pending",
  building: "Building",
  ready: "Ready",
  deployed: "Deployed",
  failed: "Failed",
  rolled_back: "Rolled Back",
};

const QA_COLORS: Record<QAStatus, string> = {
  pending: "bg-gray-100 text-gray-600",
  passed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  skipped: "bg-gray-100 text-gray-500",
};

const QA_LABELS: Record<QAStatus, string> = {
  pending: "QA Pending",
  passed: "QA Passed",
  failed: "QA Failed",
  skipped: "QA Skipped",
};

const ENV_LABELS: Record<DeployEnvironment, string> = {
  preview: "Preview",
  staging: "Staging",
  production: "Production",
};

function StageCard({
  environment,
  deployment,
  isPromotable,
  isRollbackable,
  onPromote,
  onRollback,
  isLoading,
}: {
  environment: DeployEnvironment;
  deployment: Deployment | null;
  isPromotable: boolean;
  isRollbackable: boolean;
  onPromote: () => void;
  onRollback: () => void;
  isLoading: boolean;
}) {
  const isEmpty = !deployment;

  return (
    <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4 min-w-[200px]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">
          {ENV_LABELS[environment]}
        </h4>
        {deployment && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[deployment.status]}`}
          >
            {STATUS_LABELS[deployment.status]}
          </span>
        )}
      </div>

      {isEmpty ? (
        <p className="text-sm text-gray-400">No deployment</p>
      ) : (
        <div className="space-y-2">
          {/* Deployment URL */}
          {deployment.vercel_deployment_url && (
            <a
              href={deployment.vercel_deployment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline break-all block"
            >
              {deployment.vercel_deployment_url}
            </a>
          )}

          {/* Timestamp */}
          <p className="text-xs text-gray-500">
            {new Date(deployment.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          {/* Git info */}
          {deployment.git_branch && (
            <p className="text-xs text-gray-500">
              Branch: <span className="font-mono">{deployment.git_branch}</span>
            </p>
          )}

          {/* QA Status (staging) */}
          {environment === "staging" && (
            <div className="pt-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${QA_COLORS[deployment.qa_status]}`}
              >
                {QA_LABELS[deployment.qa_status]}
              </span>
            </div>
          )}

          {/* Client Approval */}
          {environment === "staging" && deployment.client_approved !== null && (
            <div className="pt-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  deployment.client_approved
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {deployment.client_approved ? "Client Approved" : "Awaiting Client Approval"}
              </span>
            </div>
          )}

          {/* Rollback info */}
          {environment === "production" && deployment.status === "rolled_back" && deployment.rolled_back_at && (
            <p className="text-xs text-orange-600">
              Rolled back{" "}
              {new Date(deployment.rolled_back_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        {isPromotable && (
          <button
            onClick={onPromote}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Promoting..." : "Promote to Production"}
          </button>
        )}
        {isRollbackable && (
          <button
            onClick={onRollback}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Rolling back..." : "Rollback"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function DeploymentPipeline({
  requestId,
  pipeline,
  onRefresh,
}: DeploymentPipelineProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRollback, setConfirmRollback] = useState(false);

  const { preview, staging, production } = pipeline;

  // Determine if staging can be promoted
  const canPromote =
    staging &&
    (staging.status === "ready" || staging.status === "deployed") &&
    (staging.qa_status === "passed" || staging.qa_status === "skipped") &&
    staging.client_approved !== false;

  // Determine if production can be rolled back
  const canRollback =
    production &&
    production.environment === "production" &&
    production.status === "deployed" &&
    production.rollback_available &&
    production.rollback_deployment_id;

  const handlePromote = useCallback(async () => {
    if (!staging) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/console/deployments/${staging.id}/promote`,
        { method: "POST" }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Promotion failed");
        return;
      }

      onRefresh?.();
    } catch {
      setError("Failed to promote deployment");
    } finally {
      setIsLoading(false);
    }
  }, [staging, onRefresh]);

  const handleRollback = useCallback(async () => {
    if (!production || !confirmRollback) {
      setConfirmRollback(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/console/deployments/${production.id}/rollback`,
        { method: "POST" }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Rollback failed");
        return;
      }

      setConfirmRollback(false);
      onRefresh?.();
    } catch {
      setError("Failed to rollback deployment");
    } finally {
      setIsLoading(false);
    }
  }, [production, confirmRollback, onRefresh]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Deployment Pipeline
        </h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Refresh
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Pipeline visualization */}
      <div className="flex items-stretch gap-2">
        <StageCard
          environment="preview"
          deployment={preview}
          isPromotable={false}
          isRollbackable={false}
          onPromote={() => {}}
          onRollback={() => {}}
          isLoading={isLoading}
        />

        {/* Arrow */}
        <div className="flex items-center text-gray-300 text-lg font-bold px-1 self-center">
          &rarr;
        </div>

        <StageCard
          environment="staging"
          deployment={staging}
          isPromotable={!!canPromote}
          isRollbackable={false}
          onPromote={handlePromote}
          onRollback={() => {}}
          isLoading={isLoading}
        />

        {/* Arrow */}
        <div className="flex items-center text-gray-300 text-lg font-bold px-1 self-center">
          &rarr;
        </div>

        <StageCard
          environment="production"
          deployment={production}
          isPromotable={false}
          isRollbackable={!!canRollback}
          onPromote={() => {}}
          onRollback={handleRollback}
          isLoading={isLoading}
        />
      </div>

      {/* Rollback confirmation dialog */}
      {confirmRollback && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-medium text-red-800 mb-2">
            Are you sure you want to rollback this production deployment?
          </p>
          <p className="text-xs text-red-600 mb-3">
            This will redeploy the previous production version. The current
            deployment will be marked as rolled back.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRollback}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Rolling back..." : "Confirm Rollback"}
            </button>
            <button
              onClick={() => setConfirmRollback(false)}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
