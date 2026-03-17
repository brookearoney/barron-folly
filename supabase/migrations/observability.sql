-- ============================================================================
-- Phase 4.3: Full Observability – trace_spans & audit_log_v2
-- ============================================================================

-- --------------------------------------------------------------------------
-- trace_spans – distributed tracing storage
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trace_spans (
  id            TEXT PRIMARY KEY,
  trace_id      TEXT        NOT NULL,
  parent_span_id TEXT,
  name          TEXT        NOT NULL,
  service       TEXT        NOT NULL,
  operation     TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'completed', 'error')),
  start_time    TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time      TIMESTAMPTZ,
  duration_ms   INTEGER,
  attributes    JSONB       NOT NULL DEFAULT '{}',
  events        JSONB       NOT NULL DEFAULT '[]',
  error         JSONB,
  task_id       TEXT,
  org_id        UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trace_spans_trace_id   ON trace_spans (trace_id);
CREATE INDEX IF NOT EXISTS idx_trace_spans_task_id    ON trace_spans (task_id)    WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trace_spans_org_id     ON trace_spans (org_id)     WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trace_spans_created_at ON trace_spans (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trace_spans_status     ON trace_spans (status)     WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_trace_spans_service    ON trace_spans (service);

-- --------------------------------------------------------------------------
-- audit_log_v2 – structured audit trail (separate from activity_log)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log_v2 (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id    TEXT,
  span_id     TEXT,
  task_id     TEXT,
  org_id      UUID        NOT NULL,
  actor_type  TEXT        NOT NULL CHECK (actor_type IN ('user', 'agent', 'system', 'cron')),
  actor_id    TEXT,
  action      TEXT        NOT NULL,
  resource    TEXT        NOT NULL,
  details     JSONB       NOT NULL DEFAULT '{}',
  risk_level  TEXT        CHECK (risk_level IS NULL OR risk_level IN ('low', 'medium', 'high')),
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_v2_org_id     ON audit_log_v2 (org_id);
CREATE INDEX IF NOT EXISTS idx_audit_v2_trace_id   ON audit_log_v2 (trace_id)   WHERE trace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_v2_task_id    ON audit_log_v2 (task_id)    WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_v2_action     ON audit_log_v2 (action);
CREATE INDEX IF NOT EXISTS idx_audit_v2_created_at ON audit_log_v2 (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_v2_actor      ON audit_log_v2 (actor_type, actor_id);
