-- Tool executions table: tracks every tool run by the agent system
CREATE TABLE tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tool_id TEXT NOT NULL,
  agent_group TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  tier TEXT NOT NULL,
  trace_id TEXT NOT NULL,

  -- Execution tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'denied')),
  input_params JSONB DEFAULT '{}',
  output JSONB,
  duration_ms INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  error TEXT,
  requires_escalation BOOLEAN DEFAULT false,

  -- Sandbox
  sandbox_config JSONB,
  attempt_number INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for common query patterns
CREATE INDEX idx_tool_exec_org ON tool_executions(organization_id);
CREATE INDEX idx_tool_exec_task ON tool_executions(task_id);
CREATE INDEX idx_tool_exec_tool ON tool_executions(tool_id);
CREATE INDEX idx_tool_exec_status ON tool_executions(status);
CREATE INDEX idx_tool_exec_agent ON tool_executions(agent_group);
CREATE INDEX idx_tool_exec_trace ON tool_executions(trace_id);
CREATE INDEX idx_tool_exec_created ON tool_executions(created_at DESC);
CREATE INDEX idx_tool_exec_escalation ON tool_executions(requires_escalation) WHERE requires_escalation = true;

-- View for execution stats by tool
CREATE VIEW tool_execution_stats AS
SELECT
  tool_id,
  COUNT(*) as total_executions,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'denied') as denied,
  COUNT(*) FILTER (WHERE requires_escalation = true) as escalations,
  AVG(duration_ms) FILTER (WHERE status = 'completed') as avg_duration_ms,
  SUM(tokens_used) as total_tokens
FROM tool_executions
GROUP BY tool_id;

-- View for execution stats by org
CREATE VIEW tool_execution_stats_by_org AS
SELECT
  organization_id,
  tool_id,
  COUNT(*) as total_executions,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'denied') as denied,
  AVG(duration_ms) FILTER (WHERE status = 'completed') as avg_duration_ms
FROM tool_executions
GROUP BY organization_id, tool_id;
