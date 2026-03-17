-- ─── Prompt Optimization (Phase 5.3) ─────────────────────────────────────
-- Tables for versioned prompts, performance tracking, and A/B testing.

-- 1. Prompt Versions
create table if not exists prompt_versions (
  id uuid primary key default gen_random_uuid(),
  flow text not null,
  version integer not null default 1,
  name text not null,
  system_prompt text not null,
  user_prompt_template text not null,
  model text not null default 'claude-sonnet-4-20250514',
  temperature numeric(3,2) not null default 0,
  max_tokens integer not null default 4096,
  is_active boolean not null default false,
  is_baseline boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only one active prompt per flow
create unique index if not exists idx_prompt_versions_active
  on prompt_versions (flow) where is_active = true;

-- Only one baseline prompt per flow
create unique index if not exists idx_prompt_versions_baseline
  on prompt_versions (flow) where is_baseline = true;

create index if not exists idx_prompt_versions_flow on prompt_versions (flow);
create index if not exists idx_prompt_versions_flow_version on prompt_versions (flow, version);

-- 2. Prompt Performance Records
create table if not exists prompt_performance (
  id uuid primary key default gen_random_uuid(),
  prompt_version_id uuid not null references prompt_versions(id) on delete cascade,
  flow text not null,
  run_log_id uuid null,
  organization_id uuid null,
  tokens_input integer not null default 0,
  tokens_output integer not null default 0,
  total_tokens integer not null generated always as (tokens_input + tokens_output) stored,
  cost_usd numeric(10,6) not null default 0,
  duration_ms integer not null default 0,
  success boolean not null default true,
  error_message text null,
  quality_score numeric(5,2) null check (quality_score >= 0 and quality_score <= 100),
  quality_source text null check (quality_source in ('auto', 'admin', 'client')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_prompt_performance_version on prompt_performance (prompt_version_id);
create index if not exists idx_prompt_performance_flow on prompt_performance (flow);
create index if not exists idx_prompt_performance_org on prompt_performance (organization_id);
create index if not exists idx_prompt_performance_created on prompt_performance (created_at desc);

-- 3. Prompt A/B Tests
create table if not exists prompt_ab_tests (
  id uuid primary key default gen_random_uuid(),
  flow text not null,
  name text not null,
  description text not null default '',
  variant_a_id uuid not null references prompt_versions(id) on delete cascade,
  variant_b_id uuid not null references prompt_versions(id) on delete cascade,
  split_percentage integer not null default 50 check (split_percentage >= 0 and split_percentage <= 100),
  status text not null default 'draft' check (status in ('draft', 'running', 'paused', 'completed')),
  min_sample_size integer not null default 30,
  start_date timestamptz null,
  end_date timestamptz null,
  winner_id uuid null references prompt_versions(id),
  conclusion text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_prompt_ab_tests_flow on prompt_ab_tests (flow);
create index if not exists idx_prompt_ab_tests_status on prompt_ab_tests (status);

-- Auto-update updated_at
create or replace function update_prompt_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_prompt_versions_updated
  before update on prompt_versions
  for each row execute function update_prompt_updated_at();

create trigger trg_prompt_ab_tests_updated
  before update on prompt_ab_tests
  for each row execute function update_prompt_updated_at();
