-- ============================================================
-- Table: channel_videos
-- Status: Inferred from code usage (not verified against production)
-- Audit date: 2026-05-05
-- Audit method: B (code grep)
-- Confidence: medium
--
-- Source code references:
--   - app/api/trending/route.ts:111
--   - app/api/trending/route.ts:179
--
-- WARNING: This file documents the INFERRED schema based on
-- application code usage as of 2026-05-05. It has NOT been validated
-- against the live production Supabase schema. If you intend to run
-- this against an existing production database, FIRST compare against
-- information_schema.columns and resolve any drift.
--
-- Source of truth: production Supabase project. This file is documentation.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.channel_videos (
  id uuid primary key default gen_random_uuid(),
  video_id text unique not null,
  channel_id text,
  channel_name text,
  title text,
  views bigint default 0,
  likes bigint default 0,
  comments bigint default 0,
  subscribers_at_publish bigint default 0,
  outlier_ratio numeric default 0,
  published_at timestamptz,
  region text,
  category text,
  thumbnail_url text,
  is_viral boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_channel_videos_outlier
  on public.channel_videos(outlier_ratio desc);

-- RLS policies are not inferred. Configure them separately before use.
