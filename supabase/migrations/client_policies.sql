CREATE TABLE client_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Access boundaries
  allowed_categories TEXT[] DEFAULT '{}',
  blocked_categories TEXT[] DEFAULT '{}',
  allowed_environments TEXT[] DEFAULT ARRAY['staging'],
  -- Risk & approval
  risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  regulated BOOLEAN DEFAULT false,
  requires_human_approval_above TEXT DEFAULT 'medium' CHECK (requires_human_approval_above IN ('low', 'medium', 'high')),
  auto_approve_categories TEXT[] DEFAULT '{}',
  -- Autonomy rules (based on tier)
  max_concurrent_agent_tasks INTEGER DEFAULT 2,
  autopilot_enabled BOOLEAN DEFAULT false,
  autopilot_categories TEXT[] DEFAULT '{}',
  -- Guardrails
  code_conventions JSONB DEFAULT '{}',
  do_not_do TEXT[] DEFAULT '{}',
  prod_change_blackout_hours JSONB DEFAULT NULL,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

CREATE INDEX idx_client_policies_org ON client_policies(organization_id);
