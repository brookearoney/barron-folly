import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Artifact,
  ArtifactDiff,
  ArtifactType,
  ArtifactFormat,
  ArtifactStatus,
} from "./types";

// ─── Storage bucket name ────────────────────────────────────────────────────
const ARTIFACTS_BUCKET = "artifacts";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSupabase() {
  return createAdminClient();
}

/** Whether this format stores content inline (text) vs binary in Storage */
function isTextFormat(format: ArtifactFormat): boolean {
  return ["tsx", "ts", "css", "html", "json", "md", "svg", "figma_url"].includes(format);
}

/** Generate SHA-256 content hash */
async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Generate a storage path for a binary artifact */
function buildStoragePath(orgId: string, artifactId: string, name: string): string {
  const ext = name.split(".").pop() || "bin";
  return `${orgId}/${artifactId}.${ext}`;
}

// ─── Create Artifact ────────────────────────────────────────────────────────

export async function createArtifact(params: {
  orgId: string;
  requestId?: string;
  taskId?: string;
  type: ArtifactType;
  format: ArtifactFormat;
  name: string;
  description?: string;
  content?: string;
  file?: Buffer;
  metadata?: Record<string, unknown>;
  createdBy?: string;
}): Promise<Artifact> {
  const supabase = getSupabase();

  let contentText: string | null = null;
  let contentHash: string | null = null;
  let storagePath: string | null = null;
  let fileSize: number | null = null;

  // For text-based artifacts, store inline
  if (params.content && isTextFormat(params.format)) {
    contentText = params.content;
    contentHash = await hashContent(params.content);
    fileSize = new TextEncoder().encode(params.content).length;
  }

  // Generate a temp id for storage path (will be overwritten by actual id)
  const tempId = crypto.randomUUID();

  // For binary artifacts, upload to Supabase Storage
  if (params.file) {
    storagePath = buildStoragePath(params.orgId, tempId, params.name);
    const { error: uploadError } = await supabase.storage
      .from(ARTIFACTS_BUCKET)
      .upload(storagePath, params.file, {
        contentType: getMimeType(params.format),
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload artifact file: ${uploadError.message}`);
    }

    fileSize = params.file.length;
    // Hash the binary content
    const hashBuffer = await crypto.subtle.digest("SHA-256", new Uint8Array(params.file));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    contentHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  const { data, error } = await supabase
    .from("artifacts")
    .insert({
      organization_id: params.orgId,
      request_id: params.requestId || null,
      task_id: params.taskId || null,
      parent_artifact_id: null,
      version: 1,
      type: params.type,
      format: params.format,
      name: params.name,
      description: params.description || null,
      storage_path: storagePath,
      content_text: contentText,
      content_hash: contentHash,
      file_size: fileSize,
      status: "draft" as ArtifactStatus,
      metadata: params.metadata || {},
      created_by: params.createdBy || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create artifact: ${error?.message}`);
  }

  const artifact = data as Artifact;

  // If binary was uploaded with temp id, rename the storage path with real id
  if (params.file && storagePath) {
    const realPath = buildStoragePath(params.orgId, artifact.id, params.name);
    if (realPath !== storagePath) {
      await supabase.storage.from(ARTIFACTS_BUCKET).move(storagePath, realPath);
      await supabase
        .from("artifacts")
        .update({ storage_path: realPath })
        .eq("id", artifact.id);
      artifact.storage_path = realPath;
    }
  }

  // Create initial diff record
  await supabase.from("artifact_diffs").insert({
    artifact_id: artifact.id,
    previous_version: 0,
    new_version: 1,
    diff_type: "created",
    changes_summary: `Created ${params.type} artifact: ${params.name}`,
    diff_content: null,
  });

  return artifact;
}

// ─── Create Version ─────────────────────────────────────────────────────────

export async function createArtifactVersion(
  artifactId: string,
  params: {
    content?: string;
    file?: Buffer;
    changes_summary: string;
    metadata?: Record<string, unknown>;
  }
): Promise<Artifact> {
  const supabase = getSupabase();

  // Get the current artifact
  const { data: current, error: fetchError } = await supabase
    .from("artifacts")
    .select("*")
    .eq("id", artifactId)
    .single();

  if (fetchError || !current) {
    throw new Error(`Artifact not found: ${artifactId}`);
  }

  const parent = current as Artifact;
  const newVersion = parent.version + 1;

  let contentText: string | null = null;
  let contentHash: string | null = null;
  let storagePath: string | null = null;
  let fileSize: number | null = null;
  let diffContent: string | null = null;

  if (params.content && isTextFormat(parent.format)) {
    contentText = params.content;
    contentHash = await hashContent(params.content);
    fileSize = new TextEncoder().encode(params.content).length;

    // Generate simple text diff for code artifacts
    if (parent.content_text) {
      diffContent = generateSimpleDiff(parent.content_text, params.content);
    }
  }

  if (params.file) {
    const newId = crypto.randomUUID();
    storagePath = buildStoragePath(parent.organization_id, newId, parent.name);
    const { error: uploadError } = await supabase.storage
      .from(ARTIFACTS_BUCKET)
      .upload(storagePath, params.file, {
        contentType: getMimeType(parent.format),
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload artifact version: ${uploadError.message}`);
    }

    fileSize = params.file.length;
    const hashBuffer = await crypto.subtle.digest("SHA-256", new Uint8Array(params.file));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    contentHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Create new version row
  const { data: newArtifact, error: insertError } = await supabase
    .from("artifacts")
    .insert({
      organization_id: parent.organization_id,
      request_id: parent.request_id,
      task_id: parent.task_id,
      parent_artifact_id: getRoot(parent),
      version: newVersion,
      type: parent.type,
      format: parent.format,
      name: parent.name,
      description: parent.description,
      storage_path: storagePath || parent.storage_path,
      content_text: contentText ?? parent.content_text,
      content_hash: contentHash ?? parent.content_hash,
      file_size: fileSize ?? parent.file_size,
      status: "draft" as ArtifactStatus,
      metadata: { ...(parent.metadata || {}), ...(params.metadata || {}) },
      created_by: parent.created_by,
    })
    .select("*")
    .single();

  if (insertError || !newArtifact) {
    throw new Error(`Failed to create artifact version: ${insertError?.message}`);
  }

  // Create diff record
  await supabase.from("artifact_diffs").insert({
    artifact_id: (newArtifact as Artifact).id,
    previous_version: parent.version,
    new_version: newVersion,
    diff_type: "modified",
    changes_summary: params.changes_summary,
    diff_content: diffContent,
  });

  return newArtifact as Artifact;
}

// ─── Read Operations ────────────────────────────────────────────────────────

export async function getArtifact(artifactId: string): Promise<Artifact | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("id", artifactId)
    .single();

  if (error) return null;
  return data as Artifact;
}

export async function getArtifactVersions(artifactId: string): Promise<Artifact[]> {
  const supabase = getSupabase();

  // Get the root artifact id
  const artifact = await getArtifact(artifactId);
  if (!artifact) return [];

  const rootId = artifact.parent_artifact_id || artifact.id;

  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .or(`id.eq.${rootId},parent_artifact_id.eq.${rootId}`)
    .order("version", { ascending: true });

  if (error) return [];
  return (data || []) as Artifact[];
}

export async function getArtifactsByRequest(requestId: string): Promise<Artifact[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data || []) as Artifact[];
}

export async function getArtifactsByTask(taskId: string): Promise<Artifact[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data || []) as Artifact[];
}

export async function getArtifactsByOrg(
  orgId: string,
  filters?: { type?: ArtifactType; status?: ArtifactStatus; limit?: number }
): Promise<Artifact[]> {
  const supabase = getSupabase();

  let query = supabase
    .from("artifacts")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (filters?.type) query = query.eq("type", filters.type);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) return [];
  return (data || []) as Artifact[];
}

// ─── Status Transitions ────────────────────────────────────────────────────

export async function submitForReview(artifactId: string): Promise<Artifact> {
  return updateStatus(artifactId, "in_review");
}

export async function approveArtifact(
  artifactId: string,
  reviewedBy: string,
  notes?: string
): Promise<Artifact> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("artifacts")
    .update({
      status: "approved" as ArtifactStatus,
      reviewed_by: reviewedBy,
      reviewed_at: now,
      review_notes: notes || null,
      updated_at: now,
    })
    .eq("id", artifactId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to approve artifact: ${error?.message}`);
  }

  return data as Artifact;
}

export async function rejectArtifact(
  artifactId: string,
  reviewedBy: string,
  notes: string
): Promise<Artifact> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("artifacts")
    .update({
      status: "rejected" as ArtifactStatus,
      reviewed_by: reviewedBy,
      reviewed_at: now,
      review_notes: notes,
      updated_at: now,
    })
    .eq("id", artifactId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to reject artifact: ${error?.message}`);
  }

  return data as Artifact;
}

export async function publishArtifact(
  artifactId: string,
  publishedUrl: string
): Promise<Artifact> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("artifacts")
    .update({
      status: "published" as ArtifactStatus,
      published_url: publishedUrl,
      updated_at: now,
    })
    .eq("id", artifactId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to publish artifact: ${error?.message}`);
  }

  return data as Artifact;
}

