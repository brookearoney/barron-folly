CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Channel preferences per notification type
  email_enabled BOOLEAN DEFAULT true,
  slack_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  -- Per-type overrides (null = use defaults above)
  type_overrides JSONB DEFAULT '{}',
  -- Digest settings
  digest_enabled BOOLEAN DEFAULT false,
  digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('hourly', 'daily', 'weekly')),
  digest_last_sent TIMESTAMPTZ,
  -- Quiet hours
  quiet_hours_start INTEGER, -- hour 0-23
  quiet_hours_end INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id)
);
