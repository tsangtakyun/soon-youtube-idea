-- ============================================================
-- Channel DNA module
-- Purpose: editorial workbench Module 1 channel/series rubric setup.
-- Note: Channel DNA uses ew_ prefixed tables to avoid colliding with shared
-- master tables used by other tools.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.ew_channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text,
  positioning text,
  value_shift text,
  tone text,
  rubric_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ew_channels add column if not exists user_id uuid;
alter table public.ew_channels add column if not exists name text;
alter table public.ew_channels add column if not exists positioning text;
alter table public.ew_channels add column if not exists value_shift text;
alter table public.ew_channels add column if not exists tone text;
alter table public.ew_channels add column if not exists rubric_config jsonb not null default '{}'::jsonb;
alter table public.ew_channels add column if not exists updated_at timestamptz not null default now();

create table if not exists public.ew_series (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.ew_channels(id) on delete cascade,
  name text not null,
  domain text not null,
  whitespace_context jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ew_series_channel on public.ew_series(channel_id);
create index if not exists idx_ew_channels_channel_dna on public.ew_channels(created_at desc)
  where positioning is not null;
