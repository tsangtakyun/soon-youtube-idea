-- ============================================================
-- ew_series generation defaults
-- Purpose: add series-level editorial direction and default engine keys.
-- Rollback:
--   alter table public.ew_series drop column if exists default_hook;
--   alter table public.ew_series drop column if exists default_tone;
--   alter table public.ew_series drop column if exists description;
-- ============================================================

begin;

alter table public.ew_series
  add column if not exists description text,
  add column if not exists default_tone text,
  add column if not exists default_hook text;

commit;
