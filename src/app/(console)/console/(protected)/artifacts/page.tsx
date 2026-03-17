"use client";

import { useState, useEffect, useCallback } from "react";
import EmptyState from "@/components/console/EmptyState";
import type { Artifact, ArtifactType, ArtifactStatus, ArtifactFormat } from "@/lib/artifacts/types";

const TYPE_LABELS: Record<ArtifactType, string> = {
  code: "Code",
  design: "Design",
  document: "Document",
  image: "Image",
  config: "Config",
  data: "Data",
  component: "Component",
};

const STATUS_COLORS: Record<ArtifactStatus, string> = {
  draft: "bg-gray-500/20 text-gray-400",
  in_review: "bg-purple-500/20 text-purple-400",
  approved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
  published: "bg-blue-500/20 text-blue-400",
  archived: "bg-gray-500/10 text-gray-500",
};

const STATUS_LABELS: Record<ArtifactStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
  published: "Published",
  archived: "Archived",
};

const FORMAT_ICONS: Record<ArtifactFormat, string> = {
  tsx: "TSX",
  ts: "TS",
  css: "CSS",
  html: "HTML",
  json: "JSON",
  md: "MD",
  svg: "SVG",
  png: "PNG",
  jpg: "JPG",
  figma_url: "FIG",
  pdf: "PDF",
};

const ARTIFACT_TYPES: ArtifactType[] = [
  "code", "design", "document", "image", "config", "data", "component",
];

const ARTIFACT_STATUSES: ArtifactStatus[] = [
  "draft", "in_review", "approved", "rejected", "published", "archived",
];

type ViewMode = "list" | "detail";

