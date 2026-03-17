-- Phase 5.1: Advanced RAG + Memory — Task Embeddings Infrastructure
-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Task embeddings table
create table task_embeddings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  request_id uuid not null,
  content text not null,
  embedding vector(1536) not null,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_task_embeddings_org on task_embeddings(organization_id);
create index idx_task_embeddings_request on task_embeddings(request_id);
create index idx_task_embeddings_vector on task_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Full-text search index for hybrid search
alter table task_embeddings add column fts tsvector
  generated always as (to_tsvector('english', content)) stored;
create index idx_task_embeddings_fts on task_embeddings using gin(fts);

-- RPC for similarity search
create or replace function match_task_embeddings(
  query_embedding vector(1536),
  match_org_id uuid,
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  request_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    te.id,
    te.request_id,
    te.content,
    te.metadata,
    1 - (te.embedding <=> query_embedding) as similarity
  from task_embeddings te
  where te.organization_id = match_org_id
    and 1 - (te.embedding <=> query_embedding) > match_threshold
  order by te.embedding <=> query_embedding
  limit match_count;
$$;

-- RPC for hybrid search (semantic + keyword)
create or replace function hybrid_search_embeddings(
  query_embedding vector(1536),
  query_text text,
  match_org_id uuid,
  semantic_weight float default 0.7,
  match_count int default 10
)
returns table (
  id uuid,
  request_id uuid,
  content text,
  metadata jsonb,
  semantic_score float,
  keyword_score float,
  combined_score float
)
language sql stable
as $$
  select
    te.id,
    te.request_id,
    te.content,
    te.metadata,
    (1 - (te.embedding <=> query_embedding))::float as semantic_score,
    coalesce(ts_rank_cd(te.fts, plainto_tsquery('english', query_text)), 0)::float as keyword_score,
    (
      semantic_weight * (1 - (te.embedding <=> query_embedding)) +
      (1 - semantic_weight) * coalesce(ts_rank_cd(te.fts, plainto_tsquery('english', query_text)), 0)
    )::float as combined_score
  from task_embeddings te
  where te.organization_id = match_org_id
    and (
      1 - (te.embedding <=> query_embedding) > 0.3
      or te.fts @@ plainto_tsquery('english', query_text)
    )
  order by combined_score desc
  limit match_count;
$$;

-- RLS
alter table task_embeddings enable row level security;
create policy "Service role full access" on task_embeddings for all using (true) with check (true);
