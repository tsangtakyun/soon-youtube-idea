-- ============================================================
-- Table: viral_videos
-- Status: Inferred from code usage (not verified against production)
-- Audit date: 2026-05-05
-- Audit method: B (code grep)
-- Confidence: medium
--
-- Source code references:
--   - app/api/viral-videos/route.ts:147
--   - app/api/scan/route.ts:167
--
-- WARNING: This file documents the INFERRED schema based on
-- application code usage as of 2026-05-05. It has NOT been validated
-- against the live production Supabase schema. If you intend to run
-- this against an existing production database, FIRST compare against
-- information_schema.columns and resolve any drift.
--
-- Cross-repo dependency: script-generator-youtube fetches from this
-- table via referenceIds. The ai_analysis column shape is currently
-- TEXT (or JSON-ish), not normalized into separate angle/virality/signal
-- columns. Cross-Repo Contract v1.1 maps ai_analysis -> aiAngle as
-- best-effort.
--
-- Source of truth: production Supabase project. This file is documentation.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.viral_videos (
  id uuid primary key default gen_random_uuid(),
  video_url text,
  video_id text unique,
  title_original text,
  title_zh text,
  views bigint default 0,
  likes bigint default 0,
  comments bigint default 0,
  duration text,
  publish_date text,
  channel_name text,
  channel_url text,
  subscribers bigint default 0,
  description text,
  region text,
  ai_analysis text,
  outlier_ratio numeric default 0,
  source text,
  selected boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_viral_videos_outlier
  on public.viral_videos(outlier_ratio desc);

-- RLS policies are not inferred. Configure them separately before use.
