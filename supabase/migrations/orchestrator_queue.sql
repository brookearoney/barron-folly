-- The orchestrator queue manages task execution
CREATE TABLE orchestrator_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
  linear_issue_id TEXT,
  linear_issue_key TEXT,

  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- maps to RequestCategory

  -- Queue management
  tier TEXT NOT NULL DEFAULT 'copper', -- org tier at time of queue
  priority INTEGER NOT NULL DEFAULT 50, -- 0-100, higher = more urgent
  sla_deadline TIMESTAMPTZ, -- when this must be completed by

  -- Assignment
  agent_group TEXT, -- 'research', 'content', 'frontend', 'integration', 'data', 'infra', 'security', 'qa', 'ops'
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'assigned', 'running', 'blocked', 'completed', 'failed', 'cancelled')),
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  blocked_at TIMESTAMPTZ,
  blocked_reason TEXT,

  -- Execution
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  result_summary TEXT,
  result_artifacts JSONB DEFAULT '{}', -- { pr_url, staging_url, etc. }

  -- Approval gate
  requires_approval BOOLEAN DEFAULT false,
  approval_id UUID, -- links to approvals table
  approved BOOLEAN,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orch_queue_org ON orchestrator_queue(organization_id);
CREATE INDEX idx_orch_queue_status ON orchestrator_queue(status);
CREATE INDEX idx_orch_queue_priority ON orchestrator_queue(priority DESC);
CREATE INDEX idx_orch_queue_tier ON orchestrator_queue(tier);
CREATE INDEX idx_orch_queue_agent ON orchestrator_queue(agent_group);
CREATE INDEX idx_orch_queue_created ON orchestrator_queue(created_at DESC);

-- Concurrency tracking view
CREATE VIEW orchestrator_active_tasks AS
SELECT
  organization_id,
  COUNT(*) as active_count,
  COUNT(*) FILTER (WHERE status = 'running') as running_count,
  COUNT(*) FILTER (WHERE status = 'blocked') as blocked_count
FROM orchestrator_queue
WHERE status IN ('assigned', 'running', 'blocked')
GROUP BY organization_id;
