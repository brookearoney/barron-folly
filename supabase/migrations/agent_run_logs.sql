CREATE TABLE agent_run_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
  flow TEXT NOT NULL, -- 'dossier', 'style_guide', 'clarify', 'construct', 'suggestions', 'scrape'
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed', 'failed', 'cancelled')),
  input_summary TEXT, -- truncated/hashed input description (never store full prompts for security)
  output_summary TEXT, -- brief summary of what was produced
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  linear_task_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_run_logs_org ON agent_run_logs(organization_id);
CREATE INDEX idx_run_logs_request ON agent_run_logs(request_id);
CREATE INDEX idx_run_logs_flow ON agent_run_logs(flow);
CREATE INDEX idx_run_logs_status ON agent_run_logs(status);
CREATE INDEX idx_run_logs_created ON agent_run_logs(created_at DESC);
