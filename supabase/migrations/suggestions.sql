-- org_suggestions: Proactive suggestion engine storage
create table org_suggestions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text not null,
  category text,
  rationale text,
  estimated_effort text,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'active' check (status in ('active', 'dismissed', 'requested', 'implemented')),
  request_id uuid references requests(id) on delete set null,
  source text default 'ai' check (source in ('ai', 'admin', 'system', 'trend')),
  confidence float default 0.5,
  tags text[] default '{}',
  expires_at timestamptz,
  dismissed_reason text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_suggestions_org on org_suggestions(organization_id);
create index idx_suggestions_status on org_suggestions(status);
create index idx_suggestions_org_status on org_suggestions(organization_id, status);

-- RLS
alter table org_suggestions enable row level security;
create policy "Org members can view their suggestions" on org_suggestions for select
  using (organization_id in (select organization_id from profiles where id = auth.uid()));
create policy "Service role full access" on org_suggestions for all using (true) with check (true);
