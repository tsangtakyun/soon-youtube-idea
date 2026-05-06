-- ============================================================
-- Table: topic_signals
-- Status: Inferred from code usage (not verified against production)
-- Audit date: 2026-05-05
-- Audit method: B (code grep)
-- Confidence: medium
--
-- Source code references:
--   - app/api/scan/route.ts:218
--   - app/api/topic-signals/route.ts:11
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

create table if not exists public.topic_signals (
  id uuid primary key default gen_random_uuid(),
  topic_zh text not null,
  topic_en text,
  keywords text[] default '{}',
  signal_count integer default 0,
  max_outlier_ratio numeric default 0,
  avg_outlier_ratio numeric default 0,
  related_video_urls text[] default '{}',
  related_channels text[] default '{}',
  ai_analysis text,
  soon_angle text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists idx_topic_signals_outlier
  on public.topic_signals(max_outlier_ratio desc);

-- RLS policies are not inferred. Configure them separately before use.
