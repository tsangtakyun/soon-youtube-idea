-- ============================================================
-- Table: scan_keywords
-- Status: Inferred from code usage (not verified against production)
-- Audit date: 2026-05-05
-- Audit method: B (code grep)
-- Confidence: medium
--
-- Source code references:
--   - app/api/scan/route.ts:109
--   - app/api/channels/route.ts:86
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

create table if not exists public.scan_keywords (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  category text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS policies are not inferred. Configure them separately before use.
