-- ============================================================
-- Table: channels
-- Status: Inferred from code usage (not verified against production)
-- Audit date: 2026-05-05
-- Audit method: B (code grep)
-- Confidence: medium
--
-- Source code references:
--   - app/api/channels/route.ts:114
--   - app/api/channels/route.ts:150
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

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  channel_id text unique not null,
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
  created_at timestamptz not null default now()
);

-- RLS policies are not inferred. Configure them separately before use.
