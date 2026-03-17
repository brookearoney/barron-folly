// ─── Artifact Type System (Phase 4.4) ────────────────────────────────────────

export type ArtifactType = 'code' | 'design' | 'document' | 'image' | 'config' | 'data' | 'component';
export type ArtifactStatus = 'draft' | 'in_review' | 'approved' | 'rejected' | 'published' | 'archived';
export type ArtifactFormat =
  | 'tsx'
  | 'ts'
  | 'css'
  | 'html'
  | 'json'
  | 'md'
  | 'svg'
  | 'png'
  | 'jpg'
  | 'figma_url'
  | 'pdf';

export interface Artifact {
  id: string;
  organization_id: string;
  request_id: string | null;
  task_id: string | null;
  parent_artifact_id: string | null;
  version: number;
  type: ArtifactType;
  format: ArtifactFormat;
  name: string;
  description: string | null;
  storage_path: string | null;
  content_text: string | null;
  content_hash: string | null;
  file_size: number | null;
  status: ArtifactStatus;
  quality_score: number | null;
  quality_notes: string | null;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  published_url: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArtifactDiff {
  id: string;
  artifact_id: string;
  previous_version: number;
  new_version: number;
  diff_type: 'created' | 'modified' | 'deleted';
  changes_summary: string;
  diff_content: string | null;
  created_at: string;
}

export interface QualityGateResult {
  passed: boolean;
  score: number;
  checks: QualityCheck[];
  blockers: string[];
  warnings: string[];
}

export interface QualityCheck {
  name: string;
  passed: boolean;
  score: number;
  details: string;
}

export interface DesignToken {
  name: string;
  value: string;
  type: 'color' | 'spacing' | 'typography' | 'shadow' | 'border' | 'radius';
  category: string;
}
