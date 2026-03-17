-- ─── Artifacts Table ─────────────────────────────────────────────────────────

CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
  task_id UUID,  -- references orchestrator_queue(id), no FK to avoid circular dep

  -- Versioning
  parent_artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,

  -- Classification
  type TEXT NOT NULL CHECK (type IN ('code', 'design', 'document', 'image', 'config', 'data', 'component')),
  format TEXT NOT NULL CHECK (format IN ('tsx', 'ts', 'css', 'html', 'json', 'md', 'svg', 'png', 'jpg', 'figma_url', 'pdf')),
  name TEXT NOT NULL,
  description TEXT,

  -- Content storage
  storage_path TEXT,          -- Supabase Storage path for binary files
  content_text TEXT,          -- Inline content for text-based artifacts
  content_hash TEXT,          -- SHA-256 for dedup and change detection
  file_size BIGINT,

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'rejected', 'published', 'archived')),

  -- Quality
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  quality_notes TEXT,

  -- Review
  review_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,

  -- Publishing
  published_url TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_artifacts_org ON artifacts(organization_id);
CREATE INDEX idx_artifacts_request ON artifacts(request_id);
CREATE INDEX idx_artifacts_task ON artifacts(task_id);
CREATE INDEX idx_artifacts_parent ON artifacts(parent_artifact_id);
CREATE INDEX idx_artifacts_status ON artifacts(status);
CREATE INDEX idx_artifacts_type ON artifacts(type);
CREATE INDEX idx_artifacts_created ON artifacts(created_at);
CREATE INDEX idx_artifacts_content_hash ON artifacts(content_hash);
CREATE INDEX idx_artifacts_org_status ON artifacts(organization_id, status);
CREATE INDEX idx_artifacts_org_type ON artifacts(organization_id, type);

-- ─── Artifact Diffs Table ───────────────────────────────────────────────────

CREATE TABLE artifact_diffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  previous_version INTEGER NOT NULL,
  new_version INTEGER NOT NULL,
  diff_type TEXT NOT NULL CHECK (diff_type IN ('created', 'modified', 'deleted')),
  changes_summary TEXT NOT NULL,
  diff_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artifact_diffs_artifact ON artifact_diffs(artifact_id);
CREATE INDEX idx_artifact_diffs_versions ON artifact_diffs(artifact_id, previous_version, new_version);

-- ─── RLS Policies ───────────────────────────────────────────────────────────

ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_diffs ENABLE ROW LEVEL SECURITY;

-- Artifacts: users can see their own org's artifacts
CREATE POLICY "Users can view own org artifacts"
  ON artifacts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Artifacts: users can insert for their own org
CREATE POLICY "Users can create own org artifacts"
  ON artifacts FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Artifacts: users can update their own org's artifacts
CREATE POLICY "Users can update own org artifacts"
  ON artifacts FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Artifact diffs: users can view diffs for their org's artifacts
CREATE POLICY "Users can view own org artifact diffs"
  ON artifact_diffs FOR SELECT
  USING (
    artifact_id IN (
      SELECT a.id FROM artifacts a
      JOIN profiles p ON a.organization_id = p.organization_id
      WHERE p.id = auth.uid()
    )
  );

-- Service role bypass (for admin client operations)
CREATE POLICY "Service role full access artifacts"
  ON artifacts FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access artifact_diffs"
  ON artifact_diffs FOR ALL
  USING (auth.role() = 'service_role');
