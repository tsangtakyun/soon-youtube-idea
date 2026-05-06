-- ============================================================
-- Table: outlines
-- Status: Inferred from code usage (not verified against production)
-- Audit date: 2026-05-05
-- Audit method: B (code grep)
-- Confidence: medium
--
-- Source code references:
--   - app/api/outline/route.ts:81
--   - app/outline/[id]/page.tsx:7
--
-- WARNING: This file documents the INFERRED schema based on
-- application code usage as of 2026-05-05. It has NOT been validated
-- against the live production Supabase schema. If you intend to run
-- this against an existing production database, FIRST compare against
-- information_schema.columns and resolve any drift.
--
-- Important: content is stored as a JSON string, not a normalized
-- sections table. Cross-repo handoff must parse content to derive
-- structured sections. video_id is a single FK, not an array of linked
-- references.
--
-- Source of truth: production Supabase project. This file is documentation.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.outlines (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references public.viral_videos(id) on delete set null,
  title_zh text,
  content text,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create index if not exists idx_outlines_created_at
  on public.outlines(created_at desc);

-- RLS policies are not inferred. Configure them separately before use.
