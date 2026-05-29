-- ============================================================
-- Channel DNA module
-- Purpose: editorial workbench Module 1 channel/series rubric setup.
-- Note: public.channels already exists in this project for YouTube channel
-- tracking. This migration extends it with Channel DNA fields while keeping
-- the existing tracker columns compatible.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  channel_id text unique,
  channel_name text,
  channel_url text,
  region text,
  language text,
  category text,
  subscribers bigint default 0,
  total_views bigint default 0,
  video_count bigint default 0,
  thumbnail_url text,
  update_priority text,
  last_updated_at timestamptz,
  user_id uuid,
  name text,
  positioning text,
  value_shift text,
  tone text,
  rubric_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.channels add column if not exists user_id uuid;
alter table public.channels add column if not exists name text;
alter table public.channels add column if not exists positioning text;
alter table public.channels add column if not exists value_shift text;
alter table public.channels add column if not exists tone text;
alter table public.channels add column if not exists rubric_config jsonb not null default '{}'::jsonb;
alter table public.channels add column if not exists updated_at timestamptz not null default now();

create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  name text not null,
  domain text not null,
  whitespace_context jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_series_channel on public.series(channel_id);
create index if not exists idx_channels_channel_dna on public.channels(created_at desc)
  where positioning is not null;
