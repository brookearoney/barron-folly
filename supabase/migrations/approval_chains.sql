-- Add multi-step approval support
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS step_number INTEGER DEFAULT 1;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS total_steps INTEGER DEFAULT 1;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS parent_approval_id UUID REFERENCES approvals(id);
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS approval_type TEXT DEFAULT 'standard' CHECK (approval_type IN ('standard', 'client_preview', 'architecture', 'production_deploy', 'revision'));
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS auto_approve_at TIMESTAMPTZ;

-- Revision requests create child tasks
CREATE TABLE revision_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by UUID,
  revision_notes TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  child_request_id UUID REFERENCES requests(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_revisions_approval ON revision_requests(approval_id);
CREATE INDEX idx_revisions_request ON revision_requests(request_id);
CREATE INDEX idx_revisions_org ON revision_requests(organization_id);
