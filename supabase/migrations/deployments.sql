CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
  approval_id UUID REFERENCES approvals(id) ON DELETE SET NULL,

  -- Vercel deployment info
  vercel_deployment_id TEXT,
  vercel_deployment_url TEXT,
  vercel_project_id TEXT,

  -- Git info
  git_branch TEXT,
  git_commit_sha TEXT,
  git_pr_url TEXT,
  git_pr_number INTEGER,

  -- Status tracking
  environment TEXT NOT NULL DEFAULT 'preview' CHECK (environment IN ('preview', 'staging', 'production')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'building', 'ready', 'deployed', 'failed', 'rolled_back')),

  -- Rollback
  rollback_deployment_id TEXT, -- vercel deployment to roll back to
  rollback_available BOOLEAN DEFAULT true,
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by UUID,

  -- QA
  qa_status TEXT DEFAULT 'pending' CHECK (qa_status IN ('pending', 'passed', 'failed', 'skipped')),
  qa_notes TEXT,

  -- Client approval
  client_approved BOOLEAN,
  client_approved_at TIMESTAMPTZ,
  client_approved_by UUID,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deployments_org ON deployments(organization_id);
CREATE INDEX idx_deployments_request ON deployments(request_id);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_env ON deployments(environment);