export default function ArtifactsPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [versions, setVersions] = useState<Artifact[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const fetchArtifacts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/console/artifacts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setArtifacts(data.artifacts || []);
    } catch (err) {
      console.error("Failed to fetch artifacts:", err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    fetchArtifacts();
  }, [fetchArtifacts]);

  async function fetchVersions(artifactId: string) {
    try {
      const res = await fetch(`/api/console/artifacts/${artifactId}/versions`);
      if (!res.ok) throw new Error("Failed to fetch versions");
      const data = await res.json();
      setVersions(data.versions || []);
    } catch (err) {
      console.error("Failed to fetch versions:", err);
    }
  }

  function selectArtifact(artifact: Artifact) {
    setSelectedArtifact(artifact);
    setViewMode("detail");
    fetchVersions(artifact.id);
  }

  // Group artifacts by request
  const grouped = groupByRequest(artifacts);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Artifacts</h1>
          <p className="text-muted text-sm mt-1">
            Deliverables, code, and design assets
          </p>
        </div>
        {viewMode === "detail" && (
          <button
            onClick={() => { setViewMode("list"); setSelectedArtifact(null); }}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Back to list
          </button>
        )}
      </div>

      {viewMode === "list" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-dark border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg"
            >
              <option value="">All types</option>
              {ARTIFACT_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-dark border border-dark-border text-foreground text-sm px-3 py-2 rounded-lg"
            >
              <option value="">All statuses</option>
              {ARTIFACT_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>

            {(typeFilter || statusFilter) && (
              <button
                onClick={() => { setTypeFilter(""); setStatusFilter(""); }}
                className="text-orange text-sm hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {artifacts.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              }
              title="No artifacts yet"
              description="Artifacts will appear here as they are created during request fulfillment."
            />
          ) : (
            <div className="space-y-6">
              {grouped.map((group) => (
                <div key={group.key}>
                  <h2 className="text-foreground text-sm font-medium mb-3">
                    {group.label}
                  </h2>
                  <div className="space-y-2">
                    {group.artifacts.map((artifact) => (
                      <button
                        key={artifact.id}
                        onClick={() => selectArtifact(artifact)}
                        className="w-full text-left bg-dark rounded-lg border border-dark-border p-4 hover:border-orange/40 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-dark-border text-muted-light">
                              {FORMAT_ICONS[artifact.format]}
                            </span>
                            <span className="text-foreground text-sm font-medium">
                              {artifact.name}
                            </span>
                            <span className="text-muted text-xs">
                              v{artifact.version}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-border text-muted-light capitalize">
                              {TYPE_LABELS[artifact.type]}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_COLORS[artifact.status]}`}>
                              {STATUS_LABELS[artifact.status]}
                            </span>
                            {artifact.quality_score !== null && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                artifact.quality_score >= 80
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : artifact.quality_score >= 60
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}>
                                Q: {artifact.quality_score}
                              </span>
                            )}
                          </div>
                        </div>
                        {artifact.description && (
                          <p className="text-muted text-xs line-clamp-1">
                            {artifact.description}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {viewMode === "detail" && selectedArtifact && (
        <ArtifactDetail
          artifact={selectedArtifact}
          versions={versions}
          onRefresh={() => {
            fetchArtifacts();
            fetchVersions(selectedArtifact.id);
          }}
        />
      )}
    </div>
  );
}

// ─── Artifact Detail View ───────────────────────────────────────────────────

function ArtifactDetail({
  artifact,
  versions,
  onRefresh,
}: {
  artifact: Artifact;
  versions: Artifact[];
  onRefresh: () => void;
}) {
  const [showDiff, setShowDiff] = useState(false);

  const isTextArtifact = ["tsx", "ts", "css", "html", "json", "md", "svg", "figma_url"].includes(
    artifact.format
  );
  const isImageArtifact = ["png", "jpg"].includes(artifact.format);

  async function handleAction(action: string, notes?: string) {
    try {
      const res = await fetch(`/api/console/artifacts/${artifact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      if (!res.ok) throw new Error("Action failed");
      onRefresh();
    } catch (err) {
      console.error("Action error:", err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark rounded-lg border border-dark-border p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-2 py-1 rounded bg-dark-border text-muted-light">
              {FORMAT_ICONS[artifact.format]}
            </span>
            <div>
              <h2 className="text-foreground text-lg font-medium">{artifact.name}</h2>
              <p className="text-muted text-xs">
                Version {artifact.version} &middot; {TYPE_LABELS[artifact.type]} &middot; Created{" "}
                {new Date(artifact.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[artifact.status]}`}>
            {STATUS_LABELS[artifact.status]}
          </span>
        </div>

        {artifact.description && (
          <p className="text-muted text-sm mb-4">{artifact.description}</p>
        )}

        {/* Quality score */}
        {artifact.quality_score !== null && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-muted text-xs">Quality Score</span>
              <span className={`text-sm font-semibold ${
                artifact.quality_score >= 80
                  ? "text-emerald-400"
                  : artifact.quality_score >= 60
                  ? "text-amber-400"
                  : "text-red-400"
              }`}>
                {artifact.quality_score}/100
              </span>
            </div>
            <div className="w-full h-1.5 bg-dark-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  artifact.quality_score >= 80
                    ? "bg-emerald-500"
                    : artifact.quality_score >= 60
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${artifact.quality_score}%` }}
              />
            </div>
            {artifact.quality_notes && (
              <pre className="text-muted text-[10px] mt-2 whitespace-pre-wrap font-mono bg-dark-border/30 rounded p-2">
                {artifact.quality_notes}
              </pre>
            )}
          </div>
        )}

        {/* Review notes */}
        {artifact.review_notes && (
          <div className="bg-dark-border/30 rounded p-3 mb-4">
            <p className="text-muted text-xs mb-1">Review Notes</p>
            <p className="text-foreground text-sm">{artifact.review_notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {artifact.status === "draft" && (
            <>
              <button
                onClick={() => handleAction("run_quality_gates")}
                className="text-xs px-3 py-1.5 rounded-lg bg-dark-border text-foreground hover:bg-dark-border/70 transition-colors"
              >
                Run Quality Check
              </button>
              <button
                onClick={() => handleAction("submit_review")}
                className="text-xs px-3 py-1.5 rounded-lg bg-orange/10 text-orange hover:bg-orange/20 transition-colors"
              >
                Submit for Review
              </button>
            </>
          )}
          {artifact.published_url && (
            <a
              href={artifact.published_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              View Published
            </a>
          )}
        </div>
      </div>

      {/* Content preview */}
      {isTextArtifact && artifact.content_text && (
        <div className="bg-dark rounded-lg border border-dark-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-dark-border">
            <span className="text-muted text-xs">Content Preview</span>
            <span className="text-muted text-[10px]">
              {artifact.file_size ? formatBytes(artifact.file_size) : ""}
            </span>
          </div>
          <pre className="p-4 text-foreground text-xs font-mono overflow-x-auto max-h-[400px] overflow-y-auto whitespace-pre">
            {artifact.content_text}
          </pre>
        </div>
      )}

      {/* Image preview */}
      {isImageArtifact && artifact.published_url && (
        <div className="bg-dark rounded-lg border border-dark-border overflow-hidden">
          <div className="px-4 py-2 border-b border-dark-border">
            <span className="text-muted text-xs">Image Preview</span>
          </div>
          <div className="p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artifact.published_url}
              alt={artifact.name}
              className="max-w-full rounded"
            />
          </div>
        </div>
      )}

      {/* Figma link */}
      {artifact.format === "figma_url" && artifact.content_text && (
        <div className="bg-dark rounded-lg border border-dark-border p-4">
          <a
            href={artifact.content_text}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            Open in Figma
          </a>
        </div>
      )}

      {/* Version history */}
      {versions.length > 1 && (
        <div className="bg-dark rounded-lg border border-dark-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
            <span className="text-foreground text-sm font-medium">
              Version History ({versions.length})
            </span>
            {isTextArtifact && (
              <button
                onClick={() => setShowDiff(!showDiff)}
                className="text-xs text-muted hover:text-foreground transition-colors"
              >
                {showDiff ? "Hide Diff" : "Show Diff"}
              </button>
            )}
          </div>
          <div className="divide-y divide-dark-border">
            {versions.map((v) => (
              <div
                key={v.id}
                className={`px-4 py-3 ${v.id === artifact.id ? "bg-orange/5" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-sm font-medium">
                      v{v.version}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_COLORS[v.status]}`}>
                      {STATUS_LABELS[v.status]}
                    </span>
                    {v.id === artifact.id && (
                      <span className="text-[10px] text-orange">Current</span>
                    )}
                  </div>
                  <span className="text-muted text-xs">
                    {new Date(v.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

interface ArtifactGroup {
  key: string;
  label: string;
  artifacts: Artifact[];
}

function groupByRequest(artifacts: Artifact[]): ArtifactGroup[] {
  const groups = new Map<string, Artifact[]>();
  const noRequest: Artifact[] = [];

  for (const a of artifacts) {
    if (a.request_id) {
      if (!groups.has(a.request_id)) {
        groups.set(a.request_id, []);
      }
      groups.get(a.request_id)!.push(a);
    } else {
      noRequest.push(a);
    }
  }

  const result: ArtifactGroup[] = [];

  for (const [requestId, items] of groups) {
    result.push({
      key: requestId,
      label: `Request ${requestId.slice(0, 8)}`,
      artifacts: items,
    });
  }

  if (noRequest.length > 0) {
    result.push({
      key: "unlinked",
      label: "Standalone Artifacts",
      artifacts: noRequest,
    });
  }

  return result;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