export async function archiveArtifact(artifactId: string): Promise<Artifact> {
  return updateStatus(artifactId, "archived");
}

async function updateStatus(artifactId: string, status: ArtifactStatus): Promise<Artifact> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("artifacts")
    .update({ status, updated_at: now })
    .eq("id", artifactId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update artifact status: ${error?.message}`);
  }

  return data as Artifact;
}

// ─── Diff ───────────────────────────────────────────────────────────────────

export async function diffArtifacts(
  oldVersionId: string,
  newVersionId: string
): Promise<ArtifactDiff> {
  const supabase = getSupabase();

  const [oldArtifact, newArtifact] = await Promise.all([
    getArtifact(oldVersionId),
    getArtifact(newVersionId),
  ]);

  if (!oldArtifact || !newArtifact) {
    throw new Error("One or both artifact versions not found");
  }

  let diffContent: string | null = null;
  if (oldArtifact.content_text && newArtifact.content_text) {
    diffContent = generateSimpleDiff(oldArtifact.content_text, newArtifact.content_text);
  }

  const diffType =
    oldArtifact.content_hash === newArtifact.content_hash ? "modified" : "modified";

  // Check if a diff record already exists
  const { data: existing } = await supabase
    .from("artifact_diffs")
    .select("*")
    .eq("artifact_id", newVersionId)
    .eq("previous_version", oldArtifact.version)
    .eq("new_version", newArtifact.version)
    .maybeSingle();

  if (existing) {
    return existing as ArtifactDiff;
  }

  // Create diff record
  const { data, error } = await supabase
    .from("artifact_diffs")
    .insert({
      artifact_id: newVersionId,
      previous_version: oldArtifact.version,
      new_version: newArtifact.version,
      diff_type: diffType,
      changes_summary: `Changes from v${oldArtifact.version} to v${newArtifact.version}`,
      diff_content: diffContent,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create diff: ${error?.message}`);
  }

  return data as ArtifactDiff;
}

// ─── Internal Utilities ─────────────────────────────────────────────────────

function getRoot(artifact: Artifact): string {
  return artifact.parent_artifact_id || artifact.id;
}

function getMimeType(format: ArtifactFormat): string {
  const mimeMap: Record<ArtifactFormat, string> = {
    tsx: "text/plain",
    ts: "text/plain",
    css: "text/css",
    html: "text/html",
    json: "application/json",
    md: "text/markdown",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    figma_url: "text/plain",
    pdf: "application/pdf",
  };
  return mimeMap[format] || "application/octet-stream";
}

/**
 * Generate a simple line-by-line diff for text content.
 * Returns a unified-diff-style string showing added/removed lines.
 */
function generateSimpleDiff(oldText: string, newText: string): string {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const diff: string[] = [];

  const maxLen = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLen; i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : undefined;
    const newLine = i < newLines.length ? newLines[i] : undefined;

    if (oldLine === newLine) {
      diff.push(` ${oldLine}`);
    } else {
      if (oldLine !== undefined) {
        diff.push(`-${oldLine}`);
      }
      if (newLine !== undefined) {
        diff.push(`+${newLine}`);
      }
    }
  }

  return diff.join("\n");
}
