-- ─── Escalation Events ───────────────────────────────────────────────────

create table if not exists escalation_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null,
  organization_id uuid not null references organizations(id) on delete cascade,
  trigger text not null check (trigger in (
    'confidence_drop', 'error_threshold', 'policy_violation',
    'timeout', 'resource_limit', 'anomaly_detected',
    'client_escalation', 'dependency_blocked'
  )),
  previous_level text not null check (previous_level in ('suggest', 'auto_draft', 'auto_execute', 'full_auto')),
  new_level text not null check (new_level in ('suggest', 'auto_draft', 'auto_execute', 'full_auto')),
  details text not null default '',
  resolved boolean not null default false,
  resolved_by uuid references profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes for escalation_events
create index if not exists idx_escalation_events_org on escalation_events(organization_id);
create index if not exists idx_escalation_events_task on escalation_events(task_id);
create index if not exists idx_escalation_events_resolved on escalation_events(resolved) where resolved = false;
create index if not exists idx_escalation_events_trigger on escalation_events(trigger);
create index if not exists idx_escalation_events_created on escalation_events(created_at desc);

-- RLS for escalation_events
alter table escalation_events enable row level security;

create policy "Admins can manage escalation events"
  on escalation_events
  for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

create policy "Org members can view their escalation events"
  on escalation_events
  for select
  to authenticated
  using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

-- ─── Autonomy Overrides ─────────────────────────────────────────────────

create table if not exists autonomy_overrides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  scope text not null check (scope in ('org', 'category', 'task')),
  scope_value text,
  max_autonomy_level text not null check (max_autonomy_level in ('suggest', 'auto_draft', 'auto_execute', 'full_auto')),
  reason text not null default '',
  created_by uuid not null references profiles(id) on delete set null,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Indexes for autonomy_overrides
create index if not exists idx_autonomy_overrides_org on autonomy_overrides(organization_id);
create index if not exists idx_autonomy_overrides_active on autonomy_overrides(active) where active = true;
create index if not exists idx_autonomy_overrides_scope on autonomy_overrides(organization_id, scope, scope_value);
create index if not exists idx_autonomy_overrides_expires on autonomy_overrides(expires_at) where expires_at is not null;

-- RLS for autonomy_overrides
alter table autonomy_overrides enable row level security;

create policy "Admins can manage autonomy overrides"
  on autonomy_overrides
  for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

create policy "Org members can view their autonomy overrides"
  on autonomy_overrides
  for select
  to authenticated
  using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );
