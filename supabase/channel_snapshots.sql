-- ============================================================
-- Table: channel_snapshots
-- Status: Inferred from code usage (not verified against production)
-- Audit date: 2026-05-05
-- Audit method: B (code grep)
-- Confidence: medium
--
-- Source code references:
--   - app/api/channels/route.ts:154
--   - app/api/trending/route.ts:127
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

create table if not exists public.channel_snapshots (
  id uuid primary key default gen_random_uuid(),
  channel_id text not null,
  subscribers bigint default 0,
  total_views bigint default 0,
  video_count bigint default 0,
  captured_at timestamptz not null default now()
);

create index if not exists idx_channel_snapshots_channel_captured
  on public.channel_snapshots(channel_id, captured_at desc);

-- RLS policies are not inferred. Configure them separately before use.
